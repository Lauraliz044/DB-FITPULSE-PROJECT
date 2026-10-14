const settings = require('../config/settings');

function created(response, path, item) {
  response.location(`${settings.apiPrefix}${path}`).status(201).json({ data: item });
}

function ok(response, data) {
  response.json({ data });
}

module.exports = { created, ok };
