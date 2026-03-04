const { Pool } = require('pg');
require('dotenv').config();

const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL successfully ✅');
    client.release();
    return true;
  } catch (err) {
    console.error('Error connecting to database:', err);
    return false;
  }
}

module.exports = { pool, testConnection };