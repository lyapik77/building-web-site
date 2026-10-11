const jwt = require('jsonwebtoken')

// Требует валидный JWT. Кладёт payload в req.user.
module.exports = function (req, res, next) {
    if (req.method === 'OPTIONS') {
        return next()
    }
    const header = req.headers.authorization
    if (!header) {
        return res.status(401).json({ message: 'Нет заголовка авторизации' })
    }
    const token = header.split(' ')[1]
    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' })
    }
    try {
        req.user = jwt.verify(token, process.env.SECRET_KEY)
        next()
    } catch (error) {
        return res.status(401).json({ message: 'Ошибка авторизации' })
    }
}
