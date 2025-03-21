module.exports = () => {
    const mysqlAPI = require("../src/mysql-api")
    const env = require('dotenv').config()
    const R = require("ramda")
    const shopifyAPI = require("../traits/requests").makeAnAPICallToShopify
    const helperMethods = require("../traits/functions")

    const getApIHeaders = helperMethods.getShopifyAPIHeadersForStore
    const apiEndpoint = helperMethods.getShopifyAPIURLForStore

    return {
        updateAllabandonedCheckouts: async function (req, res) {
            //Make a request to Shopify API to pull all draft orders and then use the draftorder Model to store them in the db

            const userId = req.session.user.id
            const userRecord = await mysqlAPI.findUserById(userId)
            const shopifyStore = await mysqlAPI.getShopifyStoreData(userRecord)

            //API Request for draft orders
            const headers = getApIHeaders(shopifyStore.access_token);
            const endpoint = apiEndpoint(`graphql.json`, shopifyStore)

            try {
                const abandonedCheckoutsQuery = `
                query GetAbandonedCheckouts {
                    abandonedCheckouts(first: 10, query: "not_recovered") {
                        edges {
                            node {
                                name
                                abandonedCheckoutUrl
                                id
                                customer {
                                    firstName
                                    email
                                }
                                subtotalPriceSet {
                                    shopMoney {
                                        amount
                                        currencyCode
                                    }
                                }
                                totalPriceSet {
                                    shopMoney {
                                        amount
                                    }
                                }
                                totalTaxSet {
                                    shopMoney {
                                        amount
                                    }
                                }
                                lineItems(first: 10) {
                                    edges {
                                        node {
                                        title
                                        quantity
                                        id
                                        discountedTotalPriceSet {
                                            shopMoney {
                                            amount
                                            }
                                        }
                                        image {
                                            url
                                        }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                `

                const payload = JSON.stringify({
                    query: abandonedCheckoutsQuery
                })

                const gqlReq = await shopifyAPI("POST",endpoint, headers, payload)
                const abandonedCheckouts = R.path(["respBody", "data", "abandonedCheckouts", "edges"])(gqlReq)

                for (const checkout of abandonedCheckouts){
                    const checkoutData = R.path(["node"])(checkout)
                    const formattedCheckoutData = {}

                    formattedCheckoutData.id = checkoutData.id
                    formattedCheckoutData.name = checkoutData.name
                    formattedCheckoutData.checkout_url = checkoutData.abandonedCheckoutUrl
                    formattedCheckoutData.currency = R.path(["subtotalPriceSet","shopMoney", "currencyCode"])(checkoutData)
                    formattedCheckoutData.total_tax = R.path(["totalTaxSet","shopMoney", "amount"])(checkoutData)
                    formattedCheckoutData.total_price = R.path(["totalPriceSet","shopMoney", "amount"])(checkoutData)
                    formattedCheckoutData.subtotal_price = R.path(["subtotalPriceSet","shopMoney", "amount"])(checkoutData)

                    const lineItems = R.pipe(
                        R.path(["edges"]),
                        R.map(obj => obj.node),
                        R.map((lineItem) => {
                            const tmp = {
                                name: lineItem.title,
                                quantity: lineItem.quantity,
                                shopifyId: helperMethods.extractIdFromGid(lineItem.id),
                                price: lineItem.discountedTotalPriceSet.shopMoney.amount,
                                imageUrl: lineItem.image.url
                            }

                            return tmp
                        })

                    )(checkoutData.lineItems)

                    formattedCheckoutData.line_items = lineItems

                    associatedCustomer = checkoutData.customer
                    if(!associatedCustomer) continue

                    let customerRecord = await mysqlAPI.createOrUpdateCustomer({
                        firstName: associatedCustomer.firstName,
                        email: associatedCustomer.email,
                        id: associatedCustomer.id
                    }, shopifyStore)

                   await mysqlAPI.updateOrCreateCheckoutRecord(formattedCheckoutData, customerRecord);
                }

               console.log("I've successfully updated all records in db")

            } catch (error) {
                console.error(`There was an error with pulling the abandoned checkouts \n ${error}`)
            } finally {
                res.sendStatus(200)
            }

        }
    }
}
