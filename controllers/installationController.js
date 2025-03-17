module.exports = () => {

    const functionTrait = require('../traits/functions');
    const requestTrait = require('../traits/requests');
    const mysqlAPI = require("../src/mysql-api")
    const env = require('dotenv').config()
    const R = require("ramda")

    const getApIHeaders = functionTrait.getShopifyAPIHeadersForStore
    const apiEndpoint = functionTrait.getShopifyAPIURLForStore
    const shopifyAPI = require("../traits/requests").makeAnAPICallToShopify

    var accessScopes = 'read_products,read_customers,read_draft_orders,write_draft_orders, read_orders, write_orders, read_payment_terms';
    
    var clientId = process.env.SHOPIFY_CLIENT_ID;
    var clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
    var redirectUri = process.env.APP_URL+'shopify/auth/redirect';

    return {

        index: async function (req, res){
            try {
                if(!(req.query.shop && req.query.shop)){
                    return res.json({
                        status: false, 
                        message:'Invalid request'
                    })
                }

                //Show Error message when hmac is not valid
                const hmacValid = await functionTrait.isRequestFromShopify(req.query, clientSecret);
                if(!hmacValid){
                    return res.json({
                        status: false, 
                        message:'Invalid request'
                    })
                }

                const shop = req.query.shop;
                const dbRecord = await mysqlAPI.getStoreByDomain(shop);
                const dbValidity = await functionTrait.checkStoreRecordValidity(dbRecord);


                //If token is not valid, you redirect to get a new one
                if(!dbValidity) {
                    const endpoint = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${accessScopes}&redirect_uri=${redirectUri}`;
                    return res.redirect(endpoint);
                }

                const userShop = await mysqlAPI.findUserForStoreId(dbRecord);
                const user = await mysqlAPI.findUserByUserShop(userShop);

                
                
                req.session.user = {
                    id: user.id
                };

                return res.redirect('/dashboard');         
            } catch (error) {
                console.log("There was an issue with the request to install the Shopify App")
                res.json({
                    status: false, 
                    message: error.message
                })
            }
        },

        redirect: async function (req, res) {
            try {
                if(!(req.query.hasOwnProperty('shop') && req.query.hasOwnProperty('code'))){
                    return res.json({
                        'status': false, 
                        'message': 'Invalid request.',
                        'request': req.query
                    });
                }

                const hmacValid = await functionTrait.isRequestFromShopify(req.query, clientSecret);
                if(!hmacValid) {
                    return res.json({
                        'status': false, 
                        'message': 'Invalid request.',
                        'request': req.query
                    });
                }


                const shop = req.query.shop;
                const accessToken = await functionTrait.requestAccessTokenFromShopify(req.query, clientId, clientSecret);

                //Early return if accessToken doesn't have data in it
                if(!(accessToken !== null)) return

                const shopifyStore = await functionTrait.getShopifyStoreDetails(req.query, accessToken);

                await functionTrait.saveDetailsToDatabase(shopifyStore, accessToken);
                
                const storeRecord = await mysqlAPI.getStoreByDomain(shop); 
                const userRecord = await mysqlAPI.findUserWithStoreId(storeRecord);

                req.session.user = {
                    id: userRecord.id
                };

                return res.redirect('/dashboard');

            } catch (error) {
                return res.json({
                    'status': false, 
                    'message': 'Invalid request.',
                    'request': req.query
                });
            }
        },

        checkScopes: async function(req,res){
            const userId = req.session.user.id
            const userRecord = await mysqlAPI.findUserById(userId)
            const shopifyStore = await mysqlAPI.getShopifyStoreData(userRecord)

            //API Request for draft orders
            const headers = getApIHeaders(shopifyStore.access_token);
            const endpoint = apiEndpoint(`graphql.json`, shopifyStore)

            try {
                const scopesQuery = `query GetAppAccessScopes {
                    appInstallation {
                        accessScopes {
                        handle
                        description
                        }
                    }
                }`

                const payload = JSON.stringify({
                    query: scopesQuery
                })

                const gqlReq = await shopifyAPI("POST",endpoint, headers, payload)
                const scopes = R.path(["respBody", "data", "appInstallation", "accessScopes"])(gqlReq)

                console.log("result of GQL Request", scopes)

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