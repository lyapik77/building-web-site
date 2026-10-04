const Router = require('express')
const router = new Router()
const userRouter = require('./userRouter')
const requestRouter = require('./requestRouter')
const objectRouter = require('./objectRouter')

router.use('/user', userRouter)
router.use('/request', requestRouter)
router.use('/object', objectRouter)

module.exports = router