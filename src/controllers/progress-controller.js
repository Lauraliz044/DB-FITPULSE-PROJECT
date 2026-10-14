const service = require('../services/progress-service');
const asyncHandler = require('../middleware/async-handler');
const { ok } = require('./response');

const get = asyncHandler(async (request, response) => {
  const item = await service.get(request.params.userId, request.user);
  ok(response, item);
});

module.exports = { get };
