const axios = require('axios');
const logger = require('../utils/logger');

class MediaService {
  constructor() {
    this.pexelsKey = process.env.PEXELS_API_KEY;
    this.googleApiKey = process.env.GOOGLE_API_KEY;
  }

  async getFeaturedImage(title, tags = []) {
    try {
      // Try Pexels
      if (this.pexelsKey && this.pexelsKey !== 'your_pexels_key') {
        const pexelsImage = await this.getPexelsImage(title, tags);
        if (pexelsImage) return pexelsImage;
      }

      // Fallback to curated mock images
      return this.getMockImage(title, tags);
    } catch (error) {
      logger.error('Error fetching featured image:', error.message);
      return this.getMockImage(title, tags);
    }
  }

  async getPexelsImage(title, tags) {
    const query = this.extractSearchTerms(title, tags);
    const response = await axios.get(`https://api.pexels.com/v1/search`, {
      params: {
        query: query,
        per_page: 1,
        orientation: 'landscape'
      },
      headers: {
        'Authorization': this.pexelsKey
      },
      timeout: 10000
    });

    if (response.data.photos.length > 0) {
      return response.data.photos[0].src.large;
    }
    return null;
  }

  getMockImage(title, tags) {
    // Curated mock images based on content
    const mockImages = {
      'renewable': 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=600&fit=crop',
      'energy': 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&h=600&fit=crop',
      'africa': 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&h=600&fit=crop',
      'solar': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop',
      'wind': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop',
      'hydro': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      'default': 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=800&h=600&fit=crop'
    };

    const titleLower = title.toLowerCase();
    const tagsLower = tags.join(' ').toLowerCase();
    const searchText = `${titleLower} ${tagsLower}`;

    if (searchText.includes('renewable') || searchText.includes('solar') || searchText.includes('wind')) {
      return mockImages.renewable;
    }
    if (searchText.includes('energy') || searchText.includes('power')) {
      return mockImages.energy;
    }
    if (searchText.includes('africa') || searchText.includes('south africa')) {
      return mockImages.africa;
    }
    if (searchText.includes('solar')) {
      return mockImages.solar;
    }
    if (searchText.includes('wind')) {
      return mockImages.wind;
    }
    if (searchText.includes('hydro')) {
      return mockImages.hydro;
    }

    return mockImages.default;
  }

  async getRelatedVideo(title, tags = []) {
    try {
      // Try YouTube Data API using Google API key
      if (this.googleApiKey && this.googleApiKey !== 'your_google_api_key') {
        const youtubeVideo = await this.getYouTubeVideo(title, tags);
        if (youtubeVideo) return youtubeVideo;
      }

      // Fallback to mock video URLs
      return this.getMockVideo(title, tags);
    } catch (error) {
      logger.error('Error fetching related video:', error.message);
      return this.getMockVideo(title, tags);
    }
  }

  async getYouTubeVideo(title, tags) {
    try {
      const query = this.extractSearchTerms(title, tags, true);
      const params = {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: 1,
        key: this.googleApiKey,
        safeSearch: 'moderate',
        order: 'relevance',
        regionCode: 'ZA',
        relevanceLanguage: 'en'
      };
      logger.info('YouTube API search query:', { q: query, regionCode: params.regionCode });
      
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', { params, timeout: 10000 });

      if (response.data && response.data.items && response.data.items.length > 0) {
        const video = response.data.items[0];
        const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;
        logger.info('YouTube video found:', videoUrl);
        return videoUrl;
      }
      logger.warn('No YouTube videos found for query:', { q: query });
      // Fallback to Piped (no API key) to try find a video
      const piped = await this.getPipedVideo(query);
      if (piped) return piped;
      return null;
    } catch (error) {
      logger.error('YouTube API error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      // Fallback to Piped (no API key) if YouTube failed
      try {
        const query = this.extractSearchTerms(title, tags, true);
        const piped = await this.getPipedVideo(query);
        if (piped) return piped;
      } catch (_) {}
      return null;
    }
  }

  async getPipedVideo(query) {
    try {
      // Use piped.video public API to search YouTube without a key
      const resp = await axios.get('https://piped.video/api/v1/search', {
        params: { q: query, region: 'ZA' },
        timeout: 10000,
        headers: { 'User-Agent': 'SWENNewsBot/1.0' }
      });
      const items = Array.isArray(resp.data?.items) ? resp.data.items : resp.data;
      if (items && items.length > 0) {
        const first = items.find(i => (i.type === 'video' || i.id || i.url));
        if (first) {
          const videoId = first.id || (first.url?.split('v=')[1]) || first.url?.replace('/watch/', '');
          if (videoId) {
            const url = `https://www.youtube.com/watch?v=${videoId}`;
            logger.info('Piped fallback video found:', url);
            return url;
          }
          if (first.url) return first.url;
        }
      }
      return null;
    } catch (e) {
      logger.warn('Piped search fallback failed:', e.message);
      return null;
    }
  }

  getMockVideo(title, tags) {
    // Curated mock videos based on content
    const mockVideos = {
      'renewable': 'https://www.youtube.com/watch?v=U3AZQJz--mg',
      'energy': 'https://www.youtube.com/watch?v=U3AZQJz--mg',
      'africa': 'https://www.youtube.com/watch?v=U3AZQJz--mg',
      'solar': 'https://www.youtube.com/watch?v=U3AZQJz--mg',
      'wind': 'https://www.youtube.com/watch?v=U3AZQJz--mg',
      'default': 'https://www.youtube.com/watch?v=U3AZQJz--mg'
    };

    const titleLower = title.toLowerCase();
    const tagsLower = tags.join(' ').toLowerCase();
    const searchText = `${titleLower} ${tagsLower}`;

    if (searchText.includes('renewable') || searchText.includes('solar') || searchText.includes('wind')) {
      return mockVideos.renewable;
    }
    if (searchText.includes('energy') || searchText.includes('power')) {
      return mockVideos.energy;
    }
    if (searchText.includes('africa') || searchText.includes('south africa')) {
      return mockVideos.africa;
    }

    return mockVideos.default;
  }

  extractSearchTerms(title, tags, is_video=false) {
    // Extract relevant search terms from title and tags
    const titleWords = title.toLowerCase().split(' ').filter(word => 
      word.length > 3 && !['the', 'and', 'for', 'with', 'from', 'this', 'that'].includes(word)
    );
    
    const tagWords = tags.map(tag => tag.replace('#', '').toLowerCase());
    const words = [...new Set([...titleWords, ...tagWords])];
    const boosted = words.join(' ');
    return boosted.trim() || title;
  }
}

module.exports = new MediaService();
