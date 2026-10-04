require('dotenv').config()
const express = require('express')
const app = express()
const PORT = process.env.PORT
const cors = require('cors')
const sequelize = require('./config/configdb')
const models = require('./models/models')
const router = require('./routes/routes')

app.use(express.json())
app.use(cors())
app.use('/api', router)

async function start() {
    try {
        await sequelize.authenticate()
        await sequelize.sync()

        app.listen(PORT, () => {
            console.log(`Server started to http://localhost:${PORT}`)
        })
    } catch (error) {
        console.log('Server error')
    }
}
start()