//Initialize Models and Set up Relationships
const ShopifyStore = require("./shopifystore.js")
const DraftOrder = require("./draftorder.js")
const Order = require("./order.js")
const AbandonedCheckout = require("./abandonedCheckout.js")
const Customer = require("./customer.js")



async function setupModels(){

    // ShopifyStore Relationships
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

    // Sync in dependency order with proper error handling
    try {
        await ShopifyStore.sync()
        await Customer.sync()
        await DraftOrder.sync()
        await Order.sync()
        await AbandonedCheckout.sync()
    } catch (error) {
        console.error('Database sync failed:', error)
        throw error
    }
}

module.exports = setupModels
