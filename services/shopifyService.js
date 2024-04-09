const { Sequelize, Model, DataTypes, DATE } = require('sequelize');
const mysqlAPI = require('../src/mysql-api')(Sequelize, DataTypes);
const functionTrait = require('../traits/functions');
const requestTrait = require('../traits/requests');

module.exports =  {
    getCustomerDetails: async function (query) {
        console.log('In customer details function');
        var shop = query.shop;
        console.log('shop '+shop)
        var dbRecord = await functionTrait.getStoreByDomain(shop);
        var endpoint = functionTrait.getShopifyAPIURLForStore('customers/'+query.logged_in_customer_id+'.json', dbRecord);
        var headers = functionTrait.getShopifyAPIHeadersForStore(dbRecord);
        var response = await requestTrait.makeAnAPICallToShopify('GET', endpoint, headers); 
        return response.respBody;
    },

    getOrderDetails: async function (query) {
        console.log('In order details function');
        var shop = query.shop;
        console.log('shop '+shop)
        var dbRecord = await functionTrait.getStoreByDomain(shop);
        var endpoint = functionTrait.getShopifyAPIURLForStore('orders.json?fields=name,total_price,token,id', dbRecord);
        var headers = functionTrait.getShopifyAPIHeadersForStore(dbRecord);
        var response = await requestTrait.makeAnAPICallToShopify('GET', endpoint, headers); 
        return response.respBody;
    }
}
