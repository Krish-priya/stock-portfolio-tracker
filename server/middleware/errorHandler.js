class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = { ApiError, notFoundHandler, errorHandler };
