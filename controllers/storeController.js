module.exports = (mysqlAPI, traits) => {
  const functionTrait = traits.FunctionTrait;
  const requestTrait = traits.RequestTrait;

  async function saveCollectionsForStore(store, type) {
    var headers = functionTrait.getShopifyAPIHeadersForStore(store.access_token);
    var since_id = null;
    var collections = null;
    do {
      var sinceIdPrefix = since_id !== null ? '?since_id='+since_id : '';
      var endpointPrefix = type == 'smart' ? 'smart_collections.json':'custom_collections.json';
      var endpoint = functionTrait.getShopifyAPIURLForStore(endpointPrefix+sinceIdPrefix, store);
      var response = await requestTrait.makeAnAPICallToShopify('GET', endpoint, headers);
      
      if(response.status) {
        collections = type == 'smart' ? response.respBody.smart_collections : response.respBody.custom_collections;
        if(collections !== null && collections.length > 0) {
          for await (var collection of collections) {
            collection.store_id = store.table_id;
            collection.collection_type = type;
            collection.image = collection.image != undefined ? collection.image.src : null;
            await mysqlAPI.updateOrCreateShopifyProductCollection(collection);
            since_id = collection.id 
          }
        }
      } else {
        collections = null;
      }
    } while (collections !== null && collections.length > 0);
    return true;
  }

  async function saveLocationsForStore(store) {
    var headers = functionTrait.getShopifyAPIHeadersForStore(store.access_token);
    var since_id = null;
    var locations = null;
    do {
      var sinceIdPrefix = since_id !== null ? '?since_id='+since_id : '';
      var endpointPrefix = 'locations.json';
      var endpoint = functionTrait.getShopifyAPIURLForStore(endpointPrefix+sinceIdPrefix, store);
      var response = await requestTrait.makeAnAPICallToShopify('GET', endpoint, headers);
      
      if(response.status) {
        locations = response.respBody.locations;
        if(locations !== null && locations.length > 0) {
          for await (var location of locations) {
            location.store_id = store.table_id;
            await mysqlAPI.updateOrCreateShopifyLocation(location);
            since_id = location.id 
          }
        }
      } else {
        locations = null;
      }
    } while (locations !== null && locations.length > 0);
    return true;
  }

  return {
    listStores: async function (req, res) {
      try {
        var authUser = req.user;
        var storeData = await mysqlAPI.getShopifyStoreData(authUser);
        return res.json({
          'status': true,
          'storeData': storeData
        });
      } catch (error) {
        return res.json({
          'status': false,
          'message': err.message
        })
      }
    }
  }
}


