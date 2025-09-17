const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth'); // This has the actual login/register routes
const uploadRoutes = require('./routes/upload');
const quizRoutes = require('./routes/quiz');
const analyticsRoutes = require('./routes/analytics');
// Temporarily disabled cloud routes until credentials are configured
// const oneDriveRoutes = require('./routes/onedrive');
// const googleDriveRoutes = require('./routes/googledrive');
// const cloudRoutes = require('./routes/cloud');

const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https:"],
    },
  },
}));

// CORS configuration for Study-AI.io domain
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Production allowed origins for Study-AI.io
    const allowedOrigins = [
      'https://study-ai.io',
      'https://www.study-ai.io',
      'http://study-ai.io',
      'http://www.study-ai.io',
      process.env.FRONTEND_URL,
      process.env.DOMAIN_URL,
      // Development origins
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://10.5.182.25:3000'
    ].filter(Boolean);
    
    // In development mode, be more permissive
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // For Study-AI.io public access, allow all origins
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploaded content
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes); // Changed to use the correct auth routes
app.use('/api/upload', uploadRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/analytics', analyticsRoutes);
// Temporarily disabled cloud routes until credentials are configured
// app.use('/api/onedrive', oneDriveRoutes);
// app.use('/api/googledrive', googleDriveRoutes);
// app.use('/api/cloud', cloudRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Global error handler
app.use(errorHandler);

// Start server
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for public access
const DOMAIN = process.env.DOMAIN_URL || 'study-ai.io';

app.listen(PORT, HOST, () => {
  logger.info(`🚀 Study AI Backend running on ${HOST}:${PORT}`);
  logger.info(`🌐 Production domain: https://${DOMAIN}`);
  logger.info(`📊 Health check: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/health`);
  logger.info(`� Public access: Backend configured for global internet access`);
  logger.info(`🔗 Domain configured for: ${DOMAIN}`);
});

module.exports = app;