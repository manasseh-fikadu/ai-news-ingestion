const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const qwenService = require('./qwenService');
const mediaService = require('./mediaService');
const contextService = require('./contextService');
const logger = require('../utils/logger');
const { isMongoConnected } = require('../db/mongo');
let NewsModel; // lazy require to avoid circular issues during tests

class NewsService {
  constructor() {
    this.newsStore = new Map(); // In-memory store for demo
    this.storageFile = this.getStoragePath();
    this.initStorage();
  }

  getStoragePath() {
    // Env-aware path: writable in both local and Vercel
    const baseDir = process.env.NODE_ENV === 'production' 
      ? '/tmp/data' 
      : './data';
    const filePath = path.join(baseDir, 'news.json');
    logger.debug(`Using storage path: ${filePath}`);
    return filePath;
  }

  async initStorage() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.storageFile);
      await fs.mkdir(dataDir, { recursive: true });
      
      // Load existing data
      await this.loadFromStorage();
    } catch (error) {
      logger.warn('Could not initialize storage (falling back to in-memory):', error.message);
      this.newsStore.clear(); // Start fresh in-memory
    }
  }

  async loadFromStorage() {
    try {
      const data = await fs.readFile(this.storageFile, 'utf8');
      const newsData = JSON.parse(data);
      
      // Load into memory store
      this.newsStore.clear();
      for (const [id, news] of Object.entries(newsData)) {
        this.newsStore.set(id, news);
      }
      
      logger.info(`Loaded ${this.newsStore.size} news articles from storage`);
    } catch (error) {
      logger.info('No existing storage file found, starting fresh');
      // Don't throw—graceful fallback
    }
  }

  async saveToStorage() {
    try {
      const newsData = Object.fromEntries(this.newsStore);
      await fs.writeFile(this.storageFile, JSON.stringify(newsData, null, 2));
      logger.debug('Saved news data to storage');
    } catch (error) {
      logger.warn('Failed to save to storage (continuing with in-memory):', error.message);
      // Don't throw—keep running
    }
  }

  async processNewsArticle(newsData) {
    try {
      logger.info('Processing news article:', newsData.title);

      // Generate AI-enriched content
      const [summary, tags, relevanceScore] = await Promise.all([
        qwenService.generateSummary(newsData.title, newsData.body),
        qwenService.generateTags(newsData.title, newsData.body),
        qwenService.calculateRelevanceScore(newsData.title, newsData.body)
      ]);

      // Get media content
      const [featuredImageUrl, relatedVideoUrl] = await Promise.all([
        mediaService.getFeaturedImage(newsData.title, tags),
        mediaService.getRelatedVideo(newsData.title, tags)
      ]);

      // Generate media justification
      const mediaJustification = await qwenService.generateMediaJustification(
        newsData.title, 
        newsData.body, 
        'image and video'
      );

      // Get contextual information
      const [wikipediaSnippet, socialSentiment, searchTrend, geoContext] = await Promise.all([
        contextService.getWikipediaSnippet(this.extractMainTopic(newsData.title, newsData.body)),
        contextService.getSocialSentiment(newsData.title, tags),
        contextService.getSearchTrend(newsData.title, tags),
        contextService.getGeoContext(newsData.title, newsData.body)
      ]);

      // Create enriched news object
      const enrichedNews = {
        id: uuidv4(),
        title: newsData.title,
        body: newsData.body,
        summary: summary.trim(),
        tags: Array.isArray(tags) ? tags : ['#News', '#Africa'],
        relevance_score: parseFloat(relevanceScore) || 0.7,
        source_url: newsData.source_url,
        publisher: newsData.publisher,
        published_at: newsData.published_at,
        ingested_at: new Date().toISOString(),
        media: {
          featured_image_url: featuredImageUrl,
          related_video_url: relatedVideoUrl,
          media_justification: mediaJustification.trim()
        },
        context: {
          wikipedia_snippet: wikipediaSnippet,
          social_sentiment: socialSentiment,
          search_trend: searchTrend,
          geo: geoContext
        }
      };

      // Prefer MongoDB when available
      if (isMongoConnected()) {
        if (!NewsModel) {
          // Lazy import to avoid loading mongoose when not needed
          // eslint-disable-next-line global-require
          NewsModel = require('../db/models/News');
        }
        await NewsModel.findOneAndUpdate(
          { id: enrichedNews.id },
          enrichedNews,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } else {
        // Store the enriched news in file-based storage
        this.newsStore.set(enrichedNews.id, enrichedNews);
        await this.saveToStorage();
      }
      
      logger.info('Successfully processed news article:', enrichedNews.id);
      return enrichedNews;

    } catch (error) {
      logger.error('Error processing news article:', error);
      throw new Error('Failed to process news article');
    }
  }

  async getNewsById(id) {
    if (isMongoConnected()) {
      if (!NewsModel) {
        // eslint-disable-next-line global-require
        NewsModel = require('../db/models/News');
      }
      const doc = await NewsModel.findOne({ id }).lean();
      if (!doc) throw new Error('News article not found');
      return doc;
    }

    // Fallback: file-based
    await this.loadFromStorage();
    const news = this.newsStore.get(id);
    if (!news) throw new Error('News article not found');
    return news;
  }

  async getAllNews() {
    if (isMongoConnected()) {
      if (!NewsModel) {
        // eslint-disable-next-line global-require
        NewsModel = require('../db/models/News');
      }
      const docs = await NewsModel.find({}).sort({ createdAt: -1 }).lean();
      return docs;
    }

    // Fallback: file-based
    await this.loadFromStorage();
    return Array.from(this.newsStore.values());
  }

  extractMainTopic(title, body) {
    // Simple topic extraction for Wikipedia lookup
    const text = `${title} ${body}`.toLowerCase();
    
    const topics = [
      'renewable energy',
      'solar power',
      'wind energy',
      'south africa',
      'africa',
      'energy',
      'power',
      'electricity',
      'sustainability',
      'climate change'
    ];

    for (const topic of topics) {
      if (text.includes(topic)) {
        return topic;
      }
    }

    // Extract first meaningful word from title
    const titleWords = title.split(' ').filter(word => 
      word.length > 3 && !['the', 'and', 'for', 'with', 'from', 'this', 'that'].includes(word.toLowerCase())
    );

    return titleWords[0] || 'news';
  }

  // Seed with sample data for demo
  async seedSampleData() {
    const sampleNews = {
      title: "South Africa Embraces Solar and Battery Storage in Landmark Energy Shift",
      body: "The South African government has unveiled a comprehensive renewable energy investment strategy worth $15 billion over the next five years. The plan focuses on solar and wind power projects across the country, aiming to reduce carbon emissions by 40% and create over 50,000 jobs in the green energy sector. Key projects include the construction of solar farms in the Northern Cape and wind energy facilities along the Western Cape coastline. Energy Minister Gwede Mantashe announced that the initiative will prioritize local content and community participation, ensuring that benefits reach rural and underserved areas. The investment is expected to position South Africa as a leader in renewable energy on the African continent, with potential for exporting clean energy to neighboring countries. International partners including the World Bank and European Investment Bank have committed to supporting the initiative through low-interest loans and technical assistance.",
      source_url: "https://www.satorinews.com/articles/2024-12-27/south-africa-embraces-solar-and-battery-storage-in-landmark-energy-shift-533811",
      publisher: "African Energy News",
      published_at: new Date().toISOString()
    };

    try {
      const enrichedNews = await this.processNewsArticle(sampleNews);
      logger.info('Sample data seeded successfully');
      return enrichedNews;
    } catch (error) {
      logger.error('Failed to seed sample data:', error);
      return null;  // Graceful fail
    }
  }
}

module.exports = new NewsService();
