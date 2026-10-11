// Создание первого администратора:
//   node src/backend/scripts/createAdmin.js admin@example.com 'Пароль123' Имя Фамилия +79990000000
// Если пользователь с таким email уже есть, ему выдаётся роль ADMIN.
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') })
const bcrypt = require('bcrypt')
const sequelize = require('../config/configdb')
const { User } = require('../models/models')

async function main() {
    const [email, password, name = 'Admin', surname = 'Admin', phone = '+70000000000'] = process.argv.slice(2)
    if (!email || !password) {
        console.log('Использование: node createAdmin.js <email> <пароль> [имя] [фамилия] [телефон]')
        process.exit(1)
    }
    await sequelize.sync()
    const normEmail = email.trim().toLowerCase()
    const existing = await User.findOne({ where: { email: normEmail } })
    if (existing) {
        await existing.update({ role: 'ADMIN' })
        console.log(`Пользователю ${normEmail} выдана роль ADMIN`)
    } else {
        await User.create({
            name, surname, phone, email: normEmail,
            password: await bcrypt.hash(password, 8),
            role: 'ADMIN'
        })
        console.log(`Администратор ${normEmail} создан`)
    }
    await sequelize.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
