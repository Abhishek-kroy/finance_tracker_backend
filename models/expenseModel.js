const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    budgetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true }, // Reference to the budget
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    description: { type: String },  // Optional: Notes or details about the expense
});

module.exports = mongoose.model('Expense', expenseSchema);