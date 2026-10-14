const service = require('../services/reservation-service');
const asyncHandler = require('../middleware/async-handler');
const { ok, created } = require('./response');

const create = asyncHandler(async (request, response) => {
  const item = await service.create(request.body, request.user);
  created(response, `/reservations/${item.id}`, item);
});

const get = asyncHandler(async (request, response) => {
  const item = await service.get(request.params.id, request.user);
  ok(response, item);
});

const listForUser = asyncHandler(async (request, response) => {
  const item = await service.list(request.params.userId, request.query, request.user);
  ok(response, item);
});

const attendance = asyncHandler(async (request, response) => {
  const item = await service.attendance(request.params.id, request.body);
  ok(response, item);
});

module.exports = { create, get, listForUser, attendance };
