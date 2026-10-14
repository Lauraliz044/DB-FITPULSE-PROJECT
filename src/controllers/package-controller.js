const service = require('../services/package-service');
const asyncHandler = require('../middleware/async-handler');
const { ok, created } = require('./response');

const list = asyncHandler(async (request, response) => {
  const item = await service.list(request.query);
  ok(response, item);
});

const get = asyncHandler(async (request, response) => {
  const item = await service.get(request.params.id);
  ok(response, item);
});

const create = asyncHandler(async (request, response) => {
  const item = await service.create(request.body);
  created(response, `/packages/${item.id}`, item);
});

const update = asyncHandler(async (request, response) => {
  const item = await service.update(request.params.id, request.body);
  ok(response, item);
});

const remove = asyncHandler(async (request, response) => {
  await service.remove(request.params.id);
  response.status(204).end();
});

module.exports = { list, get, create, update, remove };
