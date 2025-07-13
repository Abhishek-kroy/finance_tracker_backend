const Budget = require('../models/budgetModel.js'); // Assuming a Budget model exists

// Controller to create a budget
const createBudget = async (req, res) => {
    try {
        const { name, amount, startDate, endDate, description } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!name || !amount || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        // Validate date range
        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ success: false, message: 'Start date cannot be later than the end date.' });
        }

        // Save budget to database
        const newBudget = await Budget.create({
            userId,
            name,
            amount,
            startDate,
            endDate,
            description: description || '', // Default to empty string if not provided
        });

        res.status(201).json({ success: true, message: 'Budget created successfully.', budget: newBudget });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
};

const monthBudget = async (req, res) => {
    try {
        const userId = req.user.userId;
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

        const budgets = await Budget.find({
            userId,
            startDate: { $lte: endOfMonth },
            endDate: { $gte: startOfMonth },
        });

        res.json({ success: true, budgets:budgets });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching budgets.' });
    }
};

const rangeBudget = async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        const userId = req.user.userId;

        const budgets = await Budget.find({
            userId,
            startDate: { $lte: new Date(endDate) },
            endDate: { $gte: new Date(startDate) },
        });


        console.log(budgets);

        res.json({ success: true, budgets:budgets });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching budgets.' });
    }
};




module.exports = { createBudget, monthBudget, rangeBudget };