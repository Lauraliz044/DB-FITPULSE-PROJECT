const service = require('../services/purchase-service');
const asyncHandler = require('../middleware/async-handler');
const { ok, created } = require('./response');

const create = asyncHandler(async (request, response) => {
  const item = await service.create(request.body, request.user);
  created(response, `/purchases/${item.id}`, item);
});

const get = asyncHandler(async (request, response) => {
  const item = await service.get(request.params.id, request.user);
  ok(response, item);
});

const list = asyncHandler(async (request, response) => {
  const item = await service.list(request.query, undefined, request.user);
  ok(response, item);
});

const listForUser = asyncHandler(async (request, response) => {
  const item = await service.list(request.query, request.params.userId, request.user);
  ok(response, item);
});

module.exports = { create, get, list, listForUser };
