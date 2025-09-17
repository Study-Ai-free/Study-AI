import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';

// Import types
import { ApiResponse } from './types';

// Configure environment variables
dotenv.config();

// Import routes (CommonJS style for now)
const authRoutes = require('./routes/auth'); // This has the actual login/register routes
const uploadRoutes = require('./routes/upload');
const quizRoutes = require('./routes/quiz');
const analyticsRoutes = require('./routes/analytics');
// Temporarily disabled cloud routes until credentials are configured
// const oneDriveRoutes = require('./routes/onedrive');
// const googleDriveRoutes = require('./routes/googledrive');
// const cloudRoutes = require('./routes/cloud');

// Import middleware and utilities
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app: Application = express();
const PORT: number = parseInt(process.env['PORT'] || '3001', 10);

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
const corsOptions: cors.CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Production allowed origins for Study-AI.io
    const allowedOrigins: (string | RegExp)[] = [
      'https://study-ai.io',
      'https://www.study-ai.io',
      'http://study-ai.io',
      'http://www.study-ai.io',
      process.env['FRONTEND_URL'] || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://10.5.182.25:3000',
      'http://10.5.182.25:3001',
      // Localtunnel and ngrok domains
      /.*\.loca\.lt$/,
      /.*\.ngrok\.io$/,
      /.*\.ngrok-free\.app$/,
    ];

    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else {
        return allowedOrigin.test(origin);
      }
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (_req: Request, res: Response<ApiResponse<{ status: string; timestamp: string; version: string }>>) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

// Backend dashboard endpoint (HTML)
app.get('/dashboard', (_req: Request, res: Response) => {
  const templateRenderer = require('./utils/templateRenderer').default;
  const html = templateRenderer.renderDashboard(
    PORT, 
    process.env['FRONTEND_URL'] || 'http://localhost:3000'
  );
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
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

// 404 Handler
app.use('*', (_req: Request, res: Response<ApiResponse>) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: 'The requested endpoint does not exist'
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Study AI Backend running on 0.0.0.0:${PORT}`);
  logger.info(`🌐 Production domain: https://study-ai.io`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔗 Public access: Backend configured for global internet access`);
  logger.info(`🔗 Domain configured for: study-ai.io`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;