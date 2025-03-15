//New Class based Sequelize implementation
const {Sequelize, Model, DataTypes} = require('sequelize')
const appEnvironment = process.env.NODE_ENV || "development";
const config = require('../config.json')[appEnvironment];

const database = config.database
const username = config.username
const password = config.password

const sequelize = new Sequelize(database, username, password, config)


class Customer extends Model {
    
}

Customer.init({
    //model attributes
    id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
    },
    shopify_api_id: {
        type: DataTypes.STRING
    },
    first_name: {
        type: DataTypes.STRING,
        notEmpty: true
    },
    email: {
        type: DataTypes.STRING,
        notEmpty: true
        
    },
    createdAt: {
        field: 'created_at',
        type: DataTypes.DATE,
    },
    updatedAt: {
        field: 'updated_at',
        type: DataTypes.DATE,
    }
}, 
{
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'Customer', // We need to choose the Model Name (Table Name)
},
)

module.exports = Customer