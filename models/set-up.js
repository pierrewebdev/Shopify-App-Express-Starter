//Initialize Models and Set up Relationships
const ShopifyStore = require("./shopifystore.js")
const QrCode = require("./qrcode.js")

async function setupModels(){
    ShopifyStore.hasMany(QrCode, {
        foreignKey: "store_id"
    })

    QrCode.belongsTo(ShopifyStore, {
        foreignKey: "store_id"
    })

    // Sync in dependency order with proper error handling
    try {
        await ShopifyStore.sync()
        QrCode.sync()
    } catch (error) {
        console.error('Database sync failed:', error)
        throw error
    }
}

module.exports = setupModels
