const { User, Request } = require('../models/models')

const REQUEST_STATUSES = ['Processed', 'Waiting']

class requestController {

    async createRequest(req, res) {
        try {
            const { name, phone, email } = req.body
            if (!name || !phone || !email) {
                return res.status(400).json({
                    message: 'Поля name, phone и email обязательны'
                });
            }

            const digits = String(phone).replace(/\D/g, '');
            const normalized = digits.length === 11 && digits.startsWith('8')
                ? '7' + digits.slice(1)
                : digits.length === 10
                    ? '7' + digits
                    : digits;

            if (!/^7\d{10}$/.test(normalized)) {
                return res.status(400).json({
                    message: 'Некорректный номер телефона'
                });
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({
                    message: 'Некорректный email'
                });
            }
            await Request.create({
                name: name.trim(),
                phone: normalized,
                email: email.trim().toLowerCase(),
                // если заявку отправил авторизованный клиент — привязываем её к нему
                UserId: req.user && req.user.role === 'USER' ? req.user.id : null
            })
            return res.status(201).json({
                message: 'Заявка успешно создана'
            })
        } catch (error) {
            return res.status(400).json({
                message: 'Ошибка создания заявки'
            })
        }
    }


    // Заявки текущего клиента: привязанные к его аккаунту и поданные с его email
    async my(req, res) {
        try {
            const user = await User.findByPk(req.user.id)
            if (!user) {
                return res.status(404).json({ message: 'Пользователь не найден' })
            }
            const { Op } = require('sequelize')
            const requests = await Request.findAll({
                where: { [Op.or]: [{ UserId: user.id }, { email: user.email }] },
                order: [['createdAt', 'DESC']]
            })
            return res.send(requests)
        } catch (error) {
            return res.status(500).json({ message: 'Ошибка получения заявок' })
        }
    }

    async getAll(req, res) {
        try {
            const request = await Request.findAll({ order: [['createdAt', 'DESC']] })
            return res.send(request)
        } catch (error) {
            res.status(404).json({
                message: 'Ресурс не найден'
            })
        }
    }

    async updateStatus(req, res) {
        try {
            const { id } = req.params
            const { status } = req.body
            if (!REQUEST_STATUSES.includes(status)) {
                return res.status(400).json({ message: 'Недопустимый статус' })
            }
            const candidate = await Request.findByPk(id)
            if (!candidate) {
                return res.status(404).json({ message: 'Заявка не найдена' })
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

    async deleteRequest(req, res) {
        try {
            const { id } = req.params
            const candidate = await Request.findByPk(id)
            if (!candidate) {
                return res.status(404).json({ message: 'Заявка не найдена' })
            }
            await candidate.destroy()
            return res.status(200).json({
                message: 'Заявка успешно удалена'
            })
        } catch (error) {
            return res.status(500).json({
                message: 'Ошибка в удалении заявки'
            })
        }
    }

}

module.exports = new requestController()