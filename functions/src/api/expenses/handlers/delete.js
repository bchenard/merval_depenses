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

exports.deleteExpense = onRequest(config, async (req, res) => {
  const optionsResponse = handleOptionsRequest(req, res);
  if (optionsResponse) return optionsResponse;

  let client;
  try {
    const id = req.query.id || req.body.id;

    if (!id) {
      return sendResponse(res, false, 400, null, 'Missing expense id');
    }

    client = await pool.connect();

    const result = await client.query(
      'DELETE FROM expenses WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return sendResponse(res, false, 404, null, 'Expense not found');
    }

    console.log('Expense deleted:', result.rows[0]);

    sendResponse(res, true, 200, result.rows[0], 'Expense deleted successfully');
  } catch (error) {
    console.error('Error:', error);
    sendResponse(res, false, 500, null, 'Error deleting expense', error.message);
  } finally {
    if (client) client.release();
  }
});


