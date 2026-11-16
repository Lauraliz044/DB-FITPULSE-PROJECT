const service = require('../services/class-service');
const catalogController = require('./catalog-controller');

module.exports = catalogController(service, '/classes');
