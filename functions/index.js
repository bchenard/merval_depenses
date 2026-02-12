const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { query, getClient } = require("./db");

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

// Test de connexion à la base de données
exports.testDb = onRequest(async (request, response) => {
  try {
    const result = await query('SELECT NOW() as current_time');
    logger.info("Database connection successful", result.rows[0]);
    response.json({
      success: true,
      message: "Database connection successful",
      currentTime: result.rows[0].current_time
    });
  } catch (error) {
    logger.error("Database connection failed", error);
    response.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message
    });
  }
});

// Exemple: Obtenir toutes les dépenses
exports.getExpenses = onRequest(async (request, response) => {
  try {
    const result = await query('SELECT * FROM expenses ORDER BY expense_date DESC');
    response.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error("Error fetching expenses", error);
    response.status(500).json({
      success: false,
      message: "Error fetching expenses",
      error: error.message
    });
  }
});

// Exemple: Créer une dépense
exports.createExpense = onRequest(async (request, response) => {
  // Permettre CORS
  response.set('Access-Control-Allow-Origin', '*');

  if (request.method === 'OPTIONS') {
    response.set('Access-Control-Allow-Methods', 'POST');
    response.set('Access-Control-Allow-Headers', 'Content-Type');
    response.status(204).send('');
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { amount, place, expense_date, category } = request.body;

    // Validation des champs requis
    if (!amount || !place || !expense_date || !category) {
      response.status(400).json({
        success: false,
        message: "amount, place, expense_date et category sont requis"
      });
      return;
    }

    // Validation de la catégorie
    const validCategories = ['sorties', 'courses', 'essences', 'achats exceptionnels'];
    if (!validCategories.includes(category)) {
      response.status(400).json({
        success: false,
        message: `La catégorie doit être: ${validCategories.join(', ')}`
      });
      return;
    }

    const result = await query(
      'INSERT INTO expenses (amount, place, expense_date, category, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [amount, place, expense_date, category]
    );

    response.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error("Error creating expense", error);
    response.status(500).json({
      success: false,
      message: "Error creating expense",
      error: error.message
    });
  }
});

// Exemple: Supprimer une dépense
exports.deleteExpense = onRequest(async (request, response) => {
  response.set('Access-Control-Allow-Origin', '*');

  if (request.method === 'OPTIONS') {
    response.set('Access-Control-Allow-Methods', 'DELETE');
    response.set('Access-Control-Allow-Headers', 'Content-Type');
    response.status(204).send('');
    return;
  }

  if (request.method !== 'DELETE') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const expenseId = request.query.id || request.body.id;

    if (!expenseId) {
      response.status(400).json({
        success: false,
        message: "Expense ID is required"
      });
      return;
    }

    const result = await query(
      'DELETE FROM expenses WHERE id = $1 RETURNING *',
      [expenseId]
    );

    if (result.rowCount === 0) {
      response.status(404).json({
        success: false,
        message: "Expense not found"
      });
      return;
    }

    response.json({
      success: true,
      message: "Expense deleted successfully",
      data: result.rows[0]
    });
  } catch (error) {
    logger.error("Error deleting expense", error);
    response.status(500).json({
      success: false,
      message: "Error deleting expense",
      error: error.message
    });
  }
});


