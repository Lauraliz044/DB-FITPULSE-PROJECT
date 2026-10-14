const service = require('../services/report-service');
const asyncHandler = require('../middleware/async-handler');
const { ok } = require('./response');

const sales = asyncHandler(async (request, response) => {
  const item = await service.sales(request.query);
  ok(response, item);
});

module.exports = { sales };
