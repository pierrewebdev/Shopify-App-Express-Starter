const mysqlAPI = require("../src/mysql-api");
const R = require("ramda");

module.exports = (shopify) => {
    return {
        saveShopInfo: async function(req, res, next) {
            try {
                // Verify session exists
                if (!res.locals.shopify?.session) {
                    throw new Error('Shopify session not found');
                }

                const { session } = res.locals.shopify;

                // Validate required session properties
                if (!session?.accessToken || !session?.shop) {
                    throw new Error('Session missing required properties');
                }

                // Create client with proper structure
                const client = new shopify.api.clients.Graphql({ session });

                // Make API call
                const response = await client.query({
                    data: `{
                        shop {
                            id
                            name
                            currencyCode
                            email
                        }
                    }`
                });

                const shopObj = response.body.data.shop;
                const storeData = {
                    id: shopObj.id,
                    name: shopObj.name,
                    currency: shopObj.currencyCode,
                    email: shopObj.email,
                    myshopify_domain: session.shop,
                    session: JSON.stringify({...session})
                };

                // Save store record
                await this.saveDetailsToDatabase(storeData);
                next();
            } catch (error) {
                console.error('Auth callback error:', error);
                return res.status(500).send('Authentication failed');
            }
        },

        saveDetailsToDatabase: async function(storeData) {
            try {
                // 1. Create/Update Shopify Store
                let storeRecord = await mysqlAPI.getStoreByDomain(storeData.myshopify_domain);
                if (!storeRecord) {
                    storeRecord = await mysqlAPI.createStoreRecord(storeData);
                }
                return storeRecord;
            } catch (error) {
                console.error('Failed to save installation details:', error);
                throw error;
            }
        },

    };
};
