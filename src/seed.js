// Seed script for SWEN AI News Pipeline
// Run this to populate the system with sample data

require('dotenv').config();
const newsService = require('./services/newsService');
const logger = require('./utils/logger');

async function seedData() {
  try {
    logger.info('🌱 Starting data seeding...');
    
    const sampleNews = await newsService.seedSampleData();
    
    if (sampleNews) {
      logger.info('✅ Sample data seeded successfully!');
      logger.info(`📰 News ID: ${sampleNews.id}`);
      logger.info(`🔗 API URL: http://localhost:3000/api/v1/news/${sampleNews.id}`);
      logger.info(`📊 Health Check: http://localhost:3000/health`);
      
      console.log('\n🎉 Seeding Complete!');
      console.log('='.repeat(50));
      console.log(`📰 Sample News ID: ${sampleNews.id}`);
      console.log(`🔗 Test URL: http://localhost:3000/api/v1/news/${sampleNews.id}`);
      console.log(`📊 Health Check: http://localhost:3000/health`);
      console.log('='.repeat(50));
    } else {
      logger.error('❌ Failed to seed sample data');
      process.exit(1);
    }
    
  } catch (error) {
    logger.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;
