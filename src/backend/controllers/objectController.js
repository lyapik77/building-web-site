const { User, Object } = require('../models/models')

const OBJECT_STATUSES = ['Completed', 'inProcess', 'Suspended', 'Closed']
const USER_ATTRS = ['id', 'name', 'surname', 'email', 'phone']

class objectController {
    async getAll(req, res) {
        try {
            const object = await Object.findAll({
                include: [{ model: User, as: 'users', attributes: USER_ATTRS, through: { attributes: [] } }],
                order: [['id', 'DESC']]
            })
            return res.send(object)
        } catch (error) {
            res.status(404).json({
                message: 'Ресурс не найден'
            })
        }
    }

    async findName(req, res) {
        try {
            const { name } = req.body
            const candidate = await Object.findOne({ where: { name } });
            if (!candidate) {
                return res.status(404).json({ message: 'Объект не найден' });
            }
            return res.status(200).send(candidate);
        } catch (error) {
            return res.status(500).json({ message: 'Объект не найден' });
        }
    }

    async createObj(req, res) {
        try {
            const { name, location } = req.body
            if (!name || !location) {
                return res.status(400).json({
                    message: 'Поля должны быть обязательно заполнены'
                });
            }
            const created = await Object.create({
                name,
                location,
            })
            return res.status(201).json({
                message: 'Объект успешно создан',
                object: created
            })
        } catch (error) {
            return res.status(500).json({
                message: 'Ошибка создания объекта'
            })
        }
    }

    async updateStatus(req, res) {
        try {
            const { id } = req.params
            const { status } = req.body
            if (!OBJECT_STATUSES.includes(status)) {
                return res.status(400).json({ message: 'Недопустимый статус' })
            }
            const candidate = await Object.findByPk(id)
            if (!candidate) {
                return res.status(404).json({ message: 'Объект не найден' })
            }
            await candidate.update({ status })
            return res.status(200).json({
                message: 'Статус успешно обновлен'
            })
        } catch (error) {
            return res.status(404).json({
                message: 'Ошибка в обновлении статуса'
            })
        }
    }

    // Объекты, привязанные к текущему клиенту
    async my(req, res) {
        try {
            const user = await User.findByPk(req.user.id)
            if (!user) {
                return res.status(404).json({ message: 'Пользователь не найден' })
            }
            const objects = await user.getObjects({ joinTableAttributes: [], order: [['id', 'DESC']] })
            return res.send(objects)
        } catch (error) {
            return res.status(500).json({ message: 'Ошибка получения объектов' })
        }
    }

    // Привязать клиента к объекту по userId или email
    async addUser(req, res) {
        try {
            const { id } = req.params
            const { userId, email } = req.body
            const obj = await Object.findByPk(id)
            if (!obj) {
                return res.status(404).json({ message: 'Объект не найден' })
            }
            const where = userId ? { id: userId } : { email: String(email || '').trim().toLowerCase() }
            const user = await User.findOne({ where })
            if (!user) {
                return res.status(404).json({ message: 'Пользователь не найден' })
            }
            await obj.addUser(user)
            return res.json({ message: 'Клиент привязан к объекту' })
        } catch (error) {
            return res.status(500).json({ message: 'Ошибка привязки клиента' })
        }
    }

    async removeUser(req, res) {
        try {
            const { id, userId } = req.params
            const obj = await Object.findByPk(id)
            if (!obj) {
                return res.status(404).json({ message: 'Объект не найден' })
            }
            await obj.removeUser(userId)
            return res.json({ message: 'Клиент отвязан от объекта' })
        } catch (error) {
            return res.status(500).json({ message: 'Ошибка отвязки клиента' })
        }
    }

    async deleteObj(req, res) {
        try {
            const obj = await Object.findByPk(req.params.id)
            if (!obj) {
                return res.status(404).json({ message: 'Объект не найден' })
            }
            await obj.destroy()
            return res.json({ message: 'Объект удалён' })
        } catch (error) {
            return res.status(500).json({ message: 'Ошибка удаления объекта' })
        }
    }
}


module.exports = new objectController()