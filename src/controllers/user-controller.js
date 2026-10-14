const service = require('../services/user-service');
const asyncHandler = require('../middleware/async-handler');
const { ok, created } = require('./response');

const register = asyncHandler(async (request, response) => {
  const item = await service.register(request.body);
  created(response, `/users/${item.id}`, item);
});

const list = asyncHandler(async (request, response) => {
  const item = await service.list(request.query);
  ok(response, item);
});

const get = asyncHandler(async (request, response) => {
  const item = await service.get(request.params.id, request.user);
  ok(response, item);
});

const updateStatus = asyncHandler(async (request, response) => {
  const item = await service.updateStatus(request.params.id, request.body);
  ok(response, item);
});

module.exports = { register, list, get, updateStatus };
