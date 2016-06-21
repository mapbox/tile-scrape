
/**
 * Tools for scraping tiles from S3.
 * @name tile-scrape
 * @example
 * var scraper = require('tile-scrape');
 */
module.exports = {
  scrape: require('./lib/scrape'),
  aggregate: require('./lib/aggregate'),
  expander: require('./lib/expander')
};
