
module.exports = () => {
  const nodeCache = require('node-cache');
  const myCache = new nodeCache();
  const mysqlAPI = require("../src/mysql-api");
  const functionTrait = require('../traits/functions');
  const requestTrait = require('../traits/requests');

  return {
    index: async function (req, res) {
      try {
        const userId = req.session.user.id
        const userRecord = await mysqlAPI.findUserById(userId)
        const shopifyStore = await mysqlAPI.getShopifyStoreData(userRecord)

        const draftOrders = await mysqlAPI.getAllDraftOrders()

        return res.render("index", {
            storeName: shopifyStore.name,
            draftOrders: draftOrders
        })
        
      } catch (error) {
        return res.json({
          "status": false,
          "message": "Something went wrong. If the issue persists, please contact Customer support.",
          "debug": {
            "error_message": error.message
          }
        })
      }
    },
    invoice: async function (req, res) {
      try {
        const userId = req.session.user.id
        const userRecord = await mysqlAPI.findUserById(userId)
        const shopifyStore = await mysqlAPI.getShopifyStoreData(userRecord)

        return res.render("invoice-template", {
            storeName: shopifyStore.name   
        })
        
      } catch (error) {
        return res.json({
          "status": false,
          "message": "Something went wrong. If the issue persists, please contact Customer support.",
          "debug": {
            "error_message": error.message
          }
        })
      }
    }
  }
}