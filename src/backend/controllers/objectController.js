const { User, Request, Review, Object } = require('../models/models')

class objectController {
    async getAll(req, res) {
        try {
            const object = await Object.findAll()
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
            await Object.create({
                name,
                location,
            })
            return res.status(201).json({
                message: 'Объект успешно создан'
            })
        } catch (error) {
            return res.status(402).json({
                message: 'Ошибка создания объекта'
            })
        }
    }

    async updateStatus(req, res) {
        try {
            const { id } = req.params
            const { status } = req.body
            const candidate = await Object.findByPk(id)
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
}


module.exports = new objectController()