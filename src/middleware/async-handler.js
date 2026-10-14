function asyncHandler(action) {
  return async function handleRequest(request, response, next) {
    try {
      await action(request, response, next);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = asyncHandler;
