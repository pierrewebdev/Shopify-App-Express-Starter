// module.exports = function(sequelize, DataTypes) {

//     const DraftOrder = sequelize.define('draft_order', {
//         id: {
//             autoIncrement: true,
//             primaryKey: true,
//             type: DataTypes.INTEGER
//         },
//         store_id: {
//             type: DataTypes.INTEGER,
//             notEmpty: true
//         },
//         email: {
//             type: DataTypes.STRING,
//             validate: {
//                 isEmail: true
//             }
//         },
//         password: {
//             type: DataTypes.STRING,
//             allowNull: false
//         },
//         email_verified_at: {
//             type: DataTypes.DATE
//         },
//         remember_token: {
//             type: DataTypes.STRING
//         },
//         createdAt: {
//             field: 'created_at',
//             type: DataTypes.DATE,
//         },
//         updatedAt: {
//             field: 'updated_at',
//             type: DataTypes.DATE,
//         },
//         authtoken: {
//             type: DataTypes.STRING
//         }
//     });
    
//     return DraftOrder;
// }



//New Class based Sequelize implementation
const {Sequelize, Model, DataTypes} = require('sequelize')
const config = require('../config.json')[env];
const database = config.database
const username = config.username
const password = config.password

const sequelize = new Sequelize(database, username, password, config)


class DraftOrder extends Model {
    getStoreDomain(){
        return this.myshopify_domain
    }
}

DraftOrder.init({
    //model attributes
    table_id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
    },
    id: {
        type: DataTypes.BIGINT(20)
    },
    currency: {
        type: DataTypes.STRING
    },
    order_name: {
        type: DataTypes.STRING,
        notEmpty: true
    },
    shipping_address: {
        type: DataTypes.TEXT('medium')
    },
    billing_address: {
        type: DataTypes.TEXT('medium')
    },
    invoice_url: {
        type: DataTypes.TEXT('medium')
    },
    total_price: {
        type: DataTypes.FLOAT
    },
    subtotal_price: {
        type: DataTypes.FLOAT
    },
    customer: {
        type: DataTypes.TEXT('long')
    },
    store_id: {
        type: DataTypes.INTEGER,
        notEmpty: true
    },
    status: {
        type: DataTypes.STRING
    },
    draf_order_created_at: {
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
    modelName: 'DraftOrder', // We need to choose the Model Name (Table Name)
},
)