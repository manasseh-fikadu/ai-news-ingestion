const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const newsRoutes = require('./routes/news');
const logger = require('./utils/logger');
const { connectMongo } = require('./db/mongo');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/news', newsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'SWEN AI News Pipeline'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SWEN AI-Enriched News Pipeline',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      news: '/api/v1/news'
    },
    documentation: 'https://github.com/swen/ai-news-ingestion'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
(async () => {
  try {
    await connectMongo();
    
    // Only start HTTP server if not in Vercel production
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      app.listen(PORT, () => {
        logger.info(`🚀 SWEN AI News Pipeline running on port ${PORT}`);
        logger.info(`📡 Health check: http://localhost:${PORT}/health`);
        logger.info(`📰 News API: http://localhost:${PORT}/api/v1/news`);
      });
    } else {
      logger.info('🚀 SWEN AI News Pipeline ready for Vercel serverless functions');
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
})();

module.exports = app;
