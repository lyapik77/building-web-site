const { Sequelize } = require('sequelize')

// Значения по умолчанию совпадают с прежними, но их можно переопределить в .env
module.exports = new Sequelize(
    process.env.DB_NAME || 'buildingdb',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '1234',
    {
        dialect: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        logging: false
    }
)
