module.exports = () => {

    const functionTrait = require('../traits/functions');
    const requestTrait = require('../traits/requests');
    const mysqlAPI = require("../src/mysql-api")
    const env = require('dotenv').config()

    var accessScopes = 'read_products,write_orders,write_returns,read_customers,write_fulfillments, read_draft_orders';
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

                console.log("USER RECORD FROM CONTROLLER", userRecord)

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
        }
    }
}