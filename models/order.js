//New Class based Sequelize implementation
const {Sequelize, Model, DataTypes} = require('sequelize')
const appEnvironment = process.env.NODE_ENV || "development";
const config = require('../config.json')[appEnvironment];

const database = config.database
const username = config.username
const password = config.password

const sequelize = new Sequelize(database, username, password, config)


class Order extends Model {
    
}

Order.init({
    //model attributes
    id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
    },
    shopify_api_id: {
        type: DataTypes.STRING,
        notEmpty: true
    },
    currency: {
        type: DataTypes.STRING
    },
    order_name: {
        type: DataTypes.STRING,
        notEmpty: true
    },
    order_line_items: {
        type: DataTypes.TEXT
    },
    shopify_created_date: {
        type: DataTypes.DATE,
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
    financial_status: {
        type: DataTypes.STRING
    },
    payment_terms: {
        type: DataTypes.STRING
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
    modelName: 'Order', // We need to choose the Model Name (Table Name)
},
)

// DraftOrder.sync()

module.exports = Order