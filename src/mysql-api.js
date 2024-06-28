
module.exports = (Sequelize, DataTypes) => {
    var env = process.env.NODE_ENV;
    var config = require('../config.json')[env];
    var sequelize = new Sequelize(config.database, config.username, config.password, config);

    //initialize the models and create an instance so we can start using them
    
    const Users = require('../models/users')(sequelize, DataTypes);
    const UserStores = require('../models/userstores')(sequelize, DataTypes);
    const ShopifyStores = require('../models/shopifystore')(sequelize, DataTypes);
    // const Orders = require('../models/orders')(sequelize, DataTypes);
    // const Products = require('../models/products')(sequelize, DataTypes);
    // const ProductCollections = require('../models/productCollections')(sequelize, DataTypes);
    // const StoreLocations = require('../models/locations')(sequelize, DataTypes);
    const moment = require('moment');

    //const {Op} = require('sequelize');
    
    return {
        findUserForStoreId: async function (store) {
            return UserStores.findOne({where: { store_id: store.table_id }, order: [ ['id', 'DESC'] ], raw: true});
        },

        findUserByUserShop: async function (userShop) {
            return Users.findOne({where: {id: userShop.user_id}, raw: true});
        },

        findUserById: async function (id) {
            return Users.findOne({where: {id: id}, raw: true});
        },

        getShopifyStoreData: async function (user) {
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
        },

        getAllShopifyStoresAssociatedWithUser: async function (user) {
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
        },

        getAllStores: async function (selectionFields) {
            return await ShopifyStores.findAll({
                attributes:selectionFields
            })
        },

        getStoreByDomain: async function (shop) {
            return await ShopifyStores.findOne({where: {myshopify_domain: shop}, raw: true});
        },

        updateOrCreateUserRecord: async function (userBody) {
            return await this.updateOrCreateOnModel(Users, {"email": userBody.email}, userBody);
        },

        updateOrCreateStoreRecord: async function (storeBody) {
            return await this.updateOrCreateOnModel(ShopifyStores, {"myshopify_domain": storeBody.myshopify_domain}, storeBody);
        },

        updateOrCreateUserStoreMapping: async function (userRecord, storeRecord) {
            var obj = {
                "user_id": userRecord.id,
                "store_id": storeRecord.table_id
            };
            return await this.updateOrCreateOnModel(UserStores, obj, obj);
        },

        updateOrCreateOnModel: async function (Model, where, newItem) {
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
    };
}