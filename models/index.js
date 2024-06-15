//Initialize Models and Set up Relationships
const User = require("./user.js")
const ShopifyStore = require("./shopifystore.js")
const UserStore = require("./userstore.js")
const DraftOrder = require("./draftorder.js")



User.hasMany(UserStore);
ShopifyStore.hasMany(UserStore);
ShopifyStore.hasMany(DraftOrder)

UserStore.belongsTo(User);
UserStore.belongsTo(ShopifyStore);