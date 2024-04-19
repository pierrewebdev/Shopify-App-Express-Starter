module.exports = (mysqlAPI, traits, env) => {
    
    const { verifyAppProxyHmac } = require('shopify-application-proxy-verification');
    const shopifyService = require('../services/shopifyService');
    const returnService = require('../services/returnService');

    const appURL = env.APP_URL;
    
    return {
        index: async function (req, res) {
            try {
                var verifyRequest       = verifyAppProxyHmac(req.query, env.SHOPIFY_CLIENT_SECRET)
                if(verifyRequest) {
                    var customerDetails = await shopifyService.getCustomerDetails(req.query);
                    var orderDetails    = await shopifyService.getOrderDetails(req.query);

                    var exchangeItems   = await returnService.getItemsEligibleForExchange(req.query, orderDetails);
                    var returnItems     = await returnService.getItemsEligibleForReturn(req.query, orderDetails);
                    
                    return res.render('manage_return', {
                        customerDetails : customerDetails,
                        orderDetails    : orderDetails,
                        exchangeItems   : exchangeItems,
                        returnItems     : returnItems,
                        query           : req.query,
                        appURL          : appURL
                    })
                }
                return res.json({
                    status  : false, 
                    message : 'Invalid Request'
                });
            } catch (error) {
                return res.json({
                    data    : null,
                    status  : false,
                    count   : 0,
                    query   : null,
                    message : error.message
                })
            }
        },

        getExchangeData: async function (req, res) {
            const query = req.query;
            try {
                var orderDetails = await shopifyService.getShopifyOrderById(query)  
                var lineItem = null;
                
                for(var i in orderDetails.line_items) {
                    if(orderDetails.line_items[i].id == query.lineItemId) {
                        lineItem = orderDetails.line_items[i];
                        break;
                    }
                }

                if(lineItem != null) {
                    var productDetails = await shopifyService.getShopifyProduct(query, lineItem);
                    var imagesArr = {};
                    if(productDetails.hasOwnProperty('images') && productDetails.images != null) {
                        var shopifyImages = productDetails.images;
                        for(var i in shopifyImages) {
                            imagesArr[shopifyImages[i].id] = shopifyImages[i];
                        }
                    }

                    returnPayload = {
                        'images': imagesArr,
                        'variants': productDetails.variants,
                        'productDetails': productDetails,
                        'chosenVariant': lineItem,
                        'query': query 
                    };

                    var app = req.app;
                    app.render('partials/exchangeLineItem', returnPayload, function (err, html) {
                        if(err) {
                            console.log('error in partial');
                            console.log(err.message);
                        }
                        return res.json({status: true, html: html});
                    }) 
                } else {
                    return res.json({
                        status: false,
                        message: 'Invalid line item / Line Item not found'
                    })    
                }
            } catch (error) {
                return res.json({
                    status: false,
                    message: error.message
                })
            }
        }
    }
}