var env = process.env.NODE_ENV;
var config = require('../config.json')[env];

//initialize the models and create an instance so we can use the static methods in them
const StoreAdmin = require("../models/storeadmin.js")
const ShopifyStores = require("../models/shopifystore.js")
const UserStore = require("../models/adminstore.js")
const DraftOrder = require("../models/draftorder.js")

async function findUserForStoreId(store) {
    return UserStores.findOne({where: { store_id: store.table_id }, order: [ ['id', 'DESC'] ], raw: true});
}

async function findUserByUserShop(userShop) {
    return Users.findOne({where: {id: userShop.user_id}, raw: true});
}

async function findUserById(id) {
    return Users.findOne({where: {id: id}, raw: true});
}

async function getShopifyStoreData(user) {
    var userStoreData = await UserStores.findOne({
        where: {"user_id": user.id},
        order: [['id', 'DESC']]
    });

    if(userStoreData !== null) {
        var storeData = await ShopifyStores.findOne({
            where: { "table_id": userStoreData.store_id }
        })
        return storeData;
    }

    return null;
}

async function getAllShopifyStoresAssociatedWithUser(user) {
    var userStores = await UserStores.findAll({
        where: {"user_id": user.id},
        order: [['id', 'DESC']]
    });

    if(userStores !== null) {
        var storeIds = new Array();
        for await(var data of userStores) {
            storeIds.push(data.store_id);
        }

        var stores = await ShopifyStores.findAll({
            where: {"table_id": storeIds}
        });

        return stores;
    }
    return null;
}

async function getAllStores (selectionFields) {
    return await ShopifyStores.findAll({
        attributes:selectionFields
    })
}

async function getStoreByDomain (shop) {
    return await ShopifyStores.findOne({where: {myshopify_domain: shop}, raw: true});
}

async function updateOrCreateUserRecord (userBody) {
    return await this.updateOrCreateOnModel(Users, {"email": userBody.email}, userBody);
}

async function updateOrCreateStoreRecord (storeBody) {
    return await this.updateOrCreateOnModel(ShopifyStores, {"myshopify_domain": storeBody.myshopify_domain}, storeBody);
}

async function updateOrCreateUserStoreMapping(userRecord, storeRecord){
    var obj = {
        "user_id": userRecord.id,
        "store_id": storeRecord.table_id
    };
    return await this.updateOrCreateOnModel(UserStores, obj, obj);
}

async function updateOrCreateOnModel (Model, where, newItem) {
    // First try to find the record
    const dbOperation = await Model.findOne({where: where, raw: true}).then(function (foundItem) {
        if (!foundItem) {
            return Model.create(newItem).then(function (item) { return { item: item, created: true }; })
        }
         // Found an item, update it
        return Model.update(newItem, {where: where} ).then(function (item) { console.log(item); return {item: item, created: false} }) ;
    });

    // console.log('dbOperation');
    // console.log(dbOperation);

    return Model.findOne({where: where, raw: true});
}

module.exports = {
    findUserForStoreId,
    findUserByUserShop,
    findUserById,
    getShopifyStoreData,
    getAllShopifyStoresAssociatedWithUser,
    getAllStores,
    getStoreByDomain,
    updateOrCreateUserRecord,
    updateOrCreateStoreRecord,
    updateOrCreateUserStoreMapping,
    updateOrCreateOnModel
}