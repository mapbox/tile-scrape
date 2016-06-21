var fs = require('fs');
var https = require('https');
var stream = require('stream');
var zlib = require('zlib');
var AWS = require('aws-sdk');
var s3scan = require('s3scan');
var Tile = require('tilelive/lib/stream-util').Tile;
var serialize = require('tilelive/lib/stream-util').serialize;

module.exports = scrape;

/**
 * Scans an S3 prefix and writes tiles into a serialtiles file
 *
 * @memberof tile-scrape
 * @param {string} url - the S3 url (e.g. s3://bucket/prefix) to scan
 * @param {string} outPath - the path to the intended output serialtiles file
 * @param {object} [transform] - an optional transform stream to manipulate tiles as they are read
 * @param {function} callback - triggered on completion or if an error occurs
 * @example
 * scraper.scrape('s3://my-bucket/tileset/prefix', '/tmp/output.serialtiles', function(err) {
 *   if (err) throw err;
 * });
 */
function scrape(url, outPath, transform, callback) {
  if (typeof transform === 'function') {
    callback = transform;
    transform = null;
  }

  var scrape = s3scan.Scan(url, {
    s3: new AWS.S3({
      httpOptions: {
        agent: new https.Agent({ keepAlive: true }),
        timeout: 5000
      },
      maxRetries: 10
    }),
    highWaterMark: 1000,
    concurrency: 100,
    keys: true
  });

  var parser = new stream.Transform({ objectMode: true });

  parser._transform = function(data, enc, callback) {
    var key = data.RequestParameters.Key;
    var zxy = key.match(/\/(\d+)\/(\d+)\/(\d+)/);
    var tile = new Tile(zxy[1], zxy[2], zxy[3], data.Body);
    callback(null, tile);
  };

  var serialization = new stream.Transform({ objectMode: true });

  serialization._transform = function(tile, enc, callback) {
    callback(null, serialize(tile) + '\n');
  };

  var zipper = zlib.createGzip();

  var output = fs.createWriteStream(outPath);

  zipper.write('JSONBREAKFASTTIME\n');

  var pipeline = scrape.on('error', callback)
    .pipe(parser).on('error', callback);

  if (transform) pipeline.pipe(transform).on('error', callback);

  pipeline
    .pipe(serialization).on('error', callback)
    .pipe(zipper).on('error', callback)
    .pipe(output).on('error', callback)
      .on('finish', callback);
}
