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
                            displayFinancialStatus
                            paymentTerms{
                                paymentTermsName
                                paymentTermsType
                            }
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
                            }
                        }
                    }
                }`

                const payload = JSON.stringify({
                    query: ordersQuery
                })

                const gqlReq = await shopifyAPI("POST",endpoint, headers, payload)
                const orders = R.path(["respBody", "data", "orders", "edges"])(gqlReq)

                console.log("result of GQL Request", orders)

                //draftOrders.edges[0].node.lineItems.edges[0].node

                //find db record for each draft order and then update each

                //console.log("I've successfully updated all records in db")

            } catch (error) {
                console.error(`There was an error with pulling the draft orders \n ${error}`)
            } finally {
                res.sendStatus(200)
            }

        }
    }
}