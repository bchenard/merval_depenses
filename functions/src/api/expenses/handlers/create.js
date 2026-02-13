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

exports.createExpense = onRequest(config, async (req, res) => {
  const optionsResponse = handleOptionsRequest(req, res);
  if (optionsResponse) return optionsResponse;

  let client;
  try {
    const { amount, place, expense_date, category } = req.body;

    if (!amount || !place || !expense_date || !category) {
      return sendResponse(
        res,
        false,
        400,
        null,
        'Missing required fields: amount, place, expense_date, category'
      );
    }

    client = await pool.connect();

    const result = await client.query(
      `INSERT INTO expenses (amount, place, category, expense_date, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [amount, place, category, expense_date]
    );

    console.log('Expense added:', result.rows[0]);

    sendResponse(res, true, 201, result.rows[0], 'Expense added successfully');
  } catch (error) {
    console.error('Error:', error);
    sendResponse(res, false, 500, null, 'Error adding expense', error.message);
  } finally {
    if (client) client.release();
  }
});


