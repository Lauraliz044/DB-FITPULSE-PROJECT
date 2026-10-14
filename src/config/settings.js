require('dotenv').config({ quiet: true });

const requiredNames = [
  'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'
];
for (const name of requiredNames) {
  if (!process.env[name]) {
    throw new Error(`Missing environment variable: ${name}`);
  }
}
if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters');
}

function positiveSetting(name, defaultValue) {
  const value = Number(process.env[name] || defaultValue);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

const settings = {
  bodyLimit: process.env.MAX_BODY_SIZE || '100kb',
  port: positiveSetting('PORT', 3000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  maxLoginAttempts: positiveSetting('MAX_LOGIN_ATTEMPTS', 5),
  lockMinutes: positiveSetting('LOCK_MINUTES', 15),
  timeZone: process.env.BUSINESS_TIME_ZONE || 'America/Bogota',
  database: {
    host: process.env.DB_HOST,
    port: positiveSetting('DB_PORT', 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: positiveSetting('DB_CONNECTION_LIMIT', 10),
    timezone: 'Z',
    dateStrings: true,
    decimalNumbers: false
  }
};

new Intl.DateTimeFormat('en-US', { timeZone: settings.timeZone });
module.exports = settings;
