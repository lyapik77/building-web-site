const Router = require('express')
const router = new Router()
const userController = require('../controllers/userController')
const authMiddleware = require('../middleware/authMiddleware')
const checkRole = require('../middleware/checkRolemiddleware')

router.post('/registration', userController.registration)
router.post('/login', userController.login)
router.get('/auth', authMiddleware, userController.check)

// Профиль текущего пользователя (любая роль)
router.get('/me', authMiddleware, userController.me)
router.put('/me', authMiddleware, userController.updateMe)
router.put('/me/password', authMiddleware, userController.changePassword)

// Сотрудники
router.post('/users', checkRole('ADMIN', 'MANAGER'), userController.findAll)
router.post('/usersEmail', checkRole('ADMIN', 'MANAGER'), userController.findEmail)

// Только администратор
router.post('/create', checkRole('ADMIN'), userController.createStaff)
router.put('/:id/role', checkRole('ADMIN'), userController.updateRole)
router.delete('/:id', checkRole('ADMIN'), userController.deleteUser)

module.exports = router
