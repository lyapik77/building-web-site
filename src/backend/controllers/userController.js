const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User, Request, Object } = require('../models/models')

function generateJwt(id, email, role) {
    return jwt.sign(
        { id, email, role },
        process.env.SECRET_KEY,
        { expiresIn: '24h' }
    );
}

class userController {
    async registration(req, res) {
        try {
            const { name, surname, phone, email, password, role } = req.body
            if (!name || !surname || !phone || !email || !password) {
                return res.status(400).json({ message: 'Все поля должны быть заполнены' })
            }
            const candidate = await User.findOne({ where: { email } })
            if (candidate) {
                return res.status(404).json({ message: 'Такой пользователь уже существует' })
            }
            const hashPassword = await bcrypt.hash(password, 8)
            const username = name.charAt(0).toUpperCase() + name.slice(1);
            const surnameuser = surname.charAt(0).toUpperCase() + surname.slice(1);

            const new_user = await User.create({
                name: username,
                surname: surnameuser,
                email,
                phone,
                password: hashPassword,
                role
            })
            const token = jwt.sign(
                { email: new_user.email, role: new_user.role },
                process.env.SECRET_KEY,
                { expiresIn: '24h' }
            )

            return res.status(200).json({ message: 'Пользователь успешно создан', token: token })
        } catch (error) {
            console.log(error)
            return res.status(404).json({ message: 'Ошибка создания пользователя' })
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body
            const candidate = await User.findOne({ where: { email } })
            if (!candidate) {
                return res.status(404).json({ message: 'Пользователь не найден' })
            }
            const match = await bcrypt.compareSync(password, candidate.password)
            if (!match) {
                return res.status(404).json({ message: 'Пароль неверный' })
            }
            const token = jwt.sign(
                { email: candidate.email, role: candidate.role },
                process.env.SECRET_KEY,
                { expiresIn: '24h' }
            )

            return res.status(200).json({ message: 'Пользователь успешно авторизировался', token: token })
        } catch (error) {
            return res.status(404).json({ message: 'Ошибка в авторизации' })
        }
    }

    async check(req, res) {
        try {
            const token = generateJwt(req.user.id, req.user.email, req.user.role);
            return res.json({ token });
        } catch (error) {
            console.error('check:', error);
            return res.status(500).json({ message: 'Ошибка проверки токена' });
        }
    }

    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const candidate = await User.findByPk(id);
            if (!candidate) {
                return res.status(404).json({ message: 'Пользователь не найден' });
            }
            await candidate.destroy();
            return res.status(200).json({ message: 'Пользователь успешно удален' });
        } catch (error) {
            return res.status(500).json({ message: 'Ошибка в удалении пользователя' });
        }
    }

    async findAll(req, res) {
        try {
            const user = await User.findAll();
            return res.send(user);
        } catch (error) {
            return res.status(500).json({ message: 'Ресурс не найден' });
        }
    }

    async findEmail(req, res) {
        try {
            const { email } = req.body;
            const candidate = await User.findOne({ where: { email } });
            if (!candidate) {
                return res.status(404).json({ message: 'Пользователь не найден' });
            }
            return res.status(200).send(candidate);
        } catch (error) {
            return res.status(500).json({ message: 'Ресурс не найден' });
        }
    }
}

module.exports = new userController()