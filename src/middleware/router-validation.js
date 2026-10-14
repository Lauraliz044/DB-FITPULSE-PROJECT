const { identifier, fields } = require('../utils/validation');

function configureRouter(router) {
  for (const name of ['id', 'userId', 'classId']) {
    router.param(name, (request, response, next, value) => {
      request.params[name] = identifier(value, name);
      next();
    });
  }
  router.use((request, response, next) => {
    if (request.method !== 'GET') fields(request.query, []);
    next();
  });
}

function noQuery(request, response, next) {
  fields(request.query, []);
  next();
}

module.exports = { configureRouter, noQuery };
