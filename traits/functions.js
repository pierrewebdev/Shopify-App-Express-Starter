var crypto = require('crypto');
const nodeCache = require('node-cache');
const cacheInstance = new nodeCache();
module.exports = {
    // getStoreByDomain: async function (shop) {
    //     return await mysqlAPI.getStoreByDomain(shop);
    // },

    verifyProxyRequest: async function (query, clientSecret) {
        var data = new Array();
        var signature = query.signature;
        delete(query.signature);
        for (var key in query) {
            key = key.replace("%", "%25");
            key = key.replace("&", "%26");
            key = key.replace("=", "%3D");
            
            var val = query[key];
            val = val.replace("%","%25");
            val = val.replace("&","%26");
            data.push(key+'='+val);
        }
        data = data.join('');
        //var data = "logged_in_customer_id="+query.logged_in_customer_id+"path_prefix="+query.path_prefix+"shop="+query.shop+"timestamp="+query.timestamp;
        let calculated_signature = crypto.createHmac('sha256', clientSecret).update(data).digest('hex')
        // console.log(signature);
        // console.log(calculated_signature);
        return signature == calculated_signature;
    },

    isRequestFromShopify: async function (req, clientSecret) {
        var hmac = req.hmac;
        delete(req.hmac);
        var data = new Array();
        for (var key in req) {
            key = key.replace("%", "%25");
            key = key.replace("&", "%26");
            key = key.replace("=", "%3D");
            
            var val = req[key];
            console.log(val);
            val = val.replace("%","%25");
            val = val.replace("&","%26");
            data.push(key+'='+val);
        }
        data = data.join('&');

        console.log("DATA After Joins", data)
        console.log("HMAC After Joins", hmac)
        const genHash = crypto
            .createHmac("sha256", clientSecret)
            .update(data)
            .digest("hex");

        return genHash === hmac;
    },

    /**
     * @param {string} path 
     * @param {object} store
     * @returns {string} URL - Format the same as Shopify API URLs
     */
    getShopifyAPIURLForStore(path, store) {
        var API_VERSION = process.env.SHOPIFY_API_VERSION;
        if(API_VERSION.length < 1) 
            API_VERSION = '2024-01';
        return `https://${store.myshopify_domain}/admin/api/${API_VERSION}/${path}`;
    },

    /**
     * @param {object} store 
     * @returns {object} headers - Used to make authenticated Shopify API calls
     */
    getShopifyAPIHeadersForStore(store) {
        return {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": store.accessToken
        }
    }
}