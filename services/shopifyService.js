const { Sequelize, Model, DataTypes, DATE } = require('sequelize');
const mysqlAPI = require('../src/mysql-api')(Sequelize, DataTypes);
const functionTrait = require('../traits/functions');
const requestTrait = require('../traits/requests');

module.exports =  {
    getCustomerDetails: async function (query) {
        var dbRecord = await functionTrait.getStoreByDomain(query.shop);
        var endpoint = functionTrait.getShopifyAPIURLForStore('customers/'+query.logged_in_customer_id+'.json', dbRecord);
        var headers = functionTrait.getShopifyAPIHeadersForStore(dbRecord);
        var response = await requestTrait.makeAnAPICallToShopify('GET', endpoint, headers); 
        return response.respBody.customer;
    },

    getOrderDetails: async function (query) {
        var dbRecord = await functionTrait.getStoreByDomain(query.shop);
        var endpoint = functionTrait.getShopifyAPIURLForStore('orders.json', dbRecord);
        var headers = functionTrait.getShopifyAPIHeadersForStore(dbRecord);
        var response = await requestTrait.makeAnAPICallToShopify('GET', endpoint, headers); 
        var orders = response.respBody.orders;
        for(var i in orders) 
            if(orders[i].token == query.token) return orders[i];
        return null;
    },

    getShopifyOrderById: async function (query) {
        var dbRecord = await functionTrait.getStoreByDomain(query.shop);
        var endpoint = functionTrait.getShopifyAPIURLForStore('orders/'+query.orderId+'.json', dbRecord);
        var headers = functionTrait.getShopifyAPIHeadersForStore(dbRecord);
        var response = await requestTrait.makeAnAPICallToShopify('GET', endpoint, headers); 
        return response.respBody.order;
    },

    getShopifyProduct: async function (query, lineItem) {
        var dbRecord = await functionTrait.getStoreByDomain(query.shop);
        var endpoint = functionTrait.getShopifyAPIURLForStore('products/'+lineItem.product_id+'.json', dbRecord);
        var headers = functionTrait.getShopifyAPIHeadersForStore(dbRecord);
        var response = await requestTrait.makeAnAPICallToShopify('GET', endpoint, headers); 
        return response.respBody.product;
    }
}
