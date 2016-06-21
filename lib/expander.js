var s3urls = require('s3urls');

module.exports = expander;

/**
 * Expand a `{prefix}` or `{prefix4}` tileset URL into an array of absolute prefixes suitable for scraping
 *
 * @memberof tile-scrape
 * @param {string} tilesetUrl - an s3 URL containing `{prefix}` or `{prefix4}`
 * @returns {array<string>} an array of absolute S3 prefixes suitable for scraping
 * @example
 * scraper.expander('s3://my-bucket/{prefix}/tileset-id/{z}/{x}/{y}', function(err, prefixes) {
 *   if (err) throw err;
 *   console.log(prefixes.join('\n'));
 *   // 00/tileset-id
 *   // 0a/tileset-id
 *   // 0b/tileset-id
 *   // ...
 * });
 */
function expander(tilesetUrl) {
  var template = decodeURIComponent(s3urls.fromUrl(tilesetUrl).Key)
    .replace(/\{z\}\/\{x\}\/\{y\}.*$/, '');

  var base = 1;
  if (/\{prefix\}/.test(template)) base = 16;
  else if (/\{prefix4\}/.test(template)) base = 256;

  var result = [];
  for (var i = 0; i < base; i++) {
    for (var j = 0; j < base; j++) {
      result.push(
        template
          .replace('{prefix}', i.toString(16) + j.toString(16))
          .replace('{prefix4}', pad(i.toString(16)) + pad(j.toString(16)))
      );
    }
  }

  return result;
}

function pad(str) {
  return str.length < 2 ? '0' + str : str;
}
