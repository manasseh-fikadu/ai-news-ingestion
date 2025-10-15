const mongoose = require('mongoose');
const logger = require('../utils/logger');

let cachedConnection = null;
let hasTriedConnecting = false;

async function connectMongo() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    logger.warn('MONGODB_URI not set. Skipping MongoDB connection and using file-based storage.');
    return false;
  }

  // Return cached connection if available and connected
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return true;
  }

  // If connection is in progress, wait or return false
  if (hasTriedConnecting && mongoose.connection.readyState === 2) {
    return false;
  }

  try {
    hasTriedConnecting = true;
    
    // For Vercel serverless functions, use connection pooling
    const options = {
      dbName: process.env.MONGODB_DB || 'swen_news',
      autoIndex: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false // Disable mongoose buffering
    };

    // In production (Vercel), reuse existing connection if available
    if (process.env.NODE_ENV === 'production' && mongoose.connection.readyState === 0) {
      // Fresh connection for production
      cachedConnection = await mongoose.connect(mongoUri, options);
    } else if (mongoose.connection.readyState === 0) {
      // Development connection
      cachedConnection = await mongoose.connect(mongoUri, options);
    }

    logger.info('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    logger.error('❌ MongoDB connection error:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    cachedConnection = null;
    return false;
  }
}

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

// Graceful shutdown for Vercel functions
async function closeMongoConnection() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    cachedConnection = null;
    logger.info('🔌 MongoDB connection closed');
  }
}

// Handle process termination
if (process.env.NODE_ENV === 'production') {
  process.on('SIGINT', closeMongoConnection);
  process.on('SIGTERM', closeMongoConnection);
}

module.exports = {
  connectMongo,
  isMongoConnected,
  closeMongoConnection
};
