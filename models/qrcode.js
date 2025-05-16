//New Class based Sequelize implementation
const {Sequelize, Model, DataTypes} = require('sequelize')
const appEnvironment = process.env.NODE_ENV || "development";
const config = require('../config.json')[appEnvironment];

const database = config.database
const username = config.username
const password = config.password

const sequelize = new Sequelize(database, username, password, config)


class QrCode extends Model {

}

QrCode.init({
    //model attributes
    id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
    },
    title: {
        type: DataTypes.STRING
    },
    productId: {
        type: DataTypes.STRING
    },
    productVariantId: {
        type: DataTypes.STRING
    },
    productHandle: {
        type: DataTypes.STRING
    },
    scans: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    createdAt: {
        field: 'created_at',
        type: DataTypes.DATE,
    }
}, 
{
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'QrCode', // We need to choose the Model Name (Table Name)
},
)

module.exports = QrCode