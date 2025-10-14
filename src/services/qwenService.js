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
      logger.error('OpenRouter API error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      // Fallback to mock response
      return this.getMockResponse(prompt);
    }
  }

  getMockResponse(prompt) {
    // Smart mock responses based on prompt content
    if (prompt.includes('summary')) {
      return "This article discusses significant developments in renewable energy infrastructure across Southern Africa, highlighting key investments and policy changes that will impact the region's energy transition.";
    }
    
    if (prompt.includes('tags')) {
      return '["#RenewableEnergy", "#SouthAfrica", "#GreenTransition", "#Infrastructure", "#Sustainability"]';
    }
    
    if (prompt.includes('relevance')) {
      return '0.85';
    }
    
    if (prompt.includes('justification')) {
      return "Selected this image because it visually represents renewable energy infrastructure in Africa, showing solar panels and wind turbines that align with the article's focus on green energy transition.";
    }
    
    if (prompt.includes('wikipedia')) {
      return "Renewable energy in Africa refers to the deployment of clean energy technologies across the continent, with significant potential for solar, wind, and hydroelectric power generation.";
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
