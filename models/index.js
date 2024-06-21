//Initialize Models and Set up Relationships
const StoreAdmin = require("./storeadmin.js")
const ShopifyStore = require("./shopifystore.js")
const UserStore = require("./adminstore.js")
const DraftOrder = require("./draftorder.js")



StoreAdmin.hasMany(UserStore);
ShopifyStore.hasMany(UserStore);
ShopifyStore.hasMany(DraftOrder)

UserStore.belongsTo(StoreAdmin);
UserStore.belongsTo(ShopifyStore);