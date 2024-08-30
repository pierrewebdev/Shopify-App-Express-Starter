module.exports = () => {
    const functionTrait = require('../traits/functions');
    const requestTrait = require('../traits/requests');
    const mysqlAPI = require("../src/mysql-api")
    const env = require('dotenv').config()

    var accessScopes = 'read_products,write_orders,write_returns,read_customers,write_fulfillments, read_draft_orders';
    var clientId = env.SHOPIFY_CLIENT_ID;
    var clientSecret = env.SHOPIFY_CLIENT_SECRET;
    var redirectUri = env.APP_URL+'shopify/auth/redirect';

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
        }
    }
}