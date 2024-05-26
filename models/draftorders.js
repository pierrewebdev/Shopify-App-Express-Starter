module.exports = function(sequelize, DataTypes) {

    const DraftOrder = sequelize.define('draft_order', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        store_id: {
            type: DataTypes.INTEGER,
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
        createdAt: {
            field: 'created_at',
            type: DataTypes.DATE,
        },
        updatedAt: {
            field: 'updated_at',
            type: DataTypes.DATE,
        },
        authtoken: {
            type: DataTypes.STRING
        }
    });
    
    return DraftOrder;
}