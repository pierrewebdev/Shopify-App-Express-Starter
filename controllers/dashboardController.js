
module.exports = () => {
  const nodeCache = require('node-cache');
  const myCache = new nodeCache();
  const mysqlAPI = require("../src/mysql-api");
  const functionTrait = require('../traits/functions');
  const requestTrait = require('../traits/requests');
  const moment = require("moment")

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
        const shopifyDraftOrderId = req.params.draft_id

        const draftOrderRecord = await mysqlAPI.findDraftOrderById(shopifyDraftOrderId)

        return res.render("invoice-template", {
            storeName: shopifyStore.name,
            draftOrder: draftOrderRecord,
            invoiceDate: moment(draftOrderRecord.createdAt).format("MMMM Do YYYY")
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
    sendInvoiceEmail: async function (req, res){
      try{
        const userId = req.session.user.id
        const userRecord = await mysqlAPI.findUserById(userId)
        const shopifyStore = await mysqlAPI.getShopifyStoreData(userRecord)

        const { 
          customerEmail, 
          customerName, 
          invoiceSubjectLine,
          customerAddress, 
          customMessage, 
          invoiceId } = req.body

        const draftRecord = await mysqlAPI.findDraftOrderById(invoiceId)

        const draftOrderData = draftRecord.dataValues
        const invoiceEmailData = {
          orderName: draftOrderData.order_name,
          storeName: shopifyStore.name,
          lineItems: draftOrderData.order_line_items,
          orderSubTotal: draftOrderData.subtotal_price,
          orderTotal: draftOrderData.total_price,
          orderTax: draftOrderData.total_tax,
          customerEmail: customerEmail,
          customerName: customerName,
          customerAddress: customerAddress,
          invoiceSubjectLine: invoiceSubjectLine,
          customMessage: customMessage
        }

        // console.log("EMAIL DATA", invoiceEmailData)
        functionTrait.sendInvoiceEmail(invoiceEmailData)
        console.log("I sent out your email")

      } catch(err){
          console.log ("Something went wring with sending the email", err)
      } finally{
          res.send("<p>I have received your request</p>")
      }
    } 
  }
}