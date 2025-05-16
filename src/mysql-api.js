var env = process.env.NODE_ENV;
var config = require('../config.json')[env];

//initialize the models and create an instance so we can use the static methods in them
const ShopifyStores = require("../models/shopifystore.js")
const QrCode = require("../models/qrcode.js")

//Expose functions for use in other files

async function getStoreByDomain (shop) {
    return await ShopifyStores.findOne({where: {myshopify_domain: shop}, raw: true});
}

async function createStoreRecord (storeData) {
    return ShopifyStores.create({
        myshopify_domain: storeData.myshopify_domain,
        state: storeData.state,
        isOnline: storeData.isOnline,
        scope: storeData.scope,
        expires: storeData.expires,
        accessToken: storeData.accessToken,
    })
}

module.exports = {
    getStoreByDomain,
    createStoreRecord
}
