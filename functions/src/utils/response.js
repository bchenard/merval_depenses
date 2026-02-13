const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function setCorsHeaders(res) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.set(key, value);
  });
}

function handleOptionsRequest(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(204).send('');
  }
  return null;
}

function sendResponse(res, success, statusCode = 200, data = null, message = null, error = null) {
  setCorsHeaders(res);
  res.status(statusCode).json({
    success,
    ...(data && { data }),
    ...(message && { message }),
    ...(error && { error }),
  });
}

module.exports = {
  setCorsHeaders,
  handleOptionsRequest,
  sendResponse,
};

