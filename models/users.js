// module.exports = function(sequelize, DataTypes) {

//     const Users = sequelize.define('user', {
//         id: {
//             autoIncrement: true,
//             primaryKey: true,
//             type: DataTypes.INTEGER
//         },
//         name: {
//             type: DataTypes.STRING,
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
    
//     return Users;
// }


//New Class based Sequelize implementation
const {Sequelize, Model, DataTypes} = require('sequelize')
const config = require('../config.json')[env];
const database = config.database
const username = config.username
const password = config.password

const sequelize = new Sequelize(database, username, password, config)


class User extends Model {
    getStoreDomain(){
        return this.myshopify_domain
    }
}

User.init({
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
    modelName: 'User', // We need to choose the Model Name (Table Name)
},
)