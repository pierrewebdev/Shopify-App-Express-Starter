//Initialize Models and Set up Relationships
const User = require("./user.js")
const ShopifyStore = require("./shopifystore.js")
const UserStore = require("./userstore.js")
const DraftOrder = require("./draftorder.js")
const Order = require("./order.js")
const AbandonedCheckout = require("./abandonedCheckout.js")
const Customer = require("./customer.js")



async function setupModels(){

    // User Relationships
    User.belongsToMany(ShopifyStore, {
        through: UserStore,
        foreignKey: 'user_id',
        otherKey: 'store_id'
    })

    // ShopifyStore Relationships
    ShopifyStore.belongsToMany(User, {
        through: UserStore,
        foreignKey: 'store_id',
        otherKey: 'user_id'
    })

    ShopifyStore.hasMany(Customer, {
        foreignKey: "store_id"
    })


    //Customer Relationships
    Customer.hasMany(DraftOrder, {
        foreignKey: "customer_id"
    })
    
    DraftOrder.belongsTo(Customer, {
        foreignKey: "customer_id"
    })

    Customer.hasMany(Order, {
        foreignKey: "customer_id"
    })
    
    // Order Relationships
    Order.belongsTo(Customer, {
        foreignKey: "customer_id"
    })


    // Abandoned Checkout Relationships
    Customer.hasMany(AbandonedCheckout, {
        foreignKey: "customer_id"
    })
    
    AbandonedCheckout.belongsTo(Customer, {
        foreignKey: "customer_id"
    })

    User.sync()
    ShopifyStore.sync()
    UserStore.sync()
    Customer.sync()
    DraftOrder.sync()
    Order.sync()
    AbandonedCheckout.sync()
}

module.exports = setupModels