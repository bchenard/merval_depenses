const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Simple Hello World function
exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});

// API endpoint compatible with the original backend
exports.api = onRequest((request, response) => {
  response.set('Content-Type', 'text/plain');
  response.send('Hello World');
});

