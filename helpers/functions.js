var crypto = require('crypto');
var mysqlAPI = require("../src/mysql-api");
// const nodeCache = require('node-cache');
// const cacheInstance = new nodeCache();
module.exports = {

    //Helper function to get shopify id from GraphQL GID
    extractIdFromGid: function (gid) {
        const parts = gid.split('/');
        return parts[parts.length - 1];
    },

    formatDate: function(dateString) {
        const date = new Date(dateString);
        const options = { 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        return date.toLocaleString('en-US', options);
    }
}
