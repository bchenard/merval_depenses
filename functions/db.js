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

// Déterminer si on est en production
// En production Firebase Functions, FUNCTION_NAME ou K_SERVICE sont définis
const isProduction = process.env.FUNCTION_NAME !== undefined ||
                     process.env.K_SERVICE !== undefined;

// Obtenir la configuration
let dbConfig;

if (isProduction) {
  // Configuration pour Cloud SQL (Production)
  // Les variables sont chargées depuis .env.yaml lors du déploiement
  dbConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'merval_depenses',
    host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
  };

  console.log('🔧 Database config (Production):');
  console.log('  - User:', dbConfig.user);
  console.log('  - Database:', dbConfig.database);
  console.log('  - Host:', dbConfig.host);
} else {
  // Configuration pour développement local
  dbConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'merval_depenses',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
  };

  console.log('🔧 Database config (Development):');
  console.log('  - User:', dbConfig.user);
  console.log('  - Database:', dbConfig.database);
  console.log('  - Host:', dbConfig.host);
  console.log('  - Port:', dbConfig.port);
}

// Créer le pool de connexions
const pool = new Pool(dbConfig);

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


