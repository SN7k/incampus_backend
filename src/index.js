import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import postRoutes from './routes/postRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import rateLimit from 'express-rate-limit';
import userRoutes from './routes/userRoutes.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://incampus-frontend.onrender.com']
    : ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to Incampus API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user', userRoutes);

// Rate limiting middleware (100 requests per 15 minutes per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api', apiLimiter);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Error handler (should be last)
app.use(errorHandler); 
