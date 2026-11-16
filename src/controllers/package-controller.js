const service = require('../services/package-service');
const catalogController = require('./catalog-controller');

module.exports = catalogController(service, '/packages');
