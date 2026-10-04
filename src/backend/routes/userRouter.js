const Router = require('express')
const router = new Router()
const userController = require('../controllers/userController')
const authMiddleware = require('../middleware/authMiddleware')
const checkRole = require('../middleware/checkRolemiddleware')

router.post('/registration', userController.registration)
router.post('/login', userController.login)
router.get('/auth', authMiddleware, userController.check)
router.post('/users', checkRole('ADMIN', 'MANAGER'), userController.findAll)
router.post('/usersEmail', checkRole('ADMIN', 'MANAGER'), userController.findEmail)
router.delete('/:id', checkRole('ADMIN'), userController.deleteUser )

module.exports = router