var env = process.env.NODE_ENV;
var config = require('../config.json')[env];

//initialize the models and create an instance so we can use the static methods in them
const User = require("../models/user.js")
const ShopifyStores = require("../models/shopifystore.js")
const UserStores = require("../models/userstore.js")
const DraftOrder = require("../models/draftorder.js")

async function findUserForStoreId(store) {
    return UserStores.findOne({where: { store_id: store.id }, order: [ ['id', 'DESC'] ], raw: true});
}

async function findUserById(id) {
    return User.findOne({where: {id: id}, raw: true});
}

async function getShopifyStoreData(user) {
    var userStoreData = await UserStores.findOne({
        where: {"user_id": user.id},
        order: [['id', 'DESC']]
    });

    if(userStoreData !== null) {
        var storeData = await ShopifyStores.findOne({
            where: { "id": userStoreData.store_id },
            raw: true
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
            where: {"id": storeIds}
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

async function createUserRecord(userData){
    return User.create({
        name: userData.name,
        email: userData.email,
        password: userData.password
    })
}

async function findOrCreateUserRecord (userBody) {
    // return await this.updateOrCreateOnModel(Users, {"email": userBody.email}, userBody);
    return User.findOrCreateUserById(userBody)
}

async function findStoreRecord (storeBody) {
    return ShopifyStores.findOne({
        where: {shopify_id: storeBody.id}
    })
}

async function createStoreRecord (storeBody) {
    return ShopifyStores.create({
        name: storeBody.name,
        shopify_id: storeBody.id,
        myshopify_domain: storeBody.myshopify_domain,
        access_token: storeBody.accessToken,
        currency: storeBody.currency,
        email: storeBody.email,
        phone: storeBody.phone
    })
}

async function createUserStoreMapping(storeRecord,userRecord){
    //But if I don't have a valid id for both tables I can't make a UserStore
    return UserStores.create({
        store_id: storeRecord.id,
        user_id: userRecord.id
    })
}

async function findUserWithStoreId(storeRecord){
    return UserStores.findOne({
        where: {
            store_id: storeRecord.id
        }
    })
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

    return Model.findOne({where: where, raw: true});
}

async function findDraftOrderById(draftOrder) {
    return await DraftOrder.findOne({
        where: {
            draft_order_id: draftOrder.id
        }
    })
}

async function createDraftOrderRecord(draftOrder, storeRecord) {
    return DraftOrder.create({
        draft_order_id: draftOrder.id,
       currency: draftOrder.currency,
       order_name: draftOrder.name,
       order_line_items: JSON.stringify(draftOrder.line_items),
       invoice_url: draftOrder.invoice_url,
       total_price: draftOrder.total_price,
       subtotal_price: draftOrder.subtotal_price,
       total_tax: draftOrder.total_tax,
       status: draftOrder.status,
       store_id: storeRecord.id
    })
}

module.exports = {
    findUserForStoreId,
    findUserById,
    getShopifyStoreData,
    getAllShopifyStoresAssociatedWithUser,
    getAllStores,
    getStoreByDomain,
   findOrCreateUserRecord,
   findStoreRecord,
   createStoreRecord,
   createUserStoreMapping,
    updateOrCreateOnModel,
    findUserWithStoreId,
    createUserRecord,
    findDraftOrderById,
    createDraftOrderRecord
}