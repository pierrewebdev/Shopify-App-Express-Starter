module.exports = (mysqlAPI, traits, env) => {
    const functionTrait = traits.FunctionTrait;
    const requestTrait = traits.RequestTrait;

    var accessScopes = 'read_products,write_orders,write_returns,read_customers,write_fulfillments';
    var clientId = env.SHOPIFY_CLIENT_ID;
    var clientSecret = env.SHOPIFY_CLIENT_SECRET;
    var redirectUri = env.APP_URL+'shopify/auth/redirect';

    return {
        index: async function (req, res) {
            try {
                if(req.query.hasOwnProperty('shop') && req.query.hasOwnProperty('hmac') && req.query.shop.length && req.query.hmac.length) {
                    var hmacValid = await functionTrait.isRequestFromShopify(req.query, clientSecret);
                    if(hmacValid) {
                        var shop = req.query.shop;
                        var dbRecord = await functionTrait.getStoreByDomain(shop);
                        
                        if(dbRecord != null) {
                            var tokenValid = await checkStoreTokenValidity(dbRecord);
                            if(tokenValid) {
                                var userShop = await mysqlAPI.findUserForStoreId(dbRecord);
                                var user = await mysqlAPI.findUserByUserShop(userShop);
                                
                                if(req.session.user != undefined && req.session.user != null)
                                    req.session.destroy();
                                req.session.user = {
                                    id: user.id
                                };

                                return res.redirect('/dashboard');
                            } 
                        }

                        var endpoint = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${accessScopes}&redirect_uri=${redirectUri}`;
                        return res.redirect(endpoint);
                    } 
                } 

                return res.json({
                    'status': false, 
                    'message': 'Invalid request.'
                });
            } catch (error) {
                return res.json({
                    data: null,
                    count: 0,
                    query: null,
                    message: error.message
                })
            }
        },

        redirect: async function (req, res) {
            try {
                if(req.query.hasOwnProperty('shop') && req.query.hasOwnProperty('code')) {
                    var hmacValid = await functionTrait.isRequestFromShopify(req.query, clientSecret);
                    if(hmacValid) {
                        var shop = req.query.shop;
                        var accessToken = await requestAccessTokenFromShopify(req.query);
                        if(accessToken !== null) {
                            var shopifyStore = await getShopifyStoreDetails(req.query, accessToken);
                            await saveDetailsToDatabase(shopifyStore, accessToken, req.query);
                        
                            var dbRecord = await functionTrait.getStoreByDomain(shop);    
                            var userShop = await mysqlAPI.findUserForStoreId(dbRecord);
                            var user = await mysqlAPI.findUserByUserShop(userShop);

                            if(req.session.user != undefined && req.session.user != null)
                                req.session.destroy();
                            req.session.user = {
                                id: user.id
                            };

                            return res.redirect('/dashboard');
                        }
                    }
                } 

                return res.json({
                    'status': false, 
                    'message': 'Invalid request.',
                    'request': req.query
                });
            } catch (error) {
                return res.json({
                    data: null,
                    count: 0,
                    query: req.query,
                    message: error.message
                })
            }
        }
    }

    async function checkStoreTokenValidity(dbRecord) {
        if(dbRecord == undefined && dbRecord == null || dbRecord.accessToken == null) return false;

        var endpoint = functionTrait.getShopifyAPIURLForStore('shop.json', dbRecord);
        var headers = functionTrait.getShopifyAPIHeadersForStore(dbRecord);
        var response = await requestTrait.makeAnAPICallToShopify('GET', endpoint, headers);
        return response.status && response.respBody.hasOwnProperty('shop');
    }

    async function requestAccessTokenFromShopify(query) {
        var endpoint = `https://${query.shop}/admin/oauth/access_token`;
        var body = {
            'client_id': clientId,
            'client_secret': clientSecret,
            'code': query.code
        };
        var headers = {
            'Content-Type': 'application/json'
        };

        var response = await requestTrait.makeAnAPICallToShopify('POST', endpoint, headers, body);
        
        if(response.status) {
            return response.respBody.access_token;
        }

        return null;
    }

    async function getShopifyStoreDetails(query, accessToken) {
        var endpoint = functionTrait.getShopifyAPIURLForStore('shop.json', {"myshopify_domain": query.shop});
        var headers = functionTrait.getShopifyAPIHeadersForStore({"accessToken": accessToken});
        var response = await requestTrait.makeAnAPICallToShopify('GET', endpoint, headers);

        if(response.status) 
            return response.respBody.shop;

        return null;
    }

    async function saveDetailsToDatabase(shopifyStore, accessToken) {
        try {
            const { hash } = require("bcryptjs");
            var storeBody = {
                "id": shopifyStore.id,
                "myshopify_domain": shopifyStore.domain,
                "name": shopifyStore.name,
                "accessToken": accessToken,
                "currency": shopifyStore.currency,
                "email": shopifyStore.email,
                "phone": shopifyStore.phone
            };

            var userBody = {
                "name": shopifyStore.name,
                "email": shopifyStore.email,
                "password": await hash('123456', 8)
            };

            var userRecord = await mysqlAPI.updateOrCreateUserRecord(userBody);
            var storeRecord = await mysqlAPI.updateOrCreateStoreRecord(storeBody);
            var userStoreRecord = await mysqlAPI.updateOrCreateUserStoreMapping(userRecord, storeRecord);

            //Any other operations here..just after installing the store

            return true;
        } catch(error) {
            console.log('error in saving details to database '+error.message);
        }
    }
}