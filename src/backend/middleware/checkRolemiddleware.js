const jwt = require('jsonwebtoken')

// checkRole('ADMIN', 'MANAGER') — пускает любую из перечисленных ролей.
module.exports = function (...roles) {
    const allowed = roles.flat()
    return function (req, res, next) {
        if (req.method === 'OPTIONS') {
            return next()
        }
        if (!req.headers.authorization) {
            return res.status(401).json({ message: 'Нет заголовка авторизации' })
        }
        try {
            const token = req.headers.authorization.split(' ')[1]
            if (!token) {
                return res.status(401).json({ message: 'Токен не предоставлен' })
            }
            const decoded = jwt.verify(token, process.env.SECRET_KEY)
            if (!allowed.includes(decoded.role)) {
                return res.status(403).json({ message: 'Нет доступа' })
            }
            req.user = decoded
            next()
        } catch (error) {
            return res.status(401).json({ message: 'Ошибка авторизации' })
        }
    }
}
