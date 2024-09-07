module.exports = () => {
    const mysqlAPI = require("../src/mysql-api")
    const env = require('dotenv').config()
    const shopifyAPI = require("../traits/requests").makeAnAPICallToShopify
    const helperMethods = require("../traits/functions")

    const getApIHeaders = helperMethods.getShopifyAPIHeadersForStore
    const apiEndpoint = helperMethods.getShopifyAPIURLForStore

    return {
        pullAllDraftOrders: async function (req, resp) {
            //Make a request to Shopify API to pull all draft orders and then use the draftorder Model to store them in the db

            const userId = req.session.user.id
            const userRecord = await mysqlAPI.findUserById(userId)
            const shopifyStore = await mysqlAPI.getShopifyStoreData(userRecord)

            //API Request for draft orders
            const headers = getApIHeaders(shopifyStore);
            const endpoint = apiEndpoint(`draft_orders.json`, shopifyStore)

            const draftOrders = shopifyAPI(endpoint, headers)

        }
    }
}

/*

 const mysqlAPI = require("./src/mysql-api");
 const helpers = require('./traits/functions');
 const shopifyAPI = require('./traits/requests').makeAnAPICallToShopify

 app.get(apiRoutePrefix + 'draft-orders', async (req, res) => {


 const userId = req.session.user.id
 const userRecord = await mysqlAPI.findUserById(userId)
 const shopifyStore = await mysqlAPI.getShopifyStoreData(userRecord)

 const domain = "appless-wishlist-demo-store.myshopify.com"

 const headers = helpers.getShopifyAPIHeadersForStore(shopifyStore);
 const endpoint = helpers.getShopifyAPIURLForStore(`draft_orders.json`, shopifyStore)

 console.log("HEADERS",headers, "\n\n", "ENDPOINT", endpoint)
 const response = await shopifyAPI("GET", endpoint, headers)

 res.json(response)
 })





*/