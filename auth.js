
const jwt = require('jsonwebtoken');

module.exports = function(app, /*passport,*/ mysqlAPI, traits, env) {

    var dashboardController = require('./controllers/dashboardController')(mysqlAPI, traits);
    var storeController = require('./controllers/storeController')(mysqlAPI, traits);
    var installationController = require('./controllers/installationController')(mysqlAPI, traits, env);
    
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

    app.get('/dashboard', RequireAuth, dashboardController.index);

    const apiRoutePrefix = '/api/'; // This is so if we do versioning like /api/v1 or /api/v2 
    
    //Sync data APIs
    const syncPrefix = apiRoutePrefix +'sync/';
    app.get(syncPrefix+'orders', storeController.syncOrders);
    app.get(syncPrefix+'products', storeController.syncProducts);
    app.get(syncPrefix+'products/collections', storeController.syncProductCollections);
    app.get(syncPrefix+'locations', storeController.syncStoreLocations);
}