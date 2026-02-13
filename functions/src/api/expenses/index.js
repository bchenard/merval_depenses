const getHandlers = require('./handlers/get');
const { createExpense } = require('./handlers/create');
const { updateExpense } = require('./handlers/update');
const { deleteExpense } = require('./handlers/delete');

module.exports = {
  getExpenses: getHandlers.getExpenses,
  getMonthlyEstimate: getHandlers.getMonthlyEstimate,
  createExpense,
  updateExpense,
  deleteExpense,
};

