const axios = require('axios');
const logger = require('../utils/logger');

class QwenService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.model = 'qwen/qwen3-vl-30b-a3b-thinking'; // Using Qwen 2.5 7B via OpenRouter
  }

  async generateContent(prompt, maxTokens = 1000) {
    try {
      // If no API key, return mock response for demo
      if (!this.apiKey || this.apiKey === 'your_openrouter_api_key_here') {
        logger.warn('OpenRouter API key not configured, using mock response');
        return this.getMockResponse(prompt);
      }

      // Use OpenRouter API endpoint
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
          top_p: 0.8
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-Title': 'SWEN AI News Pipeline'
          },
          timeout: 60000,
          validateStatus: function (status) {
            return status >= 200 && status < 300;
          }
        }
      );

      if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        return response.data.choices[0].message.content;
      } else {
        logger.warn('Unexpected response format from OpenRouter API, using mock response');
        return this.getMockResponse(prompt);
      }
    } catch (error) {
      const status = error.response?.status;
      const level = status === 401 || status === 403 ? 'warn' : 'error';
      logger[level]('OpenRouter API error:', {
        message: error.message,
        status,
        statusText: error.response?.statusText
      });
      // Fallback to mock response
      return this.getMockResponse(prompt);
    }
  }

  getMockResponse(prompt) {
    // Smart mock responses based on prompt content and article context
    const title = prompt.match(/Title:\s*(.+?)(?:\n|Content:)/)?.[1] || '';
    const content = prompt.match(/Content:\s*(.+?)(?:\n|Summary:|Tags:|Relevance Score:|Justification:|Wikipedia Snippet:)/)?.[1] || '';
    const text = `${title} ${content}`.toLowerCase();
    
    if (prompt.includes('summary')) {
      // Generate context-aware summary based on content
      if (text.includes('china') && text.includes('trade')) {
        return "This article discusses escalating trade tensions between China and the US, focusing on rare earth export controls and their impact on global supply chains and bilateral relations.";
      }
      if (text.includes('renewable') || text.includes('solar') || text.includes('energy')) {
        return "This article discusses significant developments in renewable energy infrastructure across Southern Africa, highlighting key investments and policy changes that will impact the region's energy transition.";
      }
      if (text.includes('africa') || text.includes('south africa')) {
        return "This article covers important developments affecting African economies and societies, with potential regional and continental implications.";
      }
      return "This article discusses current events and developments with potential impact on global markets and international relations.";
    }
    
    if (prompt.includes('tags')) {
      // Generate context-aware tags based on content
      if (text.includes('china') && text.includes('trade')) {
        return '["#China", "#TradeWar", "#RareEarths", "#USChina", "#Geopolitics"]';
      }
      if (text.includes('renewable') || text.includes('solar') || text.includes('energy')) {
        return '["#RenewableEnergy", "#SouthAfrica", "#GreenTransition", "#Infrastructure", "#Sustainability"]';
      }
      if (text.includes('africa') || text.includes('south africa')) {
        return '["#Africa", "#Development", "#Economy", "#Policy", "#News"]';
      }
      return '["#News", "#Global", "#Politics", "#Economy", "#International"]';
    }
    
    if (prompt.includes('relevance')) {
      // Calculate relevance based on African context
      if (text.includes('africa') || text.includes('south africa')) {
        return '0.85';
      }
      if (text.includes('china') && text.includes('trade')) {
        return '0.65'; // Trade wars affect global markets including Africa
      }
      return '0.70';
    }
    
    if (prompt.includes('justification')) {
      if (text.includes('china') && text.includes('trade')) {
        return "Selected this media because it visually represents international trade and geopolitical tensions, showing economic and political elements that align with the article's focus on US-China trade relations.";
      }
      if (text.includes('renewable') || text.includes('solar') || text.includes('energy')) {
        return "Selected this image because it visually represents renewable energy infrastructure in Africa, showing solar panels and wind turbines that align with the article's focus on green energy transition.";
      }
      return "Selected this media because it visually represents the article's main themes and provides relevant context for readers.";
    }
    
    if (prompt.includes('wikipedia')) {
      if (text.includes('china') && text.includes('trade')) {
        return "China-US trade relations refer to the complex economic relationship between the world's two largest economies, involving trade agreements, tariffs, and strategic competition.";
      }
      if (text.includes('renewable') || text.includes('solar') || text.includes('energy')) {
        return "Renewable energy in Africa refers to the deployment of clean energy technologies across the continent, with significant potential for solar, wind, and hydroelectric power generation.";
      }
      if (text.includes('africa') || text.includes('south africa')) {
        return "Africa is the world's second-largest continent, home to 54 countries and over 1.3 billion people with diverse cultures, economies, and natural resources.";
      }
      return "This topic relates to current global developments and their broader implications for international relations and economic systems.";
    }
    
    return "AI-generated content based on the article's context and themes.";
  }

  async generateSummary(title, body) {
    const prompt = `Generate a concise 1-2 sentence factual summary of this news article. Focus on the key facts and main point:

Title: ${title}
Content: ${body.substring(0, 500)}...

Summary:`;
    
    return await this.generateContent(prompt, 200);
  }

  async generateTags(title, body) {
    const prompt = `Generate 3-5 relevant hashtags for this news article. Focus on topics, locations, and themes. Return as JSON array:

Title: ${title}
Content: ${body.substring(0, 500)}...

Tags:`;
    
    const response = await this.generateContent(prompt, 150);
    try {
      return JSON.parse(response);
    } catch {
      return ['#News', '#Africa', '#Development'];
    }
  }

  async calculateRelevanceScore(title, body) {
    const prompt = `Rate the relevance of this news article to African audiences on a scale of 0.0 to 1.0. Consider:
- African countries mentioned
- Impact on African economies/societies
- Local relevance and context
- Regional significance

Title: ${title}
Content: ${body.substring(0, 500)}...

Relevance Score (0.0-1.0):`;
    
    const response = await this.generateContent(prompt, 50);
    const score = parseFloat(response);
    return isNaN(score) ? 0.7 : Math.max(0, Math.min(1, score));
  }

  async generateMediaJustification(title, body, mediaType) {
    const prompt = `Explain why this ${mediaType} is relevant to this news article. Be specific about visual or contextual connections:

Title: ${title}
Content: ${body.substring(0, 300)}...

Justification:`;
    
    return await this.generateContent(prompt, 200);
  }

  async generateWikipediaSnippet(topic) {
    const prompt = `Provide a 1-2 sentence factual explanation about "${topic}" suitable for a Wikipedia-style snippet. Focus on key facts and definitions:

Wikipedia Snippet:`;
    
    return await this.generateContent(prompt, 150);
  }
}

module.exports = new QwenService();
