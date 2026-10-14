const express = require('express');
const swaggerUi = require('swagger-ui-express');
const settings = require('./config/settings');
const errorHandler = require('./middleware/error-handler');
const openapi = require('../docs/openapi.json');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
openapi.servers = [{ url: `${settings.baseUrl}${settings.apiPrefix}` }];
app.get('/openapi.json', (request, response) => response.json(openapi));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.use(settings.apiPrefix, require('./routes'));
app.use((request, response) => {
  response.status(404).json({ error: { message: 'Route not found' } });
});
app.use(errorHandler);

module.exports = app;
