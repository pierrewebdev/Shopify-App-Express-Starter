
const jwt = require('jsonwebtoken');
const mysqlAPI = require("./src/mysql-api");

module.exports = function(app, /*passport, mysqlAPI,*/ traits, env) {

    // var dashboardController = require('./controllers/dashboardController')(/*mysqlAPI,*/ traits);
    // var storeController = require('./controllers/storeController')(/*mysqlAPI,*/ traits);
    const installationController = require('./controllers/installationController');
    const dashboardController = require('./controllers/dashboardController')
    
    /** Do whatever with this middleware */
    //apiAuth is not currently being used
    function apiAuth(req, res, next) {
        if (req.headers['authorization']) {
            try {
                let authorization = req.headers['authorization'].split(' ');
                if (authorization[0] == 'Bearer') {
                    req.user = jwt.verify(authorization[1], process.env.APP_KEY);
                    return next();
                } 
            } catch (err) {
                return res.status(401).json({
                    "status": false, 
                    "message": "Invalid/Expired token",
                    "debug": err.message
                });
            }
        } 
        return res.status(401).json({
            "status": false, 
            "message":"Invalid request header or token"
        });
    }

    function RequireAuth(req, res, next) {
        if(!req.session.user) {
            return res.status(401).json({
                "status": false, 
                "message":"Unauthorized"
            });
        }
        
        return next();
    }

    //Shopify installation or redirection routes
    app.get('/shopify/auth', installationController.index);
    app.get('/shopify/auth/redirect', installationController.redirect);

    app.get('/dashboard', RequireAuth, async (req, res) => {
        //Get info on current user of app
        const userId = req.session.user.id
        const userRecord = await mysqlAPI.findUserById(userId)
        const shopifyStore = await mysqlAPI.getShopifyStoreData(userRecord)

        console.log("USER RECORD", userRecord)
        console.log("Shopify Store", shopifyStore)

        res.render("index")
    });

    const apiRoutePrefix = '/api/'; // This is so if we do versioning like /api/v1 or /api/v2 
    // const helpers = traits.FunctionTrait
    // const shopifyAPI = traits.RequestTrait.makeAnAPICallToShopify

    //Sync data from Shopify Store API with App Database
    /* examples below aren't being used and are just there as an example
    
    const syncPrefix = apiRoutePrefix +'sync/';
    app.get(syncPrefix+'orders', storeController.syncOrders);
    app.get(syncPrefix+'products', storeController.syncProducts);
    app.get(syncPrefix+'products/collections', storeController.syncProductCollections);
    app.get(syncPrefix+'locations', storeController.syncStoreLocations);
    */

    // ====================== Main App Routes ====================== //

    /* route: /api/get-single-order */
    app.get(apiRoutePrefix + 'get-single-order', async (req, res) => {
        /* Pseudocode 
          1. Make a single API Request to Shopify
          2. Return the json from the request
        */

       const domain = "appless-wishlist-demo-store.myshopify.com"
       const store = await helpers.getStoreByDomain(domain)

       const headers = helpers.getShopifyAPIHeadersForStore(store);
       const endpoint = helpers.getShopifyAPIURLForStore(`draft_orders.json`, store)
       const response = await shopifyAPI("GET", endpoint, headers)

       res.json(response)
    })
}