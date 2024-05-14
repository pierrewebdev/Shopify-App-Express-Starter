const nodeCache = require('node-cache');
const myCache = new nodeCache();

module.exports = (mysqlAPI, traits) => {
  const functionTrait = traits.FunctionTrait;
  const requestTrait = traits.RequestTrait;

  return {
    index: async function (req, res) {
      try {
        return res.json({'status': true, 'message': 'In dashboard api', 'account': req.session.user});
      } catch (error) {
        return res.json({
          "status": false,
          "message": "Something went wrong. If the issue persists, please contact Customer support.",
          "debug": {
            "error_message": error.message
          }
        })
      }
    }
  }
}