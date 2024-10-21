var crypto = require('crypto');
var RequestTrait = require('./requests');
var mysqlAPI = require("../src/mysql-api");
const { MailerSend, EmailParams, Sender, Recipient } =  require("mailersend");

// const nodeCache = require('node-cache');
// const cacheInstance = new nodeCache();
module.exports = {
    
    //This will come into use later, in case you decide to use app proxies
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
            // console.log(val);
            val = val.replace("%","%25");
            val = val.replace("&","%26");
            data.push(key+'='+val);
        }
        data = data.join('&');

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
    getShopifyAPIHeadersForStore(accessToken) {
        return {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken
        }
    },

    //used to save data when someone is first installing app
    async saveDetailsToDatabase(shopifyStore, accessToken) {
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

            //Find or Create DB Records using Models
            let storeRecord = await mysqlAPI.findStoreRecord(storeBody);

            if(!storeRecord){
                storeRecord = await mysqlAPI.createStoreRecord(storeBody)
            }

            
            const userStoreRecord = await mysqlAPI.findUserWithStoreId(storeRecord);

            if(!userStoreRecord){
                //create new admin and then create adminstore record for it
                const newUserRecord = await mysqlAPI.createUserRecord(userBody)
                const newUserStoreRecord = await mysqlAPI.createUserStoreMapping(storeRecord, newUserRecord)

            }

            //Any other operations here..just after installing the store

            return true;
        } catch(error) {
            console.log('error in saving details to database: '+error.message);
        }
    },

    async getShopifyStoreDetails(query, accessToken) {
        var endpoint = this.getShopifyAPIURLForStore('shop.json', {"myshopify_domain": query.shop});
        var headers = this.getShopifyAPIHeadersForStore(accessToken);
        var response = await RequestTrait.makeAnAPICallToShopify('GET', endpoint, headers);

        console.log("HEADERS",headers)

        if(response.status) 
            return response.respBody.shop;

        return null;
    },

    verifyWebhookRequest: async function (req, clientSecret) {
        try {
            let shopifyApiSecret = clientSecret;

            let hmac = req.headers["x-shopify-hmac-sha256"];
            const message = req.rawBody; //Set in server.js express.json() function
            const generatedHash = crypto
                .createHmac("sha256", shopifyApiSecret)
                .update(message)
                .digest("base64");
            
            const signatureOk = crypto.timingSafeEqual(
                Buffer.from(generatedHash),
                Buffer.from(hmac)
            );
            return {status: true, okay: signatureOk};    
        } catch (error) {
            return {status: false, okay: false, error: error.message}
        }
    },


    async requestAccessTokenFromShopify(query, clientId, clientSecret) {
        var endpoint = `https://${query.shop}/admin/oauth/access_token`;
        var body = {
            'client_id': clientId,
            'client_secret': clientSecret,
            'code': query.code
        };

        var headers = {
            'Content-Type': 'application/json'
        };

        var response = await RequestTrait.makeAnAPICallToShopify('POST', endpoint, headers, body);
        
        if(response.status) {
            return response.respBody.access_token;
        }

        return null;
    },

    async checkStoreRecordValidity(dbRecord) {
        if(!dbRecord) { //Using !dbRecord checks for all undefined, null and empty checks
            return false;
        }

        var endpoint = this.getShopifyAPIURLForStore('shop.json', dbRecord);
        var headers = this.getShopifyAPIHeadersForStore(dbRecord);
        var response = await RequestTrait.makeAnAPICallToShopify('GET', endpoint, headers);
        return response.status && response.respBody.hasOwnProperty('shop');
    },

    //Helper function to get shopify id from GraphQL GID
    extractIdFromGid: function(gid){
        const parts = gid.split('/');
        return parts[parts.length - 1];
    },

    sendInvoiceEmail: async function(){
        const mailerSend = new MailerSend({
            apiKey: process.env.MAILER_SEND_API_KEY,
          });
          
          const sentFrom = new Sender("you@yourdomain.com", "Your name");
          
          const recipients = [
            new Recipient("your@client.com", "Your Client")
          ];
          
          const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setReplyTo(sentFrom)
            .setSubject("This is a Subject")
            .setHtml("<strong>This is the HTML content</strong>")
            .setText("This is the text content");
          
          await mailerSend.email.send(emailParams);
    }
}

