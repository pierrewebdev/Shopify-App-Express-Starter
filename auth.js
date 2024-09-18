
const jwt = require('jsonwebtoken');

module.exports = function(app, /*passport, mysqlAPI,*/ traits, env) {

    // var dashboardController = require('./controllers/dashboardController')(/*mysqlAPI,*/ traits);
    // var storeController = require('./controllers/storeController')(/*mysqlAPI,*/ traits);
    const installationController = require('./controllers/installationController')(/*mysqlAPI,*/);
    const dashboardController = require('./controllers/dashboardController')();
    const draftorderController = require('./controllers/draftorderController')();
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

    //GDPR webhooks
    app.post('/gdpr/customer_data_delete', webhooksController.deleteCustomerData);
    app.post('/gdpr/customer_data_request', webhooksController.getCustomerData);
    app.post('/shop_data_delete', webhooksController.shopDataDelete);

    //App Installation Routes
    app.get('/shopify/auth', installationController.index);
    app.get('/shopify/auth/redirect', installationController.redirect);

    // Dashboard Routes
    app.get('/dashboard', RequireAuth, dashboardController.index);
    app.get('/invoice/:draft_id', RequireAuth, dashboardController.invoice);

    app.get("/assets/uptown.css", (req,res) => {
        res.sendFile(`${__dirname}/pages/assets/uptown.css`)
    })

    app.get("/assets/invoice.css", (req,res) => {
        res.sendFile(`${__dirname}/pages/assets/invoice.css`)
    })

    //Draft Order Routes
    app.post("/sync-draft-orders", draftorderController.updateAllDraftOrders)

    app.get("/test", webhooksController.registerDraftOrderCreate)

    app.get("/get-webhooks", webhooksController.getActiveWebhooks)
    app.delete("/delete-webhook/:id", webhooksController.deleteWebhook)

}