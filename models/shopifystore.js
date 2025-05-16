//New Class based Sequelize implementation
const {Sequelize, Model, DataTypes} = require('sequelize')
const appEnvironment = process.env.NODE_ENV || "development";
const config = require('../config.json')[appEnvironment];

const database = config.database
const username = config.username
const password = config.password

const sequelize = new Sequelize(database, username, password, config)


class ShopifyStore extends Model {
    // Define any custom methods or static methods here
}

ShopifyStore.init({
    //model attributes
    id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
    },
    myshopify_domain: {
        type: DataTypes.STRING
    },
    state: {
        type: DataTypes.STRING
    },
    isOnline: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    scope: {
        type: DataTypes.STRING
    },
    accessToken: {
        type: DataTypes.STRING
    }
}, 
{
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'ShopifyStore', // We need to choose the Model Name (Table Name)
},
)

module.exports = ShopifyStore