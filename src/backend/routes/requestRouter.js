const Router = require('express')
const router = new Router()
const requestController = require('../controllers/requestController')
const authMiddleware = require('../middleware/authMiddleware')
const checkRole = require('../middleware/checkRolemiddleware')

router.post('/createRequest', requestController.createRequest)
router.get('/getRequest', checkRole('ADMIN', 'MANAGER'), requestController.getAll)
router.put('/updateStatus', checkRole('ADMIN', 'MANAGER'), requestController.updateStatus)
router.delete('/:id', checkRole('ADMIN'), requestController.deleteRequest)

module.exports = router