const { Pool } = require('pg');

// Charger dotenv seulement si disponible (dev local)
try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv not available (production mode)');
}

// Configuration de la base de données
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'merval_depenses',
  host: '10.21.0.3',
  port: 5432,
  max: 1,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 600000,
  allowExitOnIdle: true,
  ssl: {
    rejectUnauthorized: false,
  },
};

console.log('Database config:', {
  ...dbConfig,
  password: dbConfig.password ? '***' : 'MISSING',
});

const pool = new Pool(dbConfig);

pool.on('error', (err) => {
  console.error('Pool error:', err);
});

module.exports = pool;

