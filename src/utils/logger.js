const winston = require('winston');
const fs = require('fs');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'swen-ai-news-pipeline' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Helper to safely create log dir
const ensureLogDir = () => {
  const logDir = process.env.NODE_ENV === 'production' ? '/tmp/logs' : './logs';
  if (!fs.existsSync(logDir)) {
    try {
      fs.mkdirSync(logDir, { recursive: true });
    } catch (err) {
      console.warn(`Could not create log directory ${logDir}: ${err.message}. Falling back to console only.`);
      return false;
    }
  }
  return true;
};

// Add file transports only if dir exists/created and in production
if (process.env.NODE_ENV === 'production') {
  const dirOk = ensureLogDir();
  if (dirOk) {
    logger.add(new winston.transports.File({ 
      filename: path.join('/tmp/logs', 'error.log'),  // Use /tmp in prod
      level: 'error' 
    }));
    logger.add(new winston.transports.File({ 
      filename: path.join('/tmp/logs', 'combined.log') 
    }));
  }
} else {
  // Local dev: always try file transports
  const dirOk = ensureLogDir();
  if (dirOk) {
    logger.add(new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }));
    logger.add(new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }));
  }
}

module.exports = logger;
