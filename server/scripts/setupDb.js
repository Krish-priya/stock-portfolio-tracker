require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function setupDb() {
  const {
    DB_HOST = 'localhost',
    DB_PORT = 3306,
    DB_USER = 'root',
    DB_PASSWORD = '',
    DB_NAME = 'stock_tracker',
  } = process.env;

  console.log(`Connecting to MySQL at ${DB_HOST}:${DB_PORT} as ${DB_USER}...`);

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    console.log(`Creating database "${DB_NAME}" if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await connection.query(`USE \`${DB_NAME}\``);

    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Running schema.sql...');
    await connection.query(schemaSql);

    console.log('Database setup complete. Tables created: users, holdings, watchlist, portfolio_snapshots.');
  } finally {
    await connection.end();
  }
}

setupDb().catch((err) => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});
