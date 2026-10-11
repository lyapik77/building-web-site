const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User } = require('../models/models')

const ROLES = ['USER', 'MANAGER', 'ADMIN']
const PUBLIC_FIELDS = ['id', 'name', 'surname', 'email', 'phone', 'role', 'createdAt']

function generateJwt(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.SECRET_KEY,
        { expiresIn: '24h' }
    )
}

function publicUser(user) {
    const { password, ...rest } = user.toJSON ? user.toJSON() : user
    return rest
}

function capitalize(str) {
    const s = String(str).trim()
    return s.charAt(0).toUpperCase() + s.slice(1)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

class userController {
    async registration(req, res) {
        try {
            // role из тела запроса намеренно игнорируется: через регистрацию создаются только клиенты
            const { name, surname, phone, email, password } = req.body
            if (!name || !surname || !phone || !email || !password) {
                return res.status(400).json({ message: 'Все поля должны быть заполнены' })
            }
            if (!EMAIL_RE.test(email)) {
                return res.status(400).json({ message: 'Некорректный email' })
            }
            if (String(password).length < 6) {
                return res.status(400).json({ message: 'Пароль должен быть не короче 6 символов' })
            }
            const normEmail = String(email).trim().toLowerCase()
            const candidate = await User.findOne({ where: { email: normEmail } })
            if (candidate) {
                return res.status(409).json({ message: 'Такой пользователь уже существует' })
            }
            const hashPassword = await bcrypt.hash(password, 8)
            const newUser = await User.create({
                name: capitalize(name),
                surname: capitalize(surname),
                email: normEmail,
                phone: String(phone).trim(),
                password: hashPassword,
                role: 'USER'
            })
            return res.status(200).json({
                message: 'Пользователь успешно создан',
                token: generateJwt(newUser),
                user: publicUser(newUser)
            })
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: 'Ошибка создания пользователя' })
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body
            if (!email || !password) {
                return res.status(400).json({ message: 'Введите email и пароль' })
            }
            const candidate = await User.findOne({ where: { email: String(email).trim().toLowerCase() } })
            if (!candidate) {
                return res.status(404).json({ message: 'Пользователь не найден' })
            }
            const match = await bcrypt.compare(password, candidate.password)
            if (!match) {
                return res.status(401).json({ message: 'Пароль неверный' })
            }
            return res.status(200).json({
                message: 'Пользователь успешно авторизировался',
                token: generateJwt(candidate),
                user: publicUser(candidate)
            })
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: 'Ошибка в авторизации' })
        }
    }

    // Проверка токена: возвращает свежий токен и актуальные данные пользователя
    async check(req, res) {
        try {
            const user = await User.findByPk(req.user.id)
            if (!user) {
                return res.status(401).json({ message: 'Пользователь не найден' })
            }
            return res.json({ token: generateJwt(user), user: publicUser(user) })
        } catch (error) {
            console.error('check:', error)
            return res.status(500).json({ message: 'Ошибка проверки токена' })
        }
    }

    async me(req, res) {
        try {
            const user = await User.findByPk(req.user.id, { attributes: PUBLIC_FIELDS })
            if (!user) {
                return res.status(404).json({ message: 'Пользователь не найден' })
            }
            return res.json(user)
        } catch (error) {
            return res.status(500).json({ message: 'Ошибка получения профиля' })
        }
    }

    async updateMe(req, res) {
        try {
            const user = await User.findByPk(req.user.id)
            if (!user) {
                return res.status(404).json({ message: 'Пользователь не найден' })
            }
            const { name, surname, phone } = req.body
            if (name !== undefined && !String(name).trim()) {
                return res.status(400).json({ message: 'Имя не может быть пустым' })
            }
            if (surname !== undefined && !String(surname).trim()) {
                return res.status(400).json({ message: 'Фамилия не может быть пустой' })
            }
            await user.update({
                name: name !== undefined ? capitalize(name) : user.name,
                surname: surname !== undefined ? capitalize(surname) : user.surname,
                phone: phone !== undefined ? String(phone).trim() : user.phone
            })
            return res.json({ message: 'Профиль обновлён', user: publicUser(user) })
        } catch (error) {
            return res.status(500).json({ message: 'Ошибка обновления профиля' })
        }
    }

    async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body
            if (!oldPassword || !newPassword) {
                return res.status(400).json({ message: 'Заполните оба поля' })
            }
            if (String(newPassword).length < 6) {
                return res.status(400).json({ message: 'Новый пароль должен быть не короче 6 символов' })
            }
            const user = await User.findByPk(req.user.id)
            if (!user) {
                return res.status(404).json({ message: 'Пользователь не найден' })
            }
            const match = await bcrypt.compare(oldPassword, user.password)
            if (!match) {
                return res.status(401).json({ message: 'Текущий пароль неверный' })
            }
            await user.update({ password: await bcrypt.hash(newPassword, 8) })
            return res.json({ message: 'Пароль изменён' })
        } catch (error) {
            return res.status(500).json({ message: 'Ошибка смены пароля' })
        }
    }

    // ADMIN: создать сотрудника (MANAGER / ADMIN) или клиента
    async createStaff(req, res) {
        try {
            const { name, surname, phone, email, password, role } = req.body
            if (!name || !surname || !phone || !email || !password) {
                return res.status(400).json({ message: 'Все поля должны быть заполнены' })
            }
            if (!ROLES.includes(role)) {
                return res.status(400).json({ message: 'Недопустимая роль' })
            }
            if (!EMAIL_RE.test(email)) {
                return res.status(400).json({ message: 'Некорректный email' })
            }
            if (String(password).length < 6) {
                return res.status(400).json({ message: 'Пароль должен быть не короче 6 символов' })
            }
            const normEmail = String(email).trim().toLowerCase()
            if (await User.findOne({ where: { email: normEmail } })) {
                return res.status(409).json({ message: 'Такой пользователь уже существует' })
            }
            const created = await User.create({
                name: capitalize(name),
                surname: capitalize(surname),
                email: normEmail,
                phone: String(phone).trim(),
                password: await bcrypt.hash(password, 8),
                role
            })
            return res.status(201).json({ message: 'Пользователь создан', user: publicUser(created) })
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: 'Ошибка создания пользователя' })
        }
    }

    // ADMIN: сменить роль
    async updateRole(req, res) {
        try {
            const { id } = req.params
            const { role } = req.body
            if (!ROLES.includes(role)) {
                return res.status(400).json({ message: 'Недопустимая роль' })
            }
            if (Number(id) === req.user.id) {
                return res.status(400).json({ message: 'Нельзя менять собственную роль' })
            }
            const candidate = await User.findByPk(id)
            if (!candidate) {
                return res.status(404).json({ message: 'Пользователь не найден' })
            }
            await candidate.update({ role })
            return res.json({ message: 'Роль обновлена', user: publicUser(candidate) })
        } catch (error) {
            return res.status(500).json({ message: 'Ошибка обновления роли' })
        }
    }

    async deleteUser(req, res) {
        try {
            const { id } = req.params
            if (Number(id) === req.user.id) {
                return res.status(400).json({ message: 'Нельзя удалить самого себя' })
            }
            const candidate = await User.findByPk(id)
            if (!candidate) {
                return res.status(404).json({ message: 'Пользователь не найден' })
            }
            await candidate.destroy()
            return res.status(200).json({ message: 'Пользователь успешно удален' })
        } catch (error) {
            return res.status(500).json({ message: 'Ошибка в удалении пользователя' })
        }
    }

    async findAll(req, res) {
        try {
            const users = await User.findAll({ attributes: PUBLIC_FIELDS, order: [['id', 'ASC']] })
            return res.send(users)
        } catch (error) {
            return res.status(500).json({ message: 'Ресурс не найден' })
        }
    }

    async findEmail(req, res) {
        try {
            const { email } = req.body
            const candidate = await User.findOne({
                where: { email: String(email || '').trim().toLowerCase() },
                attributes: PUBLIC_FIELDS
            })
            if (!candidate) {
                return res.status(404).json({ message: 'Пользователь не найден' })
            }
            return res.status(200).send(candidate)
        } catch (error) {
            return res.status(500).json({ message: 'Ресурс не найден' })
        }
    }
}

module.exports = new userController()
