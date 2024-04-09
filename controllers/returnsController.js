module.exports = (mysqlAPI, traits, env) => {
    
    const { verifyAppProxyHmac } = require('shopify-application-proxy-verification');
    const shopifyService = require('../services/shopifyService');
    
    return {
        index: async function (req, res) {
            try {
                var verifyRequest = verifyAppProxyHmac(req.query, env.SHOPIFY_CLIENT_SECRET)
                if(verifyRequest) {
                    var customerDetails = await shopifyService.getCustomerDetails(req.query);
                    var orderDetails = await shopifyService.getOrderDetails(req.query);

                    console.log(req.query.token);
                    console.log(orderDetails);

                    return res.render('manage_return', {
                        'customerDetails': customerDetails,
                        'orderDetails': orderDetails
                    })
                }
                return res.json({'status': 'OK', 'message': 'You are here in the app proxy', 'verifyRequest': verifyRequest});
            } catch (error) {
                return res.json({
                    data: null,
                    count: 0,
                    query: null,
                    message: error.message
                })
            }
        },
    }
}