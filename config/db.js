/* ─────────────────────────────────────────────
   StudySync — config/db.js
   PostgreSQL connection pool via node-postgres
───────────────────────────────────────────── */

const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: isProduction
    ? {
        rejectUnauthorized: false,
      }
    : false,

  // Better production settings
  max: 10,
  min: 2,

  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000,

  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

/* IMPORTANT: Prevent app crash on disconnect */
pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

const connectDB = async () => {
  try {
    await pool.query('SELECT NOW()');

    console.log(`✅ PostgreSQL connected — ${new Date().toString()}`);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
};

/* ── Query helper ── */
const query = (text, params) => pool.query(text, params);

/* ── Transaction helper ── */
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, connectDB, withTransaction };