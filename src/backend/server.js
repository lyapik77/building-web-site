require('dotenv').config()
const express = require('express')
const app = express()
const PORT = process.env.PORT
const cors = require('cors')
const sequelize = require('./config/configdb')
const models = require('./models/models')
const router = require('./routes/routes')
const path = require('path')

const FRONT = path.join(__dirname, '..', 'frontend')

app.use(express.json())
app.use(cors())
app.use('/api', router)

// Раздача фронтенда с того же origin, что и API (CORS не нужен)
app.use('/style', express.static(path.join(FRONT, 'style')))
app.use('/script', express.static(path.join(FRONT, 'script')))
app.use('/img', express.static(path.join(FRONT, 'img')))
app.use('/pages', express.static(path.join(FRONT, 'pages')))
const page = (file) => (req, res) => res.sendFile(path.join(FRONT, 'pages', file))
app.get('/', page('index.html'))
app.get('/login', page('login.html'))
app.get('/staff-login', page('staff-login.html'))
app.get('/account', page('account.html'))
app.get('/staff', page('staff.html'))
app.get('/privacy', page('privacy.html'))

async function start() {
    try {
        await sequelize.authenticate()
        await sequelize.sync()

        app.listen(PORT, () => {
            console.log(`Server started to http://localhost:${PORT}`)
        })
    } catch (error) {
        console.log('Server error', error)
    }
}
start()