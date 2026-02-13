const { onRequest } = require('firebase-functions/v2/https');
const { Pool } = require('pg');

// Charger dotenv seulement si disponible (dev local)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv n'est pas installé en production, c'est OK
  console.log('dotenv not available (production mode)');
}

// Configuration de la base de données
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'merval_depenses',
  host: '10.21.0.3', // IP privée de Cloud SQL via VPC Connector
  port: 5432,
  max: 1,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 600000,
  allowExitOnIdle: true,
  ssl: {
    rejectUnauthorized: false, // Cloud SQL utilise des certificats auto-signés
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// GET expenses
exports.getExpenses = onRequest(
  {
    region: 'europe-west9',
    vpcConnector: 'projects/merval-depenses-app/locations/europe-west9/connectors/merval-connector',
    vpcConnectorEgressSettings: 'PRIVATE_RANGES_ONLY',
    secrets: ['DB_PASSWORD'],
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (req, res) => {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.set(key, value);
    });

    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }

    let client;
    try {
      console.log('Connecting to database...');
      client = await pool.connect();
      console.log('Connected successfully');

      const result = await client.query(
        'SELECT * FROM expenses ORDER BY expense_date DESC'
      );

      console.log(`Retrieved ${result.rows.length} expenses`);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching expenses',
        error: error.message,
        code: error.code,
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  }
);

// GET monthly estimate
exports.getMonthlyEstimate = onRequest(
  {
    region: 'europe-west9',
    vpcConnector: 'projects/merval-depenses-app/locations/europe-west9/connectors/merval-connector',
    vpcConnectorEgressSettings: 'PRIVATE_RANGES_ONLY',
    secrets: ['DB_PASSWORD'],
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (req, res) => {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.set(key, value);
    });

    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }

    let client;
    try {
      client = await pool.connect();

      const result = await client.query(
        `SELECT COALESCE(SUM(amount), 0) AS total
         FROM expenses
         WHERE expense_date >= date_trunc('month', CURRENT_DATE)
           AND expense_date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')`
      );

      const totalSoFar = Number(result.rows[0]?.total ?? 0);
      const now = new Date();
      const daysElapsed = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const estimatedTotal = daysElapsed > 0
        ? (totalSoFar / daysElapsed) * daysInMonth
        : 0;

      res.json({
        success: true,
        data: {
          totalSoFar,
          daysElapsed,
          daysInMonth,
          estimatedTotal,
        },
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error calculating estimate',
        error: error.message,
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  }
);

// POST expense
exports.createExpense = onRequest(
  {
    region: 'europe-west9',
    vpcConnector: 'projects/merval-depenses-app/locations/europe-west9/connectors/merval-connector',
    vpcConnectorEgressSettings: 'PRIVATE_RANGES_ONLY',
    secrets: ['DB_PASSWORD'],
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (req, res) => {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.set(key, value);
    });

    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }

    let client;
    try {
      const { amount, place, expense_date, category } = req.body;

      if (!amount || !place || !expense_date || !category) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: amount, place, expense_date, category',
        });
      }

      client = await pool.connect();

      const result = await client.query(
        `INSERT INTO expenses (amount, place, category, expense_date, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [amount, place, category, expense_date]
      );

      console.log('Expense added:', result.rows[0]);

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Expense added successfully',
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding expense',
        error: error.message,
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  }
);

// DELETE expense
exports.deleteExpense = onRequest(
  {
    region: 'europe-west9',
    vpcConnector: 'projects/merval-depenses-app/locations/europe-west9/connectors/merval-connector',
    vpcConnectorEgressSettings: 'PRIVATE_RANGES_ONLY',
    secrets: ['DB_PASSWORD'],
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (req, res) => {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.set(key, value);
    });

    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }

    let client;
    try {
      const id = req.query.id || req.body.id;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Missing expense id',
        });
      }

      client = await pool.connect();

      const result = await client.query(
        'DELETE FROM expenses WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found',
        });
      }

      console.log('Expense deleted:', result.rows[0]);

      res.json({
        success: true,
        message: 'Expense deleted successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting expense',
        error: error.message,
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  }
);

// Test DB connection
exports.testDb = onRequest(
  {
    region: 'europe-west9',
    vpcConnector: 'projects/merval-depenses-app/locations/europe-west9/connectors/merval-connector',
    vpcConnectorEgressSettings: 'PRIVATE_RANGES_ONLY',
    secrets: ['DB_PASSWORD'],
  },
  async (req, res) => {
    let client;
    try {
      console.log('Testing database connection...');
      client = await pool.connect();

      const result = await client.query('SELECT NOW() as time, version() as version');

      res.json({
        success: true,
        message: 'Database connected successfully!',
        serverTime: result.rows[0].time,
        version: result.rows[0].version,
        config: {
          host: pool.options.host,
          database: pool.options.database,
          user: pool.options.user,
          hasPassword: !!pool.options.password,
        },
      });
    } catch (error) {
      console.error('Connection test failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  }
);

// Simple Hello World
exports.helloWorld = onRequest({ region: 'europe-west9' }, (req, res) => {
  res.json({ message: 'Hello from Cloud Functions!' });
});

// API endpoint
exports.api = onRequest({ region: 'europe-west9' }, (req, res) => {
  res.json({ message: 'API endpoint' });
});

