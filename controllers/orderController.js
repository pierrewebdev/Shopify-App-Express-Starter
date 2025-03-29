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
                            createdAt
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
                    let associatedCustomer = undefined
                    const orderData = R.path(["node"])(order)
                    const formattedOrderData = {}

                    formattedOrderData.name = orderData.name
                    formattedOrderData.id = orderData.id
                    formattedOrderData.shopify_created_date = orderData.createdAt
                    formattedOrderData.status = orderData.displayFinancialStatus
                    formattedOrderData.payment_terms = orderData.payment_terms
                    formattedOrderData.currency = orderData.currencyCode
                    formattedOrderData.total_tax = R.path(["shopMoney", "amount"])(orderData.totalTaxSet)
                    formattedOrderData.total_price = R.path(["shopMoney", "amount"])(orderData.totalPriceSet)
                    formattedOrderData.subtotal_price = R.path(["shopMoney", "amount"])(orderData.subtotalPriceSet)

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

                    formattedOrderData.line_items = lineItems

                    //Skip to next draft order if there is no customer on current draft
                    associatedCustomer = orderData.customer
                    if(!associatedCustomer) continue

                    let customerRecord = await mysqlAPI.createOrUpdateCustomer(associatedCustomer, shopifyStore)

                   let orderRecord = await mysqlAPI.findOrderById(formattedOrderData.id)

                   if(!orderRecord){
                       await mysqlAPI.createOrderRecord(formattedOrderData, customerRecord)
                   } else{
                       orderRecord.set({
                           currency: formattedOrderData.currency,
                           shopify_created_date: formattedOrderData.shopify_created_date,
                           order_name: formattedOrderData.name,
                           order_line_items: JSON.stringify(formattedOrderData.line_items),
                           total_price: formattedOrderData.total_price,
                           subtotal_price: formattedOrderData.subtotal_price,
                           total_tax: formattedOrderData.total_tax,
                           status: formattedOrderData.status
                       })
                       await orderRecord.save()
                   }


                }


                console.log("I've successfully updated all records in db")

            } catch (error) {
                console.error(`There was an error with pulling the orders \n ${error}`)
            } finally {
                res.sendStatus(200)
            }

        }
    }
}
