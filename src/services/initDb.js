const { pool } = require('./db');

const createTablesQuery = `
  CREATE TABLE IF NOT EXISTS user_profiles (
    telegram_id BIGINT PRIMARY KEY,
    bp_xp INTEGER DEFAULT 0,
    bp_level INTEGER DEFAULT 1,
    role VARCHAR(20) DEFAULT 'user',
    is_banned BOOLEAN DEFAULT FALSE,
    last_daily TIMESTAMP DEFAULT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT REFERENCES user_profiles(telegram_id) ON DELETE CASCADE,
    username VARCHAR(255),
    character_name VARCHAR(50),
    class VARCHAR(20),
    hp INT DEFAULT 100,
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    energy INT DEFAULT 100,
    gold INT DEFAULT 0,
    last_energy_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_name VARCHAR(50) NOT NULL,
    quantity INTEGER DEFAULT 1
  );
`;

async function initDatabase() {
  try {
    await pool.query(createTablesQuery);
    console.log('Database Initialized: Users and Inventory tables are ready ✅');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
}

module.exports = { initDatabase };
