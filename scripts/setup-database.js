require('dotenv').config({ quiet: true });
const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');

async function setup() {
  let connection;
  try {
    const databaseName = process.env.DB_NAME;
    if (!databaseName || !/^[a-zA-Z0-9_]+$/.test(databaseName)) {
      throw new Error('DB_NAME must contain only letters, digits and underscores');
    }
    connection = await mysql.createConnection({
      host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER, password: process.env.DB_PASSWORD,
      multipleStatements: true, timezone: 'Z'
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\`
      CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
    await connection.query(`USE \`${databaseName}\``);
    await connection.query("SET time_zone = '+00:00'");
    const sql = await fs.readFile(path.join(__dirname, '../database/schema.sql'), 'utf8');
    await connection.query(sql);
    console.log('Database schema is ready');
  } catch (error) {
    console.error(`Database setup failed: ${error.code || error.message}`);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
}

setup();
