const mongoose = require('mongoose');
const logger = require('../utils/logger');

let hasTriedConnecting = false;

async function connectMongo() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    logger.warn('MONGODB_URI not set. Skipping MongoDB connection and using file-based storage.');
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    return true; // already connected
  }

  if (hasTriedConnecting && mongoose.connection.readyState === 2) {
    return false; // connection in progress
  }

  try {
    hasTriedConnecting = true;
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB || 'swen_news',
      autoIndex: true,
    });
    logger.info('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = {
  connectMongo,
  isMongoConnected
};
