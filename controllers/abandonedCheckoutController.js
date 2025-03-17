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
                const abandonedCheckoutsQuery = `query GetAbandonedCheckouts {
                    abandonedCheckouts(first: 10, query: "not_recovered") {
                        edges {
                        node {
                            name
                            abandonedCheckoutUrl
                            id
                            customer {
                                firstName
                                email
                                    emailMarketingConsent {
                                        marketingState
                                    }
                            }
                            subtotalPriceSet {
                            shopMoney {
                                amount
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
                                quantity
                                id
                                image {
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
                    query: abandonedCheckoutsQuery
                })

                const gqlReq = await shopifyAPI("POST",endpoint, headers, payload)
                const abandonedCheckouts = R.path(["respBody", "data", "abandonedCheckouts", "edges"])(gqlReq)

                for (const checkout of abandonedCheckouts){

                    const checkoutData = R.path(["node"])(checkout)
                    const formattedCheckoutData = {}

                    formattedCheckoutData.id = checkoutData.id
                    formattedCheckoutData.name = checkoutData.name
                    formattedCheckoutData.checkout_url = checkoutData.invoiceUrl
                    formattedCheckoutData.status = checkoutData.status
                    formattedCheckoutData.currency = checkoutData.currencyCode
                    formattedCheckoutData.total_tax = R.path(["shopMoney", "amount"])(checkoutData.totalTaxSet)
                    formattedCheckoutData.total_price = R.path(["shopMoney", "amount"])(checkoutData.totalPriceSet)
                    formattedCheckoutData.subtotal_price = R.path(["shopMoney", "amount"])(checkoutData.subtotalPriceSet)

                    const lineItems = R.pipe(
                        R.path(["edges"]),
                        R.map(obj => obj.node),
                        R.map((lineItem) => {
                            const tmp = {
                                name: lineItem.name,
                                quantity: lineItem.quantity,
                                shopifyId: helperMethods.extractIdFromGid(lineItem.id),
                                price: lineItem.discountedTotalSet.shopMoney.amount,
                                imageUrl: lineItem.image.url
                            }

                            return tmp
                        })

                    )(checkoutData.lineItems)

                    formattedCheckoutData.line_items = lineItems

                    const checkoutRecord = await mysqlAPI.findDraftOrderById(formattedCheckoutData.id)


                    if(!checkoutRecord){
                        await mysqlAPI.createDraftOrderRecord(formattedCheckoutData, shopifyStore)
                    } else{
                        checkoutRecord.set({
                            shopify_api_id: formattedCheckoutData.id,
                            checkout_name: formattedCheckoutData.name,
                            checkout_line_items: JSON.stringify(formattedCheckoutData.line_items),
                            checkout_url: formattedCheckoutData.checkout_url,
                            total_price: formattedCheckoutData.total_price,
                            subtotal_price: formattedCheckoutData.subtotal_price,
                            total_tax: formattedCheckoutData.total_tax
                        })
                        await checkoutRecord.save()
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