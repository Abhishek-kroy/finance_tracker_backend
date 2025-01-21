const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Make sure you replace 'your_db_name' with the actual database name
    const conn = await mongoose.connect('mongodb+srv://Abhishek:Abhishek2342005@cluster0.lugh5.mongodb.net/finance_tracker');
    console.log('MongoDB Connected:', conn.connection.host);
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1); // Exit the process with failure code
  }
};

module.exports = connectDB;