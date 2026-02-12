const { Pool } = require('pg');

// Charger les variables d'environnement pour le développement local
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

/**
 * Configuration de la connexion à Cloud SQL PostgreSQL
 *
 * Pour la production (déployé sur Firebase Functions), utilisez Unix socket
 * Pour le développement local, utilisez TCP
 */

const isProduction = process.env.NODE_ENV === 'production';

// Configuration pour Cloud SQL (Production)
const productionConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'merval-depenses-db',
  host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
};

// Configuration pour développement local
const developmentConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'merval_depenses',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
};

// Créer le pool de connexions
const pool = new Pool(isProduction ? productionConfig : developmentConfig);

// Gestion des erreurs du pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Exécuter une requête SQL
 * @param {string} text - La requête SQL
 * @param {Array} params - Les paramètres de la requête
 * @returns {Promise} - Le résultat de la requête
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Obtenir un client du pool pour les transactions
 * @returns {Promise} - Un client de la base de données
 */
async function getClient() {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;

  // Wrapper pour logger les requêtes
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };

  // Wrapper pour logger la release
  client.release = () => {
    client.query = query;
    client.release = release;
    return release.apply(client);
  };

  return client;
}

/**
 * Fermer le pool de connexions
 */
async function closePool() {
  await pool.end();
}

module.exports = {
  query,
  getClient,
  closePool,
  pool,
};


