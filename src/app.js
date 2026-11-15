const express = require('express');
const path = require('node:path');
const swaggerUi = require('swagger-ui-express');
const settings = require('./config/settings');
const errorHandler = require('./middleware/error-handler');
const openapi = require('../docs/openapi.json');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: settings.bodyLimit }));
openapi.servers = [{ url: `${settings.baseUrl}${settings.apiPrefix}` }];
app.get('/openapi.json', (request, response) => response.json(openapi));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.use(settings.apiPrefix, require('./routes'));
app.get('/app-config.json', (request, response) => {
  response.set('Cache-Control', 'no-store').json({
    apiPrefix: settings.apiPrefix, timeZone: settings.timeZone
  });
});
app.get('/', (request, response) => response.redirect('/login.html'));
app.use(express.static(path.join(__dirname, '../public'), {
  index: false, dotfiles: 'deny',
  setHeaders(response) {
    response.set('X-Content-Type-Options', 'nosniff');
    response.set('Referrer-Policy', 'same-origin');
    response.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
  }
}));
app.use((request, response) => {
  response.status(404).json({ error: { message: 'Route not found' } });
});
app.use(errorHandler);

module.exports = app;
