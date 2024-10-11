module.exports = () => {
    const mysqlAPI = require("../src/mysql-api")
    const env = require('dotenv').config()
    const shopifyAPI = require("../traits/requests").makeAnAPICallToShopify
    const helperMethods = require("../traits/functions")

    const getApIHeaders = helperMethods.getShopifyAPIHeadersForStore
    const apiEndpoint = helperMethods.getShopifyAPIURLForStore

    return {
        updateAllDraftOrders: async function (req, res) {
            //Make a request to Shopify API to pull all draft orders and then use the draftorder Model to store them in the db

            const storeDomain = req.headers['x-shopify-shop-domain']
            const shopifyStore = await mysqlAPI.getStoreByDomain(storeDomain)

            //API Request for draft orders
            const headers = getApIHeaders(shopifyStore.access_token);
            const endpoint = apiEndpoint(`draft_orders.json`, shopifyStore)

            //Helper function to get line item id from GraphQL
            const extractIdFromGid = (gid) => {
                const parts = gid.split('/');
                return parts[parts.length - 1];
            }

            try {
                const orderRequest = await shopifyAPI("GET",endpoint, headers)
                const draftOrders = orderRequest.respBody.draft_orders

                //find db record for each draft order and then update each
                for (const draftOrder of draftOrders){
                    //console.log("Draft Order", draftOrder.line_items)
                    const draftRecord = await mysqlAPI.findDraftOrderById(draftOrder.id)
                    const draftOrderGid = draftOrder.admin_graphql_api_id
                    //Add images to the line items array on the draft order

                    const headers = getApIHeaders(shopifyStore.access_token);
                    const endpoint = apiEndpoint(`graphql.json`, shopifyStore)
                

                    const imageQuery = `query GetLineItemImage($draftId : ID!){
                        draftOrder(id: $draftId){
                            id
                            lineItems(first: 10){
                                edges{
                                    node{
                                        id
                                        image{
                                            url
                                        }
                                    }
                                }
                            }
                        }
                    }`

                    const payload = JSON.stringify({
                        query: imageQuery,
                        variables: {
                            "draftId" : draftOrderGid
                        }
                    })

                    const gqlReq = await shopifyAPI("POST",endpoint, headers, payload)
                    console.log(`This is from Draft Order #${draftOrder.id}`)
                    //console.log(gqlReq.respBody.data.draftOrder.lineItems.edges[0].node)

                    const lineItems = gqlReq.respBody.data.draftOrder.lineItems

                    const imagesByLineItem = lineItems.edges.map(obj => {
                        return {
                            lineItemId: extractIdFromGid(obj.node.id),
                            imageUrl: obj.node.image.url
                        }
                    })

                    console.log(imagesByLineItem)

                    if(!draftRecord){
                        await mysqlAPI.createDraftOrderRecord(draftOrder, shopifyStore)
                    } else{
                        draftRecord.set({
                            draft_order_id: draftOrder.id,
                            currency: draftOrder.currency,
                            order_name: draftOrder.name,
                            order_line_items: JSON.stringify(draftOrder.line_items),
                            invoice_url: draftOrder.invoice_url,
                            total_price: draftOrder.total_price,
                            subtotal_price: draftOrder.subtotal_price,
                            total_tax: draftOrder.total_tax,
                            status: draftOrder.status
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