//New Class based Sequelize implementation
const {Sequelize, Model, DataTypes} = require('sequelize')
const appEnvironment = process.env.NODE_ENV || "development";
const config = require('../config.json')[appEnvironment];

const database = config.database
const username = config.username
const password = config.password

const sequelize = new Sequelize(database, username, password, config)


class ShopifyStore extends Model {
    static async findOrCreateStore(store_data){
        return ShopifyStore.findOrCreate({
            where: {shopify_id: store_data.id},
            defaults: {
                name: store_data.name,
                shopify_id: store_data.id,
                myshopify_domain: store_data.myshopify_domain,
                access_token: store_data.accessToken,
                currency: store_data.currency,
                email: store_data.email,
                phone: store_data.phone
            },
            raw: true
        })
    }
}

/*
This is what the store data looks like:
 var storeBody = {
    "id": shopifyStore.id,
    "myshopify_domain": shopifyStore.domain,
    "name": shopifyStore.name,
    "accessToken": accessToken,
    "currency": shopifyStore.currency,
    "email": shopifyStore.email,
    "phone": shopifyStore.phone
};
*/

ShopifyStore.init({
    //model attributes
    id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
    },
    shopify_id: {
        type: DataTypes.STRING
    },
    myshopify_domain: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    shopify_session: {
        type: DataTypes.TEXT
    },
    name: {
        type: DataTypes.STRING
    },
    currency: {
        type: DataTypes.STRING            
    },
    email: {
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
    modelName: 'ShopifyStore', // We need to choose the Model Name (Table Name)
},
)

module.exports = ShopifyStore