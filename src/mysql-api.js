var env = process.env.NODE_ENV;
var config = require('../config.json')[env];

//initialize the models and create an instance so we can use the static methods in them
const User = require("../models/user.js")
const ShopifyStores = require("../models/shopifystore.js")
const UserStores = require("../models/userstore.js")
const DraftOrder = require("../models/draftorder.js")
const Order = require("../models/order.js")
const AbandonedCheckout = require("../models/abandonedCheckout.js")
const Customer = require("../models/customer.js")

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
        shopify_session: storeBody.session,
        currency: storeBody.currency,
        email: storeBody.email
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

//uses the draft order id from Shopify now the primary key of the Draft Order DB
async function findDraftOrderById(id) {
    return await DraftOrder.findOne({
        where: {
            shopify_api_id: id
        }
    })
}

async function createDraftOrderRecord(draftOrder, customerRecord) {
    return DraftOrder.create({
       shopify_api_id: draftOrder.id,
       currency: draftOrder.currency,
       shopify_created_date: draftOrder.shopify_created_date,
       order_name: draftOrder.name,
       order_line_items: JSON.stringify(draftOrder.line_items),
       invoice_url: draftOrder.invoice_url,
       total_price: draftOrder.total_price,
       subtotal_price: draftOrder.subtotal_price,
       total_tax: draftOrder.total_tax,
       status: draftOrder.status,
       customer_id: customerRecord.id
    })
}

async function getAllDraftOrders() {
    return await DraftOrder.findAll()
}

async function getAllOrders() {
    return await Order.findAll()
}

async function getAllCheckouts() {
    return await AbandonedCheckout.findAll()
}

async function findCustomerById(id){
    return await Customer.findOne({
        where: {
            id: id
        }
    })
}

async function createOrUpdateCustomer(customerData, storeRecord) {
    return Customer.sequelize.transaction(async (t) => {
        // Try to find by shopify_id first if available
        if (customerData.id) {
            const byId = await Customer.findOne({
                where: {
                    shopify_api_id: customerData.id,
                    store_id: storeRecord.id
                },
                transaction: t
            });
            if (byId) return byId;
        }

        // Try to find by email/store_id
        const byEmail = await Customer.findOne({
            where: {
                email: customerData.email,
                store_id: storeRecord.id
            },
            transaction: t
        });

        if (byEmail) {
            // Update shopify_id if it's now available and doesn't exist
            if (customerData.id && !byEmail.shopify_api_id) {
                // Verify no existing record with this shopify_id
                const existing = await Customer.findOne({
                    where: {
                        shopify_api_id: customerData.id,
                        store_id: storeRecord.id
                    },
                    transaction: t
                });

                if (existing) {
                    throw new Error('Customer with this Shopify ID already exists');
                }

                await byEmail.update({
                    shopify_api_id: customerData.id
                }, { transaction: t });
            }
            return byEmail;
        }

        // Create new record
        return Customer.create({
            first_name: customerData.firstName,
            email: customerData.email,
            shopify_api_id: customerData.id || null,
            store_id: storeRecord.id
        }, { transaction: t });
    });
}

async function findCustomerByShopifyId(id){
    return await Customer.findOne({
        where: {
            shopify_api_id: id
        }
    })
}

async function findCustomerByNameAndEmail(firstName, email, storeRecord){
    return await Customer.findOne({
        where: {
            first_name: firstName,
            email: email,
            store_id: storeRecord.id
        }
    })
}

async function createCustomerRecord(customer, storeRecord) {
    return Customer.create({
       first_name: customer.firstName,
       email: customer.email,
       shopify_api_id: customer.id,
       store_id: storeRecord.id
    })
}

async function findOrderById(id) {
    return await Order.findOne({
        where: {
            shopify_api_id: id
        }
    })
}

async function createOrderRecord(order, customerRecord) {
    
    return Order.create({
       shopify_api_id: order.id,
       currency: order.currency,
       order_name: order.name,
       order_line_items: JSON.stringify(order.line_items),
       shopify_created_date: order.shopify_created_date,
       total_price: order.total_price,
       subtotal_price: order.subtotal_price,
       total_tax: order.total_tax,
       status: order.status,
       customer_id: customerRecord.id
    })
}

async function updateOrCreateCheckoutRecord(checkoutData, customerRecord) {
    return AbandonedCheckout.sequelize.transaction(async (t) => {
        // Try to find existing checkout record
        const checkoutRecord = await AbandonedCheckout.findOne({
            where: {
                shopify_api_id: checkoutData.id
            },
            transaction: t
        });

        if (checkoutRecord) {
            // Update existing record
            await checkoutRecord.update({
                currency: checkoutData.currency,
                checkout_name: checkoutData.name,
                checkout_line_items: JSON.stringify(checkoutData.line_items),
                checkout_url: checkoutData.checkout_url,
                checkout_completed: checkoutData.checkout_completed,
                shopify_created_date: checkoutData.shopify_created_date,
                total_price: checkoutData.total_price,
                subtotal_price: checkoutData.subtotal_price,
                total_tax: checkoutData.total_tax,
                customer_id: customerRecord.id
            }, { transaction: t });
            return checkoutRecord;
        }

        // Create new record
        return AbandonedCheckout.create({
            shopify_api_id: checkoutData.id,
            currency: checkoutData.currency,
            checkout_name: checkoutData.name,
            checkout_line_items: JSON.stringify(checkoutData.line_items),
            checkout_url: checkoutData.checkout_url,
            checkout_completed: checkoutData.checkout_completed,
            shopify_created_date: checkoutData.shopify_created_date,
            total_price: checkoutData.total_price,
            subtotal_price: checkoutData.subtotal_price,
            total_tax: checkoutData.total_tax,
            customer_id: customerRecord.id
        }, { transaction: t });
    });
}

async function createCheckoutRecord(checkout, customerRecord) {
    return this.updateOrCreateCheckoutRecord(checkout, customerRecord);
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
    createDraftOrderRecord,
    getAllDraftOrders,
    findCustomerById,
    findCustomerByShopifyId,
    createCustomerRecord,
    createOrderRecord,
    findOrderById,
    createCheckoutRecord,
    findCustomerByNameAndEmail,
    createOrUpdateCustomer,
    updateOrCreateCheckoutRecord,
    getAllCheckouts,
    getAllOrders
}
