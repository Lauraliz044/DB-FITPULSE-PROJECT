function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error);
  let status = error.status || 500;
  let message = error.message;
  if (error.code === 'ER_DUP_ENTRY') {
    status = 409;
    message = 'The resource already exists';
  }
  if (['ER_ROW_IS_REFERENCED_2', 'ER_NO_REFERENCED_ROW_2'].includes(error.code)) {
    status = 409;
    message = 'The operation conflicts with related records';
  }
  if (error.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON body';
  }
  if (status >= 500) {
    console.error(error.code || error.name);
    message = 'Internal server error';
  }
  response.status(status).json({ error: { message } });
}

module.exports = errorHandler;
