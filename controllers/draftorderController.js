module.exports = () => {
    const mysqlAPI = require("../src/mysql-api")
    const env = require('dotenv').config()
    const R = require("ramda")
    const shopifyAPI = require("../traits/requests").makeAnAPICallToShopify
    const helperMethods = require("../traits/functions")

    const getApIHeaders = helperMethods.getShopifyAPIHeadersForStore
    const apiEndpoint = helperMethods.getShopifyAPIURLForStore

    return {
        updateAllDraftOrders: async function (req, res) {
            //Make a request to Shopify API to pull all draft orders and then use the draftorder Model to store them in the db

            const userId = req.session.user.id
            const userRecord = await mysqlAPI.findUserById(userId)
            const shopifyStore = await mysqlAPI.getShopifyStoreData(userRecord)

            //API Request for draft orders
            const headers = getApIHeaders(shopifyStore.access_token);
            const endpoint = apiEndpoint(`graphql.json`, shopifyStore)

            try {
                const draftOrdersQuery = `query GetDraftOrders{
                     draftOrders(first:10){
                        edges{
                            node{    
                                name
                                id
                                invoiceUrl
                                status
                                currencyCode
                                subtotalPriceSet{
                                    shopMoney{
                                        amount
                                    }
                                }
                                totalPriceSet{
                                    shopMoney{
                                        amount
                                    }
                                }
                                totalTaxSet{
                                    shopMoney{
                                        amount
                                    }
                                }
                                lineItems(first: 10){
                                    edges{
                                        node{
                                            name
                                            quantity
                                            id
                                            discountedTotalSet{
                                                shopMoney{
                                                    amount
                                                }
                                            }
                                            image{
                                                url
                                            }
                                        }
                                    }
                                } 
                                customer {
                                    id
                                    firstName
                                    email
                                }
                                }
                            }
                        }
                }`

                const payload = JSON.stringify({
                    query: draftOrdersQuery
                })

                const gqlReq = await shopifyAPI("POST",endpoint, headers, payload)
                const draftOrders = R.path(["respBody", "data", "draftOrders", "edges"])(gqlReq)


                //find db record for each draft order and then update each
                for (const draftOrder of draftOrders){
                    //Add images to the line items array on the draft order

                    const orderData = R.path(["node"])(draftOrder)
                    const formattedDraftData = {}

                    console.log(`I'm on this order: ${orderData.name} and this is the id: ${orderData.id}`)

                    formattedDraftData.id = orderData.id
                    formattedDraftData.name = orderData.name
                    formattedDraftData.invoice_url = orderData.invoiceUrl
                    formattedDraftData.status = orderData.status
                    formattedDraftData.currency = orderData.currencyCode
                    formattedDraftData.total_tax = R.path(["shopMoney", "amount"])(orderData.totalTaxSet)
                    formattedDraftData.total_price = R.path(["shopMoney", "amount"])(orderData.totalPriceSet)
                    formattedDraftData.subtotal_price = R.path(["shopMoney", "amount"])(orderData.subtotalPriceSet)

                    formattedDraftData.customer = orderData.customer

                    const lineItems = R.pipe(
                        R.path(["edges"]),
                        R.map(obj => obj.node),
                        R.map((lineItem) => {
                            const tmp = {
                                name: lineItem.name,
                                quantity: lineItem.quantity,
                                shopifyId: lineItem.id,
                                price: lineItem.discountedTotalSet.shopMoney.amount,
                                imageUrl: lineItem.image.url
                            }

                            return tmp
                        })

                    )(orderData.lineItems)

                    formattedDraftData.line_items = lineItems

                    const associatedCustomer = formattedDraftData.customer

                    //Skip to next draft order if there is no customer on current draft
                    if(!associatedCustomer) continue

                    let customerRecord = await mysqlAPI.findCustomerByShopifyId(associatedCustomer.id)

                    if(!customerRecord){
                        customerRecord = await mysqlAPI.createCustomerRecord(associatedCustomer, shopifyStore)
                    }

                   if(!draftRecord){
                        console.log("I made it in here")
                       await mysqlAPI.createDraftOrderRecord(formattedDraftData, customerRecord)
                   } else{
                       draftRecord.set({
                           currency: formattedDraftData.currency,
                           order_name: formattedDraftData.name,
                           order_line_items: JSON.stringify(formattedDraftData.line_items),
                           invoice_url: formattedDraftData.invoice_url,
                           total_price: formattedDraftData.total_price,
                           subtotal_price: formattedDraftData.subtotal_price,
                           total_tax: formattedDraftData.total_tax,
                           status: formattedDraftData.status
                       })
                       await draftRecord.save()
                   }

                }

                console.log("I've successfully updated all records in db")

            } catch (error) {
                console.error(`There was an error with pulling the draft orders \n ${error}`)
            } finally {
                res.sendStatus(200)
            }

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