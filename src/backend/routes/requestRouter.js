const Router = require('express')
const router = new Router()
const requestController = require('../controllers/requestController')
const authMiddleware = require('../middleware/authMiddleware')
const optionalAuth = require('../middleware/optionalAuthMiddleware')
const checkRole = require('../middleware/checkRolemiddleware')

// Заявку может оставить и гость, и клиент (тогда она привяжется к аккаунту)
router.post('/createRequest', optionalAuth, requestController.createRequest)
router.get('/my', authMiddleware, requestController.my)
router.get('/getRequest', checkRole('ADMIN', 'MANAGER'), requestController.getAll)
router.put('/updateStatus/:id', checkRole('ADMIN', 'MANAGER'), requestController.updateStatus)
router.delete('/:id', checkRole('ADMIN'), requestController.deleteRequest)

module.exports = router
