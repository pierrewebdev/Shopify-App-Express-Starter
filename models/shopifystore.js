// module.exports = function(sequelize, DataTypes) {

//     const ShopifyStore = sequelize.define('shopify_store', {
//         table_id: {
//             autoIncrement: true,
//             primaryKey: true,
//             type: DataTypes.INTEGER
//         },
//         id: {
//             type: DataTypes.BIGINT(20)
//         },
//         myshopify_domain: {
//             type: DataTypes.STRING,
//             allowNull: false,
//             unique: true
//         },
//         accessToken: {
//             type: DataTypes.STRING
//         },
//         name: {
//             type: DataTypes.STRING
//         },
//         plan_name: {
//             type: DataTypes.STRING            
//         },
//         currency: {
//             type: DataTypes.STRING            
//         },
//         shop_owner: {
//             type: DataTypes.STRING            
//         },
//         email: {
//             type: DataTypes.STRING
//         },
//         customer_email: {
//             type: DataTypes.STRING
//         },
//         phone: {
//             type: DataTypes.STRING
//         },
//         eligible_for_card_reader_giveaway: {
//             type: DataTypes.INTEGER
//         },
//         createdAt: {
//             field: 'created_at',
//             type: DataTypes.DATE,
//         },
//         updatedAt: {
//             field: 'updated_at',
//             type: DataTypes.DATE,
//         }        
//     }, {
//         tableName: 'shopify_stores',
//         freezeTableName: true
//     });
    
//     return ShopifyStore;
// }


//New Class based Sequelize implementation
const {Sequelize, Model, DataTypes} = require('sequelize')
const config = require('../config.json')[env];
const database = config.database
const username = config.username
const password = config.password

const sequelize = new Sequelize(database, username, password, config)


class ShopifyStore extends Model {
    getStoreDomain(){
        return this.myshopify_domain
    }
}

ShopifyStore.init({
    //model attributes
    table_id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
    },
    id: {
        type: DataTypes.BIGINT(20)
    },
    myshopify_domain: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    access_token: {
        type: DataTypes.STRING
    },
    name: {
        type: DataTypes.STRING
    },
    plan_name: {
        type: DataTypes.STRING            
    },
    currency: {
        type: DataTypes.STRING            
    },
    shop_owner: {
        type: DataTypes.STRING            
    },
    email: {
        type: DataTypes.STRING
    },
    customer_email: {
        type: DataTypes.STRING
    },
    phone: {
        type: DataTypes.STRING
    },
    eligible_for_card_reader_giveaway: {
        type: DataTypes.INTEGER
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