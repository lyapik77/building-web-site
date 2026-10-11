const jwt = require('jsonwebtoken')

// Если токен есть и валиден — заполняет req.user, иначе пропускает дальше как гостя.
module.exports = function (req, res, next) {
    const header = req.headers.authorization
    if (header) {
        const token = header.split(' ')[1]
        try {
            req.user = jwt.verify(token, process.env.SECRET_KEY)
        } catch (error) {
            // невалидный токен трактуем как гостя
        }
    }
    next()
}
