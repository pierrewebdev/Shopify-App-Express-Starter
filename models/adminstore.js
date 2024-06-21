//New Class based Sequelize implementation
const {Sequelize, Model, DataTypes} = require('sequelize')
const appEnvironment = process.env.NODE_ENV || "development";
const config = require('../config.json')[appEnvironment];

const database = config.database
const username = config.username
const password = config.password

const sequelize = new Sequelize(database, username, password, config)


class AdminStore extends Model {
    getStoreDomain(){
        return this.myshopify_domain
    }
}

AdminStore.init({
    //model attributes
    table_id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
    },
    store_id: {
        type: DataTypes.INTEGER,
        notEmpty: true
    },
    user_id: {
        type: DataTypes.INTEGER,
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
    modelName: 'AdminStore', // We need to choose the Model Name (Table Name)
},
)

AdminStore.sync()

module.exports = AdminStore