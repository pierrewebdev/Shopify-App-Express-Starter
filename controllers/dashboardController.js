
module.exports = () => {
  const nodeCache = require('node-cache');
  const myCache = new nodeCache();
  const mysqlAPI = require("../src/mysql-api");
  const functionTrait = require('../helpers/functions');
  const moment = require("moment")

  return {
    index: async function (req, res) {
      try {
        const shopifyStore = await mysqlAPI.getShopifyStoreData(userRecord)

        return res.render("index", {
            storeName: shopifyStore.name,
            draftOrders: draftOrdersWithCustomers,
            orders: ordersWithCustomers,
            checkouts: checkoutWithCustomers,
            formatDate
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
