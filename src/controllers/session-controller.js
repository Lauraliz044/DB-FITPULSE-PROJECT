const service = require('../services/session-service');
const asyncHandler = require('../middleware/async-handler');

const create = asyncHandler(async (request, response) => {
  const item = await service.create(request.body);
  response.status(201).json({ data: item });
});

module.exports = { create };
