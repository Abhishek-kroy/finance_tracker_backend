const mongoose = require('mongoose');
const Budget = require('../models/budgetModel');
const Expense = require('../models/expenseModel');

const addExpense = async (req, res) => {
    const { budgetId, amountSpent, name, amount, date } = req.body;
    const userId = req.user.userId;

    try {
        // Convert amountSpent to an integer
        const amountSpentInt = parseInt(amountSpent);

        // Find the budget by its ID
        let budget = await Budget.findById(budgetId);

        // If the budget is not found, create a new one
        if (!budget) {
            // Get today's date (startDate)
            const startDate = new Date();
            startDate.setHours(0, 0, 0, 0); // Set to the start of the day

            // Get the end of the current month (endDate)
            const endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + 1);
            endDate.setDate(0); // Set to the last day of the current month
            endDate.setHours(23, 59, 59, 999); // Set to the end of the day

            // Create a new budget with the provided details and dynamic dates
            budget = new Budget({
                userId,
                name,
                amount, // The allocated amount for the new budget
                spentAmount: amountSpentInt, // Amount spent for the new budget
                startDate,
                endDate,
            });

            // Save the new budget
            await budget.save();
        } else {
            // Update the existing budget's spentAmount
            budget.spentAmount += amountSpentInt;

            // Save the updated budget
            await budget.save();
        }

        // Add the expense to the Expense collection
        const expense = new Expense({
            userId,
            budgetId: budget._id, // Use the ID of the created or updated budget
            amount: amountSpentInt,
            date: date || new Date(), // Use provided date or the current date
            description: name
        });

        // Save the new expense
        await expense.save();

        res.status(201).json({
            success: true,
            message: budget.isNew ? 'New budget created and expense added!' : 'Expense added to existing budget!',
            expense,
        });
    } catch (err) {
        console.error('Error adding expense:', err);
        res.status(500).json({
            success: false,
            message: 'Error adding expense',
            error: err.message,
        });
    }
};


const getExpensesForUserBudget = async (req, res) => {
    const { startDate, endDate } = req.query;
    const userId = req.user.userId;

    if (!startDate || !endDate) {
        return res.status(400).json({
            success: false,
            message: 'Please provide both startDate and endDate.',
        });
    }

    try {

        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);

        const expenses = await Expense.find({
            userId,
            date: { $gte: start, $lt: end },
        }).populate('budgetId', 'name');

        res.status(200).json({
            success: true,
            message: 'Expenses fetched successfully.',
            expenses: expenses,
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expenses.',
        });
    }
};

const getExpensesGroupedByDateAndBudget = async (userId) => {
    try {
        // Validate the userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID format");
        }

        const expenses = await Expense.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(userId) } }, // Match user ID
            {
                $group: {
                    _id: { budgetId: "$budgetId", date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } },
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }, // Count of expenses
                },
            },
            {
                $lookup: {
                    from: 'budgets',
                    localField: '_id.budgetId',
                    foreignField: '_id',
                    as: 'budgetInfo',
                },
            },
            { $unwind: { path: "$budgetInfo", preserveNullAndEmptyArrays: true } }, // Flatten budget details
            {
                $project: {
                    date: "$_id.date",
                    budgetName: "$budgetInfo.name",
                    totalAmount: 1,
                    count: 1,
                },
            },
        ]);

        return expenses;
    } catch (error) {
        console.error('Error aggregating expenses:', error);
        throw error;
    }
};

const getBudgetWithExpenses = async (req, res) => {
    try {
        // Check if user is authenticated and has a valid userId
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ error: 'Unauthorized access, user not logged in' });
        }

        const userId = req.user.userId; // Assuming you have user authentication and `req.user` contains the logged-in user's data

        // Perform aggregation to get budgets with their associated expenses
        const budgetsWithExpenses = await Budget.aggregate([
            {
                $match: { userId: new mongoose.Types.ObjectId(userId) } // Ensure 'new' is used correctly if needed
            },
            {
                $lookup: {
                    from: 'expenses', // Collection name for the Expense model
                    localField: '_id', // Field in the Budget model
                    foreignField: 'budgetId', // Field in the Expense model
                    as: 'expenses' // The resulting array of expenses
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    amount: 1,
                    spentAmount: 1,
                    startDate: 1,
                    endDate: 1,
                    expenses: 1
                }
            }
        ]);

        // If no budgets are found, return an appropriate message
        if (budgetsWithExpenses.length === 0) {
            return res.status(404).json({ message: 'No budgets found for the user' });
        }

        // Return the budgets along with their expenses
        // console.log(budgetsWithExpenses);
        return res.status(200).json({
            message: 'Budgets fetched successfully',
            budgets: budgetsWithExpenses,
        });
    } catch (error) {
        console.error('Error fetching budgets with expenses:', error);

        // Send a detailed error message to the client
        return res.status(500).json({ error: 'Failed to fetch data due to internal server error' });
    }
};



module.exports = { addExpense, getExpensesForUserBudget, getExpensesGroupedByDateAndBudget, getBudgetWithExpenses };