var fs = require('fs');
var https = require('https');
var zlib = require('zlib');
var AWS = require('aws-sdk');
var split = require('binary-split');
var deserialize = require('tilelive/lib/stream-util').deserialize;
var parallel = require('parallel-stream');
var s3urls = require('s3urls');

module.exports = write;

/**
 * Read a serialtiles file and write the results to S3
 *
 * @param {string} inPath - the path to a serialtiles file
 * @param {string} url - an S3 url template representing the intended destination on S3
 * @param {function} callback - triggered on completion or if an error occurs
 */
function write(inPath, url, callback) {
  var s3url = s3urls(url);

  var s3 = new AWS.S3({
    httpOptions: {
      agent: new https.Agent({ keepAlive: true }),
      timeout: 5000
    },
    maxRetries: 10
  });

  var input = fs.createReadStream(inPath);

  var unzipper = zlib.createGunzip();

  var splitter = split();

  var writer = parallel.writable(function(line, enc, callback) {
    var tile = deserialize(line.toString());
    s3.putObject({
      Bucket: s3url.Bucket,
      Key: prepareKey(s3url.Key, tile.z, tile.x, tile.y),
      Body: tile.buffer
    }, callback);
  });

  input.on('error', callback)
    .pipe(unzipper).on('error', callback)
    .pipe(splitter).on('error', callback)
    .pipe(writer).on('error', callback)
      .on('finish', callback);
}

function prepareKey(template, z, x, y) {
  return template
    .replace(/\{prefix\}/g, (x % 16).toString(16) + (y % 16).toString(16))
    .replace(/\{prefix4\}/g, pad((x % 256).toString(16)) + pad((y % 256).toString(16)))
    .replace(/\{z\}/g, z)
    .replace(/\{x\}/g, x)
    .replace(/\{y\}/g);
}

function pad(str) {
  return str.length < 2 ? '0' + str : str;
}
