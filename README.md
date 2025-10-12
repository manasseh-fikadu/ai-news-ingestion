# 🧠 SWEN AI-Enriched News Pipeline

**From plain text → intelligent, media-rich news experiences**

A comprehensive AI-powered news processing pipeline that transforms raw text articles into enriched, multimedia news experiences using Qwen LLM and contextual intelligence.

## 🎯 Overview

This implementation fulfills SWEN's AI tech test requirements by creating a working slice of the Ingestion → AI Transformation → Storage → API flow. The pipeline accepts text-only news input from SWEN-defined sources and produces media-rich, contextually enhanced news objects.

## 🚀 Live Prototype

**🔗 Live API Endpoint:** https://ai-news-ingestion.vercel.app/api/v1/news/5772cc7a-8846-4c47-8c87-7548b4498823

## 🏗️ Architecture

### Core Components

1. **News Ingestion Service** - Accepts text-only input from SWEN sources
2. **Qwen LLM Integration** - AI-powered content enrichment
3. **Media Enrichment** - Real image/video URL selection with justification
4. **Contextual Intelligence** - Wikipedia, sentiment, trends, geo data
5. **RESTful API** - Clean JSON responses with full enriched data

### Data Flow

```
Raw News Text → Qwen AI Processing → Media Enrichment → Contextual Intelligence → Enriched JSON
```

## 📋 Features

### ✅ SWEN Requirements Fulfilled

- **✅ Text-only news ingestion** from SWEN-defined sources
- **✅ Qwen LLM integration** for AI enrichment
- **✅ Real image/video URLs** with copyright-safe content
- **✅ Complete JSON structure** matching SWEN specifications
- **✅ Public API endpoint** with clean JSON responses
- **✅ Infrastructure-as-Code** for AWS and Alibaba Cloud
- **✅ Working prototype** with live URL

### 🤖 AI-Powered Enrichment

- **Summary Generation** - 1-2 sentence factual distillation
- **Smart Tagging** - 3-5 relevant hashtags
- **Relevance Scoring** - African audience relevance (0.0-1.0)
- **Media Justification** - AI-generated rationale for image/video selection
- **Wikipedia Integration** - Contextual topic information
- **Social Sentiment** - Mock sentiment analysis
- **Search Trends** - Trending topic analysis
- **Geo Context** - Location data with map integration

## 🛠️ Technology Stack

- **Backend:** Node.js + Express
- **AI/LLM:** Qwen via OpenRouter
- **Media:** Pexels API, YouTube Data API
- **Context:** Wikipedia API, Google Natural Language API, Google Geocoding API
- **Infrastructure:** Terraform, Docker
- **Deployment:** Vercel, AWS EKS, Alibaba Cloud ACK

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker (optional)
- Terraform (for IaC)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/swen/ai-news-ingestion.git
   cd ai-news-ingestion
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Seed sample data**
   ```bash
   curl -X POST http://localhost:3000/api/v1/news/seed
   ```

6. **Test the API**
   ```bash
   curl http://localhost:3000/api/v1/news/{id}
   ```

### Docker Deployment

1. **Build the image**
   ```bash
   docker build -t swen-ai-news-pipeline .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 --env-file .env swen-ai-news-pipeline
   ```

## 🌐 API Endpoints

### News Ingestion
```http
POST /api/v1/news/ingest
Content-Type: application/json

{
  "title": "South Africa Announces Major Renewable Energy Investment",
  "body": "The South African government has unveiled a comprehensive renewable energy investment strategy...",
  "source_url": "https://example-news.com/sa-renewable-energy",
  "publisher": "African Energy News",
  "published_at": "2024-01-15T10:30:00Z"
}
```

### Get Enriched News
```http
GET /api/v1/news/{id}
```

**Response:**
```json
{
  "id": "uuid-here",
  "title": "South Africa Announces Major Renewable Energy Investment",
  "body": "The South African government has unveiled...",
  "summary": "South Africa unveils $15B renewable energy plan focusing on solar and wind projects...",
  "tags": ["#RenewableEnergy", "#SouthAfrica", "#GreenTransition"],
  "relevance_score": 0.85,
  "source_url": "https://example-news.com/sa-renewable-energy",
  "publisher": "African Energy News",
  "published_at": "2024-01-15T10:30:00Z",
  "ingested_at": "2024-01-15T12:45:00Z",
  "media": {
    "featured_image_url": "https://images.unsplash.com/photo-1466611653911-95081537e5b7",
    "related_video_url": "https://www.youtube.com/watch?v=U3AZQJz--mg",
    "media_justification": "Selected this image because it visually represents renewable energy infrastructure..."
  },
  "context": {
    "wikipedia_snippet": "Renewable energy is energy from sources that are naturally replenishing...",
    "social_sentiment": "74% positive mentions on X in last 24h",
    "search_trend": "'SA renewables' +150% this week",
    "geo": {
      "lat": -25.7479,
      "lng": 28.2293,
      "map_url": "https://www.openstreetmap.org/?mlat=-25.7479&mlon=28.2293&zoom=10"
    }
  }
}
```

### Health Check
```http
GET /health
```

## 🏗️ Infrastructure as Code

### Terraform Deployment

The project includes comprehensive Terraform configurations supporting both AWS and Alibaba Cloud:

```bash
# Initialize Terraform
cd terraform
terraform init

# Plan deployment
terraform plan -var="cloud_provider=aws" -var="environment=dev"

# Apply configuration
terraform apply -var="cloud_provider=aws" -var="environment=dev"
```
