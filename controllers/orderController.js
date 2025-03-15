module.exports = () => {
    const mysqlAPI = require("../src/mysql-api")
    const env = require('dotenv').config()
    const R = require("ramda")
    const shopifyAPI = require("../traits/requests").makeAnAPICallToShopify
    const helperMethods = require("../traits/functions")

    const getApIHeaders = helperMethods.getShopifyAPIHeadersForStore
    const apiEndpoint = helperMethods.getShopifyAPIURLForStore

    return {
        updateAllOrders: async function (req, res) {
            //Make a request to Shopify API to pull all draft orders and then use the order Model to store them in the db

            const userId = req.session.user.id
            const userRecord = await mysqlAPI.findUserById(userId)
            const shopifyStore = await mysqlAPI.getShopifyStoreData(userRecord)

            //API Request for draft orders
            const headers = getApIHeaders(shopifyStore.access_token);
            const endpoint = apiEndpoint(`graphql.json`, shopifyStore)

            try {
                const ordersQuery = `query GetOrders{
                     orders(first:10){
                        edges{
                        node{    
                            name
                            id
                            email
                            displayFinancialStatus
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
                            shippingAddress{
                                firstName
                            }
                            }
                        }
                    }
                }`

                const payload = JSON.stringify({
                    query: ordersQuery
                })

                const gqlReq = await shopifyAPI("POST",endpoint, headers, payload)
                const orders = R.path(["respBody", "data", "orders", "edges"])(gqlReq)

                for(const order of orders){
                    const orderData = R.path(["node"])(order)

                    console.log(`I'm on this order: ${orderData.name} and this is the id: ${orderData.id}`)

                    formattedOrderData.id = orderData.id
                    formattedOrderData.name = orderData.name
                    formattedOrderData.status = orderData.displayFinancialStatus
                    formattedOrderData.currency = orderData.currencyCode
                    formattedOrderData.total_tax = R.path(["shopMoney", "amount"])(orderData.totalTaxSet)
                    formattedOrderData.total_price = R.path(["shopMoney", "amount"])(orderData.totalPriceSet)
                    formattedOrderData.subtotal_price = R.path(["shopMoney", "amount"])(orderData.subtotalPriceSet)

                    formattedOrderData.customer = orderData.customer
                }

                console.log("result of GQL Request", orders[0].node.subtotalPriceSet)


                //console.log("I've successfully updated all records in db")

            } catch (error) {
                console.error(`There was an error with pulling the orders \n ${error}`)
            } finally {
                res.sendStatus(200)
            }

        }
    }
}