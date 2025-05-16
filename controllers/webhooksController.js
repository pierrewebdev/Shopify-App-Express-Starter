module.exports = () => {
    const functionTrait = require('../helpers/functions');
    const mysqlAPI = require("../src/mysql-api")
    const env = require('dotenv').config()

    var accessScopes = process.env.SHOPIFY_API_SCOPES.split(',');
    var clientId = env.SHOPIFY_CLIENT_ID;
    var clientSecret = env.SHOPIFY_CLIENT_SECRET;
    var redirectUri = env.APP_URL+'shopify/auth/redirect';
    const getApIHeaders = functionTrait.getShopifyAPIHeadersForStore
    const apiEndpoint = functionTrait.getShopifyAPIURLForStore

    return {

        /**
         * 
         * First 3 functions are related to GDPR requirement of Shopify.
         * You don't REALLY need to pass data back so leave it be.
         * 
         * deleteCustomerData, getCustomerData, shopDataDelete
         */
        deleteCustomerData: async function (req, res) {
            const verifyWebhookRequest = await functionTrait.verifyWebhookRequest(req, clientSecret);
            if(verifyWebhookRequest.hasOwnProperty('status') && verifyWebhookRequest.hasOwnProperty('okay') && verifyWebhookRequest.okay) {
                return res.json({status: true, data: null});
            }
            return res.status(401).json({status: false, data: 'Unauthorized'});
        },

        getCustomerData: async function (req, res) {
            const verifyWebhookRequest = await functionTrait.verifyWebhookRequest(req, clientSecret);
            if(verifyWebhookRequest.hasOwnProperty('status') && verifyWebhookRequest.hasOwnProperty('okay') && verifyWebhookRequest.okay) {
                return res.json({status: true, data: null});
            }
            return res.status(401).json({status: false, data: 'Unauthorized'});
        },

        shopDataDelete: async function (req, res) {
            const verifyWebhookRequest = await functionTrait.verifyWebhookRequest(req, clientSecret);
            if(verifyWebhookRequest.hasOwnProperty('status') && verifyWebhookRequest.hasOwnProperty('okay') && verifyWebhookRequest.okay) {
                return res.json({status: true, data: null}).status(200);
            }
            return res.status(401).json({status: false, data: 'Unauthorized'});
        },

        processOrderUpdate: async function (req, res) {
            const verifyWebhookRequest = await functionTrait.verifyWebhookRequest(req, clientSecret);
            if(verifyWebhookRequest.hasOwnProperty('status') && verifyWebhookRequest.hasOwnProperty('okay') && verifyWebhookRequest.okay) {
                setTimeout(async () => {
                    try {
                        //Write some code to handle the request in another thread.
                        //Reason being that processing right away would require time 
                        //And u need to send response to Shopify webhook IMMEDIATELY 
                        
                    } catch (error) {
                        console.log(error.message);
                        console.trace(error);
                    }
                    
                }, 1000);
                return res.json({status: true, data: null}).status(200);
            }
            return res.status(401).json({status: false, data: 'Unauthorized'});
        },

        processOrderCreate: async function (req, res) {
            const verifyWebhookRequest = await functionTrait.verifyWebhookRequest(req, clientSecret);
            if(verifyWebhookRequest.hasOwnProperty('status') && verifyWebhookRequest.hasOwnProperty('okay') && verifyWebhookRequest.okay) {
                setTimeout(async () => {
                    try {
                        //Write some code to handle the request in another thread.
                        //Reason being that processing right away would require time 
                        //And u need to send response to Shopify webhook IMMEDIATELY 
                        
                    } catch (error) {
                        console.log(error.message);
                        console.trace(error);
                    }
                    
                }, 1000);
                return res.json({status: true, data: null}).status(200);
            }
            return res.status(401).json({status: false, data: 'Unauthorized'});
        },

        processCartCreate: async function (req, res) {
            const verifyWebhookRequest = await functionTrait.verifyWebhookRequest(req, clientSecret);
            if(verifyWebhookRequest.hasOwnProperty('status') && verifyWebhookRequest.hasOwnProperty('okay') && verifyWebhookRequest.okay) {
                setTimeout(async () => {
                    try {
                        var handleCart = require('../jobs/handleCart')(mysqlAPI, traits, env, req);
                        new handleCart().work();    
                    } catch (error) {
                        console.log(error.message);
                        console.trace(error);
                    }
                    
                }, 1000);
                return res.json({status: true, data: null}).status(200);
            }
            return res.status(401).json({status: false, data: 'Unauthorized'});
        },
        registerDraftOrderCreate: async function(req, res){
            const userId = req.session.user.id
            const userRecord = await mysqlAPI.findUserById(userId)
            const shopifyStore = await mysqlAPI.getShopifyStoreData(userRecord)

            //API Request to create webhook
            const headers = getApIHeaders(shopifyStore.access_token);

            const payload = {
                "webhook": {
                    "address": process.env.APP_URL + "sync-draft-orders",
                    "topic": "draft_orders/create",
                    "format": "json"
                }
            }

            const endpoint = apiEndpoint("/webhooks.json", shopifyStore)

            try {
                const webhookRequest = await shopifyApi("POST",endpoint, headers, payload)
                console.log(webhookRequest.respBody)
                if(!webhookRequest.respBody.errors){
                    res.send({success: "You have registered the webhook"})
                    return
                }

                res.send({"message": "There has been an error with registering the webhook"})
            } catch (error) {
                console.error("There was an error with registering the webhook", error)
                res.json({
                    error: error
                })
            }
        },
        getActiveWebhooks: async function(req, res){
            const userId = req.session.user.id
            const userRecord = await mysqlAPI.findUserById(userId)
            const shopifyStore = await mysqlAPI.getShopifyStoreData(userRecord)

            //API Request to create webhook
            const headers = getApIHeaders(shopifyStore.access_token);
            const endpoint = apiEndpoint("/webhooks.json", shopifyStore)

            const webhooks = await shopifyApi("GET",endpoint, headers)
            console.log(webhooks.respBody)
            res.send(webhooks.respBody)

                
        },
        deleteWebhook: async function (req, res){
            const userId = req.session.user.id
            const userRecord = await mysqlAPI.findUserById(userId)
            const shopifyStore = await mysqlAPI.getShopifyStoreData(userRecord)

            const webhookId = req.params.id

            //API Request to create webhook
            const headers = getApIHeaders(shopifyStore.access_token);
            const endpoint = apiEndpoint(`webhooks/${webhookId}.json`, shopifyStore)

            const deleteRequest = await shopifyApi("DELETE",endpoint, headers)
            res.send({message: "Successfully Deleted Webhook"})
        }
    }
}
