const { User, Request, Review, Object } = require('../models/models')

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


    async getAll(req, res) {
        try {
            const request = await Request.findAll()
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
            const candidate = await Request.findByPk(id)
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
            await candidate.destroy()
            return res.status(200).json({
                message: 'Заявка успешно удалена'
            })
        } catch (error) {
            return res.status(200).json({
                message: 'Ошибка в удалении заявки'
            })
        }
    }

}

module.exports = new requestController()