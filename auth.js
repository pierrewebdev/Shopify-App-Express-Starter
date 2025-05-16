// Comprehensive Web Crypto API polyfill
const crypto = require('crypto');
const { webcrypto } = crypto;

global.crypto = {
  ...webcrypto,
  getRandomValues: (array) => {
    if (!ArrayBuffer.isView(array)) {
      throw new TypeError('Argument must be an ArrayBufferView');
    }
    if (array.byteLength > 65536) {
      throw new Error('Quota exceeded');
    }
    const buffer = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
    crypto.randomFillSync(buffer);
    return array;
  },
  subtle: webcrypto.subtle,
  randomUUID: webcrypto.randomUUID
};


module.exports = function(app, /*passport, mysqlAPI,*/ traits, env) {

    
    //Set up Shopify API package
    const { shopifyApp } = require('@shopify/shopify-app-express');
    const shopify = shopifyApp({
        api: {
            apiKey: process.env.SHOPIFY_CLIENT_ID,
            apiSecretKey: process.env.SHOPIFY_CLIENT_SECRET,
            scopes: process.env.SHOPIFY_API_SCOPES.split(','),
            hostName: process.env.APP_URL
        },
        auth: {
            path: '/shopify/auth',
            callbackPath: '/shopify/auth/redirect'
        },
        webhooks: {
            path: '/api/webhooks'
        },
    });

    // Add this before your routes to log all incoming requests
    // app.use((req, res, next) => {
    //   console.log(`[${req.method}] ${req.path} - Shop:`, req.query.shop);
    //   next();
    // });



    // var dashboardController = require('./controllers/dashboardController')(/*mysqlAPI,*/ traits);
    // var storeController = require('./controllers/storeController')(/*mysqlAPI,*/ traits);
    const authController = require('./controllers/authController')(shopify);
    const dashboardController = require('./controllers/dashboardController')();
    const webhooksController = require('./controllers/webhooksController')();
    // ====================== Main App Routes ====================== //

    //GDPR webhooks
    app.post('/gdpr/customer_data_delete', webhooksController.deleteCustomerData);
    app.post('/gdpr/customer_data_request', webhooksController.getCustomerData);
    app.post('/shop_data_delete', webhooksController.shopDataDelete);

    //Other webhooks
    app.get("/register-draft-webhook", webhooksController.registerDraftOrderCreate)
    app.get("/get-webhooks", webhooksController.getActiveWebhooks)
    app.delete("/delete-webhook/:id", webhooksController.deleteWebhook)

    //App Installation Routes
    app.get(shopify.config.auth.path, shopify.auth.begin());
    app.get(
    shopify.config.auth.callbackPath,
    shopify.auth.callback(),
    authController.saveShopInfo.bind(authController),
    shopify.redirectToShopifyOrAppRoot()
    );

    app.get('/', shopify.ensureInstalledOnShop(), (req, res) => {
        try {
          res.sendFile(path.join(__dirname, 'public', 'index.html'));
        } catch (error) {
            console.error('Error in root route:', error);
            res.status(500).send('Internal Server Error');
          
        }
    });

    app.get('/exitiframe',shopify.ensureInstalledOnShop(), (req,res) => {
        res.redirect(req.query.redirectUri);
    })
}
