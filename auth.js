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
            scopes: ["read_products", "read_customers", "read_draft_orders", "write_draft_orders", "read_orders", "write_orders", "read_payment_terms"],
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


    // var dashboardController = require('./controllers/dashboardController')(/*mysqlAPI,*/ traits);
    // var storeController = require('./controllers/storeController')(/*mysqlAPI,*/ traits);
    const authController = require('./controllers/authController')(shopify);
    const dashboardController = require('./controllers/dashboardController')();
    const draftorderController = require('./controllers/draftorderController')();
    const webhooksController = require('./controllers/webhooksController')();
    const orderController = require('./controllers/orderController')();
    const abandonedCheckoutController = require('./controllers/abandonedCheckoutController')();

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
    // app.get('/shopify/auth', installationController.index);
    // app.get('/shopify/auth/redirect', installationController.redirect);

    app.get(shopify.config.auth.path, shopify.auth.begin());
    app.get(
    shopify.config.auth.callbackPath,
    shopify.auth.callback(),
    authController.saveShopInfo,
    shopify.redirectToShopifyOrAppRoot()
    );

    app.get('/', shopify.ensureInstalledOnShop(), (req, res) => {
        res.send('Hello world!');
    });

    app.get('/exitiframe',shopify.ensureInstalledOnShop(), (req,res) => {
        res.redirect("/")
    })

    // Dashboard Routes
    app.get('/', shopify.ensureInstalledOnShop(), dashboardController.index);
    app.get('/invoice/:draft_id', shopify.ensureInstalledOnShop(), dashboardController.invoice);

    app.get("/assets/uptown.css", (req,res) => {
        res.sendFile(`${__dirname}/pages/assets/uptown.css`)
    })

    app.get("/assets/invoice.css", (req,res) => {
        res.sendFile(`${__dirname}/pages/assets/invoice.css`)
    })

    app.get("/assets/dashboard.css", (req,res) => {
        res.sendFile(`${__dirname}/pages/assets/dashboard.css`)
    })

    app.get("/views/components/tabs.js", (req,res) => {
        res.sendFile(`${__dirname}/pages/views/components/tabs.js`)
    })

    //Draft Order Routes
    app.post("/sync-draft-orders", draftorderController.updateAllDraftOrders)

    //Send Invoice Email
}
