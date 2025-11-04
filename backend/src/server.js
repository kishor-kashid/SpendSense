require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SpendSense API is running' });
});

// API Routes
const usersRoutes = require('./routes/users');
app.use('/users', usersRoutes);

const consentRoutes = require('./routes/consent');
app.use('/consent', consentRoutes);

// Initialize database (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  initializeDatabase()
    .then(() => {
      console.log('Database initialized successfully');
      
      // Start server
      app.listen(PORT, () => {
        console.log(`SpendSense backend server running on port ${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/health`);
      });
    })
    .catch((error) => {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    });
}

// Error handling middleware (must be last)
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;

