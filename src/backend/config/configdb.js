const { Sequelize } = require('sequelize')

module.exports = new Sequelize('buildingdb', 'postgres', '1234', {
    dialect: 'postgres'
})