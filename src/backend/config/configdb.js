const { Sequelize } = require('sequelize')

module.exports = new Sequelize('buildingdb', 'postgres', '0000', {
    dialect: 'postgres'
})