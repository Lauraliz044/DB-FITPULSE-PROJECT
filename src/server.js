const app = require('./app');
const { pool, query } = require('./config/database');
const settings = require('./config/settings');
const { checkSchema } = require('./config/schema');

async function start() {
  try {
    await query('SELECT 1');
    await checkSchema(pool);
        app.listen(settings.port, () => {
      const localUrl = `http://localhost:${settings.port}`;
      console.log(`FitPulse web: ${localUrl}`);
      console.log(`FitPulse API: ${localUrl}${settings.apiPrefix}`);
      console.log(`API documentation: ${localUrl}/docs`);
    });
  } catch (error) {
    console.error(`Startup failed: ${error.code || error.message}`);
    await pool.end();
    process.exitCode = 1;
  }
}

start();
