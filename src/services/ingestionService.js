const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const { URL } = require('url');
const logger = require('../utils/logger');

const rssParser = new Parser({ timeout: 15000 });

function extractDomain(inputUrl) {
  try {
    const { hostname } = new URL(inputUrl);
    return hostname.replace('www.', '');
  } catch {
    return 'Unknown Publisher';
  }
}

function toIsoDate(input) {
  if (!input) return null;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

async function fetchAndParseUrl(sourceUrl) {
  const headers = {
    'User-Agent': 'SWENNewsBot/1.0 (+https://swen.example)'
  };

  const response = await axios.get(sourceUrl, { headers, timeout: 20000 });
  const html = response.data;
  const $ = cheerio.load(html);

  // Remove non-content elements
  ['script', 'style', 'noscript', 'svg', 'nav', 'header', 'footer', 'aside'].forEach(tag => $(tag).remove());

  // Title extraction priority: og:title -> twitter:title -> <title>
  const title = (
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('title').first().text()
  )?.trim();

  // Publisher/site name
  const siteName = (
    $('meta[property="og:site_name"]').attr('content') ||
    $('meta[name="application-name"]').attr('content')
  )?.trim();
  const publisher = siteName || extractDomain(sourceUrl);

  // Published time from common meta tags
  const published = (
    $('meta[property="article:published_time"]').attr('content') ||
    $('meta[name="pubdate"]').attr('content') ||
    $('meta[name="publish-date"]').attr('content') ||
    $('meta[name="date"]').attr('content') ||
    $('time[datetime]').attr('datetime') ||
    $('meta[name="DC.date.issued"]').attr('content') ||
    $('meta[property="og:updated_time"]').attr('content')
  );
  const published_at = toIsoDate(published) || null;

  // Body extraction heuristics
  const articleSelectors = [
    'article',
    '.article-body', '.article__body', '.ArticleBody', '.story-body', '.post-content', '.entry-content', '.content__article-body', '.c-article__body'
  ];

  let bodyText = '';
  for (const sel of articleSelectors) {
    if ($(sel).length) {
      bodyText = $(sel).find('p').map((i, el) => $(el).text().trim()).get().join('\n\n');
      if (bodyText && bodyText.length > 300) break;
    }
  }

  if (!bodyText || bodyText.length < 300) {
    // Fallback: collect significant paragraphs globally
    const paras = $('p').map((i, el) => $(el).text().trim()).get();
    bodyText = paras.filter(t => t && t.length > 50).slice(0, 30).join('\n\n');
  }

  return {
    title,
    body: bodyText,
    source_url: sourceUrl,
    publisher,
    published_at: published_at || new Date().toISOString()
  };
}

async function ingestFromUrl(url) {
  try {
    const data = await fetchAndParseUrl(url);
    if (!data.title || !data.body) {
      throw new Error('Failed to extract content from URL');
    }
    return data;
  } catch (error) {
    logger.error('Error ingesting from URL:', { url, error: error.message });
    throw error;
  }
}

async function ingestFromRss(feedUrl, limit = 3) {
  try {
    const feed = await rssParser.parseURL(feedUrl);
    const items = (feed.items || []).slice(0, Math.max(1, Math.min(limit, 10)));

    const results = [];
    for (const item of items) {
      const source_url = item.link || item.guid || '';
      let body = item.contentSnippet || item.content || '';

      // If snippet is short, try fetching the full article
      if (!body || body.length < 300) {
        try {
          const pageData = await fetchAndParseUrl(source_url);
          body = pageData.body;
        } catch (e) {
          // keep RSS snippet if fetch fails
        }
      }

      results.push({
        title: item.title || feed.title,
        body: body,
        source_url,
        publisher: feed.title || extractDomain(feedUrl),
        published_at: toIsoDate(item.isoDate || item.pubDate) || new Date().toISOString()
      });
    }

    return results;
  } catch (error) {
    logger.error('Error ingesting from RSS:', { feedUrl, error: error.message });
    throw error;
  }
}

module.exports = {
  ingestFromUrl,
  ingestFromRss
};
