const { onRequest } = require('firebase-functions/v2/https');
const pool = require('../../../config/database');
const { handleOptionsRequest, sendResponse } = require('../../../utils/response');

const config = {
  region: 'europe-west9',
  vpcConnector: 'projects/merval-depenses-app/locations/europe-west9/connectors/merval-connector',
  vpcConnectorEgressSettings: 'PRIVATE_RANGES_ONLY',
  secrets: ['DB_PASSWORD'],
  timeoutSeconds: 60,
  memory: '256MiB',
};

exports.getExpenses = onRequest(config, async (req, res) => {
  const optionsResponse = handleOptionsRequest(req, res);
  if (optionsResponse) return optionsResponse;

  let client;
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Connected successfully');

    const result = await client.query(
      'SELECT * FROM expenses ORDER BY expense_date DESC'
    );

    console.log(`Retrieved ${result.rows.length} expenses`);

    sendResponse(res, true, 200, result.rows);
  } catch (error) {
    console.error('Error:', error);
    sendResponse(res, false, 500, null, 'Error fetching expenses', error.message);
  } finally {
    if (client) client.release();
  }
});

exports.getMonthlyEstimate = onRequest(config, async (req, res) => {
  const optionsResponse = handleOptionsRequest(req, res);
  if (optionsResponse) return optionsResponse;

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

    sendResponse(res, true, 200, {
      totalSoFar,
      daysElapsed,
      daysInMonth,
      estimatedTotal,
    });
  } catch (error) {
    console.error('Error:', error);
    sendResponse(res, false, 500, null, 'Error calculating estimate', error.message);
  } finally {
    if (client) client.release();
  }
});



