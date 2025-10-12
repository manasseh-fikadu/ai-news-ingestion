const express = require('express');
const Joi = require('joi');
const newsService = require('../services/newsService');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const newsIngestionSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  body: Joi.string().min(200).max(10000).required(),
  source_url: Joi.string().uri().required(),
  publisher: Joi.string().min(2).max(100).required(),
  published_at: Joi.string().isoDate().required()
});

// POST /api/v1/news/ingest - Ingest and process news article
router.post('/ingest', async (req, res) => {
  try {
    // Validate input
    const { error, value } = newsIngestionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    // Process the news article
    const enrichedNews = await newsService.processNewsArticle(value);

    res.status(201).json({
      message: 'News article processed successfully',
      id: enrichedNews.id,
      data: enrichedNews
    });

  } catch (error) {
    logger.error('Error in news ingestion:', error);
    res.status(500).json({
      error: 'Failed to process news article',
      message: error.message
    });
  }
});

// GET /api/v1/news/{id} - Get specific news article
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        error: 'News ID is required'
      });
    }

    const news = await newsService.getNewsById(id);
    res.json(news);

  } catch (error) {
    if (error.message === 'News article not found') {
      return res.status(404).json({
        error: 'News article not found',
        message: 'The requested news article does not exist'
      });
    }

    logger.error('Error fetching news article:', error);
    res.status(500).json({
      error: 'Failed to fetch news article',
      message: error.message
    });
  }
});

// GET /api/v1/news - Get all news articles
router.get('/', async (req, res) => {
  try {
    const allNews = await newsService.getAllNews();
    res.json({
      count: allNews.length,
      articles: allNews
    });
  } catch (error) {
    logger.error('Error fetching all news:', error);
    res.status(500).json({
      error: 'Failed to fetch news articles',
      message: error.message
    });
  }
});

// POST /api/v1/news/seed - Seed sample data for demo
router.post('/seed', async (req, res) => {
  try {
    const sampleNews = await newsService.seedSampleData();
    res.json({
      message: 'Sample data seeded successfully',
      data: sampleNews
    });
  } catch (error) {
    logger.error('Error seeding sample data:', error);
    res.status(500).json({
      error: 'Failed to seed sample data',
      message: error.message
    });
  }
});

module.exports = router;
