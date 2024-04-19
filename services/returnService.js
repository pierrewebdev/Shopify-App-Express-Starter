const { Sequelize, Model, DataTypes, DATE } = require('sequelize');
const mysqlAPI = require('../src/mysql-api')(Sequelize, DataTypes);
const functionTrait = require('../traits/functions');
const requestTrait = require('../traits/requests');

module.exports =  {
    getItemsEligibleForExchange: async function (query, orderDetails) {
        var returnVal = {};
        for(var i in orderDetails.line_items) {
            returnVal[orderDetails.line_items[i].id] = await this.evaluateLineItemForExchange(query, orderDetails, orderDetails.line_items[i]); 
        }
        return returnVal;   
    },

    getItemsEligibleForReturn: async function (query, orderDetails) {
        var returnVal = {};
        for(var i in orderDetails.line_items) {
            returnVal[orderDetails.line_items[i].id] = await this.evaluateLineItemForReturn(query, orderDetails, orderDetails.line_items[i]); 
        }
        return returnVal; 
    },

    evaluateLineItemForExchange: async function (query, orderDetails, lineItem) {
        //Put logic to evaluate a line item for exchange eligbility
        return false;
    },

    evaluateLineItemForReturn: async function (query, orderDetails, lineItem) {
        //Put logic to evaluate a line item for return eligbility
        return false;
    },
}
