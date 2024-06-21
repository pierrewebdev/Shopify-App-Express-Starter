//New Class based Sequelize implementation
const {Sequelize, Model, DataTypes} = require('sequelize')
const appEnvironment = process.env.NODE_ENV || "development";
const config = require('../config.json')[appEnvironment];

const database = config.database
const username = config.username
const password = config.password

const sequelize = new Sequelize(database, username, password, config)


class StoreAdmin extends Model {
    getStoreDomain(){
        return this.myshopify_domain
    }

    async createAdmin(){
        return await this.create({
            id: 1,
            name: "Patrick Pierre",
            email: "patrick@codethatconverts.com",
            password: "rootuser",
            email_verified_at: Date.now(),
            remember_token: "token",
            authtoken: "token",
            createdAt: Date.now(),
            updatedAt: Date.now()
        })
    }
}

StoreAdmin.init({
    //model attributes
    table_id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
    },
    id: {
        type: DataTypes.BIGINT(20)
    },
    name: {
        type: DataTypes.STRING,
        notEmpty: true
    },
    email: {
        type: DataTypes.STRING,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email_verified_at: {
        type: DataTypes.DATE
    },
    remember_token: {
        type: DataTypes.STRING
    },
    authtoken: {
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
    tableName: 'StoreAdmin', // We need to choose the Model Name (Table Name)
},
)

StoreAdmin.sync()

module.exports = StoreAdmin

/* 
   async createStoreAdmin(){
        return await this.create({
        id: 1,
        name: "Patrick Pierre",
        email: "patrick@codethatconverts.com",
        password: "rootuser",
        email_verified_at: Date.now(),
        remember_token: "token",
        authtoken: "token",
        createdAt: Date.now(),
        updatedAt: Date.now()
    })
*/



