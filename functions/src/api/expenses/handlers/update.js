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

exports.updateExpense = onRequest(config, async (req, res) => {
  const optionsResponse = handleOptionsRequest(req, res);
  if (optionsResponse) return optionsResponse;

  let client;
  try {
    const { id, amount, place, expense_date, category } = req.body;

    if (!id || !amount || !place || !expense_date || !category) {
      return sendResponse(
        res,
        false,
        400,
        null,
        'Missing required fields: id, amount, place, expense_date, category'
      );
    }

    client = await pool.connect();

    const result = await client.query(
      `UPDATE expenses
       SET amount = $1, place = $2, category = $3, expense_date = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [amount, place, category, expense_date, id]
    );

    if (result.rowCount === 0) {
      return sendResponse(res, false, 404, null, 'Expense not found');
    }

    console.log('Expense updated:', result.rows[0]);

    sendResponse(res, true, 200, result.rows[0], 'Expense updated successfully');
  } catch (error) {
    console.error('Error:', error);
    sendResponse(res, false, 500, null, 'Error updating expense', error.message);
  } finally {
    if (client) client.release();
  }
});


