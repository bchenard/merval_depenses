const { onRequest } = require('firebase-functions/v2/https');
const pool = require('./config/database');
const { handleOptionsRequest, sendResponse } = require('./utils/response');
const expenseHandlers = require('./api/expenses');

// Export all expense handlers
exports.getExpenses = expenseHandlers.getExpenses;
exports.getMonthlyEstimate = expenseHandlers.getMonthlyEstimate;
exports.createExpense = expenseHandlers.createExpense;
exports.updateExpense = expenseHandlers.updateExpense;
exports.deleteExpense = expenseHandlers.deleteExpense;

// Utility functions
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

      sendResponse(res, true, 200, {
        serverTime: result.rows[0].time,
        version: result.rows[0].version,
        config: {
          host: pool.options.host,
          database: pool.options.database,
          user: pool.options.user,
          hasPassword: !!pool.options.password,
        },
      }, 'Database connected successfully!');
    } catch (error) {
      console.error('Connection test failed:', error);
      sendResponse(res, false, 500, null, null, error.message);
    } finally {
      if (client) client.release();
    }
  }
);

exports.helloWorld = onRequest({ region: 'europe-west9' }, (req, res) => {
  sendResponse(res, true, 200, { message: 'Hello from Cloud Functions!' });
});

exports.api = onRequest({ region: 'europe-west9' }, (req, res) => {
  sendResponse(res, true, 200, { message: 'API endpoint' });
});


