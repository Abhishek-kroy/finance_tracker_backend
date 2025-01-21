const express = require('express');
const { registerUser, loginUser } = require('../controllers/userController');
const {createBudget, monthBudget, rangeBudget} = require('../controllers/budgetController');
const {addExpense, getExpensesForUserBudget, getExpensesGroupedByDateAndBudget} = require('../controllers/expenseTracking')
const { authenticateUser } = require('../middlewares/authenticateUser');
const router = express.Router();

// POST /api/users/register - Register a new user
router.post('/register', registerUser);

// POST /api/users/login - Login user
router.post('/login', loginUser);

router.post('/create', authenticateUser, createBudget);
router.get('/budgets/current-month', authenticateUser, monthBudget);
router.get('/budgets/range', authenticateUser, rangeBudget);

router.post('/addexpense',authenticateUser, addExpense);
router.get('/getexpense',authenticateUser, getExpensesForUserBudget);
router.get('/getexpensedatebudget',authenticateUser, getExpensesGroupedByDateAndBudget);

module.exports = router;