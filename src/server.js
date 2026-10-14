const app = require('./app');
const { pool, query } = require('./config/database');
const settings = require('./config/settings');

async function start() {
  try {
    await query('SELECT 1');
    app.listen(settings.port, () => {
      console.log(`FitPulse API: ${settings.baseUrl}${settings.apiPrefix}`);
      console.log(`API documentation: ${settings.baseUrl}/docs`);
    });
  } catch (error) {
    console.error(`Startup failed: ${error.code || error.message}`);
    await pool.end();
    process.exitCode = 1;
  }
}

start();
