const Router = require('express')
const router = new Router()
const objectController = require('../controllers/objectController')
const authMiddleware = require('../middleware/authMiddleware')
const checkRole = require('../middleware/checkRolemiddleware')

router.get('/my', authMiddleware, objectController.my)
router.get('/findAll', checkRole('ADMIN', 'MANAGER'), objectController.getAll)
router.post('/findName', checkRole('ADMIN', 'MANAGER'), objectController.findName)
router.post('/create', checkRole('ADMIN', 'MANAGER'), objectController.createObj)
router.put('/update/:id', checkRole('ADMIN', 'MANAGER'), objectController.updateStatus)
router.post('/:id/users', checkRole('ADMIN', 'MANAGER'), objectController.addUser)
router.delete('/:id/users/:userId', checkRole('ADMIN', 'MANAGER'), objectController.removeUser)
router.delete('/:id', checkRole('ADMIN'), objectController.deleteObj)

module.exports = router
