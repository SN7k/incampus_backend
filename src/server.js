const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Force production mode
if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
  console.log('Forcing NODE_ENV to production mode');
  process.env.NODE_ENV = 'production';
}

// Log environment information
console.log('Environment Mode:', process.env.NODE_ENV);
console.log('JWT_SECRET configured:', !!process.env.JWT_SECRET);
console.log('EMAIL configuration:', {
  EMAIL_USER_configured: !!process.env.EMAIL_USER,
  EMAIL_PASSWORD_configured: !!process.env.EMAIL_PASSWORD
});

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Define routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/friends', require('./routes/friendRoutes'));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to InCampus API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
