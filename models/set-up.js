//Initialize Models and Set up Relationships
const User = require("./user.js")
const ShopifyStore = require("./shopifystore.js")
const { Sequelize } = require("sequelize")
const UserStore = require("./userstore.js")
const DraftOrder = require("./draftorder.js")

const appEnvironment = process.env.NODE_ENV || "development";
const config = require('../config.json')[appEnvironment];

const database = config.database
const username = config.username
const password = config.password

const sequelize = new Sequelize(database, username, password, config)



async function setupModels(){

    User.belongsToMany(ShopifyStore, {
        through: UserStore,
        foreignKey: 'user_id',
        otherKey: 'store_id'
    })
    ShopifyStore.belongsToMany(User, {
        through: UserStore,
        foreignKey: 'store_id',
        otherKey: 'user_id'
    })

    ShopifyStore.hasMany(DraftOrder, {
        foreignKey: "store_id"
    })
    
    DraftOrder.belongsTo(ShopifyStore, {
        foreignKey: "store_id"
    })

    User.sync()
    ShopifyStore.sync()
    UserStore.sync()
    DraftOrder.sync()
}

module.exports = setupModels