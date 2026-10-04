const sequelize = require('../config/configdb')
const { DataTypes } = require('sequelize')

const User = sequelize.define('Users', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    surname: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, validate: { isEmail: true } },
    phone: { type: DataTypes.STRING },
    password: { type: DataTypes.STRING, validate: { min: 6 } },
    role: { type: DataTypes.ENUM('ADMIN', 'USER', 'MANAGER'), defaultValue: 'USER' }
}, {
    updateAt: false
})

const Request = sequelize.define('Requests', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, validate: { isEmail: true } },
    status: {type: DataTypes.ENUM('Processed', 'Waiting'), defaultValue: 'Waiting'}
}, {
    updateAt: false
})

const Object = sequelize.define('Objects', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    location: { type: DataTypes.STRING },
    status: { type: DataTypes.ENUM('Completed', 'inProcess', 'Suspended', 'Closed'), defaultValue: 'inProcess' }
}, {
    timestamp: true
})

Object.belongsToMany(User, {
    through: 'objectUser',
    foreignKey: 'objectId',
    otherKey: 'userId',
    as: 'users'
});

User.belongsToMany(Object, {
    through: 'objectUser',
    foreignKey: 'userId',
    otherKey: 'objectId',
    as: 'objects'
});

User.hasMany(Request)
Request.belongsTo(User)

module.exports = { User, Request, Object }
