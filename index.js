const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const connectDB = require('./config/database');
const routes = require('./routes/routes');
const cors = require('cors')
const app = express();

// const allowedOrigins = ['*'];
// const corsOptions = {
//     origin: function (origin, callback) {
//       // Allow requests from the allowed origins
//       if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
//         callback(null, true); // Allow the request
//       } else {
//         callback(new Error('Not allowed by CORS')); // Reject the request
//       }
//     },
//     methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
//     allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
//   };

const corsOptions = {
  origin: '*', // Allow any origin for testing/development purposes
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
};
// Enable CORS with the defined options
app.use(cors(corsOptions));

// Middleware
app.use(bodyParser.json());
app.use(express.json());

// Connect to MongoDB
(async () => {
  const db = await connectDB();
})();

// Routes
app.use('/api/v1', routes);

// Start the server
const PORT = process.env.PORT || 6000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));