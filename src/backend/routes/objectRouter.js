const Router = require('express')
const router = new Router()
const objectController = require('../controllers/objectController')
const authMiddleware = require('../middleware/authMiddleware')
const checkRole = require('../middleware/checkRolemiddleware')

router.get('/findAll', checkRole('ADMIN', 'MANAGER'), objectController.getAll)
router.get('/findName', checkRole('ADMIN', 'MANAGER'), objectController.findName)
router.post('/create',checkRole('ADMIN', 'MANAGER'), objectController.createObj)
router.put('/update', checkRole('ADMIN', 'MANAGER'), objectController.updateStatus)

module.exports = router