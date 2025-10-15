const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  featured_image_url: { type: String },
  related_video_url: { type: String },
  media_justification: { type: String }
}, { _id: false });

const GeoSchema = new mongoose.Schema({
  lat: { type: Number },
  lng: { type: Number },
  map_url: { type: String },
  formatted_address: { type: String }
}, { _id: false });

const ContextSchema = new mongoose.Schema({
  wikipedia_snippet: { type: String },
  social_sentiment: { type: String },
  search_trend: { type: String },
  geo: { type: GeoSchema }
}, { _id: false });

const NewsSchema = new mongoose.Schema({
  id: { type: String, index: true, unique: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  summary: { type: String },
  tags: { type: [String], default: [] },
  relevance_score: { type: Number, default: 0.0 },
  source_url: { type: String },
  publisher: { type: String },
  published_at: { type: Date },
  ingested_at: { type: Date },
  media: { type: MediaSchema },
  context: { type: ContextSchema }
}, { timestamps: true });

module.exports = mongoose.model('News', NewsSchema);
