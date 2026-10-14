const service = require('../services/record-service');
const asyncHandler = require('../middleware/async-handler');
const { ok, created } = require('./response');

const create = asyncHandler(async (request, response) => {
  const item = await service.create(request.params.userId, request.body, request.user);
  created(response, `/personal-records/${item.id}`, item);
});

const get = asyncHandler(async (request, response) => {
  const item = await service.get(request.params.id, request.user);
  ok(response, item);
});

const listForUser = asyncHandler(async (request, response) => {
  const item = await service.list(request.params.userId, request.query, request.user);
  ok(response, item);
});

const update = asyncHandler(async (request, response) => {
  const item = await service.update(request.params.id, request.body, request.user);
  ok(response, item);
});

const remove = asyncHandler(async (request, response) => {
  await service.remove(request.params.id, request.user);
  response.status(204).end();
});

module.exports = { create, get, listForUser, update, remove };
