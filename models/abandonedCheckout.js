//New Class based Sequelize implementation
const {Sequelize, Model, DataTypes} = require('sequelize')
const appEnvironment = process.env.NODE_ENV || "development";
const config = require('../config.json')[appEnvironment];

const database = config.database
const username = config.username
const password = config.password

const sequelize = new Sequelize(database, username, password, config)


class AbandonedCheckout extends Model {
    
}

AbandonedCheckout.init({
    //model attributes
    id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
    },
    checkout_id: {
        type: DataTypes.STRING,
        notEmpty: true
    },
    checkout_url: {
        type: DataTypes.STRING,
        notEmpty: true
    },
    currency: {
        type: DataTypes.STRING
    },
    checkout_name: {
        type: DataTypes.STRING,
        notEmpty: true
    },
    checkout_line_items: {
        type: DataTypes.TEXT,
        
    },
    total_price: {
        type: DataTypes.FLOAT
    },
    subtotal_price: {
        type: DataTypes.FLOAT
    },
    total_tax: {
        type: DataTypes.FLOAT
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
    modelName: 'AbandonedCheckout', // We need to choose the Model Name (Table Name)
},
)

module.exports = AbandonedCheckout