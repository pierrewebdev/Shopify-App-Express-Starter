
const jwt = require('jsonwebtoken');

module.exports = function(app, /*passport, mysqlAPI,*/ traits, env) {

    // var dashboardController = require('./controllers/dashboardController')(/*mysqlAPI,*/ traits);
    // var storeController = require('./controllers/storeController')(/*mysqlAPI,*/ traits);
    const installationController = require('./controllers/installationController')(/*mysqlAPI,*/);
    const dashboardController = require('./controllers/dashboardController')();
    const webhooksController = require('./controllers/webhooksController')();
    
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

    // ====================== Main App Routes ====================== //

    app.get('/shopify/auth', installationController.index);
    app.get('/shopify/auth/redirect', installationController.redirect);

    app.get('/dashboard', RequireAuth, dashboardController.index);
    app.get('/invoice/:draft_id', RequireAuth, dashboardController.invoice);

    //GDPR webhooks
    app.post('/gdpr/customer_data_delete', webhooksController.deleteCustomerData);
    app.post('/gdpr/customer_data_request', webhooksController.getCustomerData);
    app.post('/shop_data_delete', webhooksController.shopDataDelete);

    const apiRoutePrefix = '/api/'; // This is so if we do versioning like /api/v1 or /api/v2 

    app.get("/assets/uptown.css", (req,res) => {
        res.sendFile(`${__dirname}/pages/assets/uptown.css`)
    })

    app.get("/assets/invoice.css", (req,res) => {
        res.sendFile(`${__dirname}/pages/assets/invoice.css`)
    })

    /* route: /api/get-single-order */
    const mysqlAPI = require("./src/mysql-api");
    const helpers = require('./traits/functions');
    const shopifyAPI = require('./traits/requests').makeAnAPICallToShopify

    app.get(apiRoutePrefix + 'draft-orders', async (req, res) => {
        /* Pseudocode 
          1. Make a single API Request to Shopify
          2. Return the json from the request
        */

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
}