var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var split = require('binary-split');
var parallel = require('parallel-stream');
var deserialize = require('tilelive/lib/stream-util').deserialize;
var Mbtiles = require('mbtiles');

module.exports = aggregate;

/**
 * Convert a folder full of serialtiles files into an mbtiles file
 *
 * @memberof tile-scrape
 * @param {string} folderPath - path to the folder containing serialtiles files
 * @param {string} outPath - path to the intended `.mbtiles` output file
 * @param {function} callback - triggered on completion or if an error occurs
 * @example
 * scraper.aggregate('/tmp/serialtiles-files', '/tmp/aggregated.mbtiles', function(err) {
 *   if (err) throw err;
 * });
 */
function aggregate(folderPath, outPath, callback) {
  open(outPath).catch(callback)
    .then(function(src) {
      var copies = fs.readdirSync(folderPath).map(function(filename) {
        return copy(path.join(folderPath, filename), src);
      });

      Promise.all(copies).catch(callback)
        .then(function() {
          src.stopWriting(function(err) {
            if (err) return callback(err);
            src.close(callback);
          });
        });
    });
}

function open(filePath) {
  return new Promise(function(resolve, reject) {
    new Mbtiles(filePath, function(err, src) {
      if (err) return reject(err);
      src.startWriting(function(err) {
        if (err) return reject(err);
        resolve(src);
      });
    });
  });
}

function copy(inputPath, dst) {
  var input = fs.createReadStream(inputPath);

  var unzipper = zlib.createGunzip();

  var splitter = split();

  var deserializer = parallel.writable(function(line, enc, callback) {
    line = line.toString();
    if (line === 'JSONBREAKFASTTIME') return callback();

    var tile = deserialize(line);
    dst.putTile(tile.z, tile.x, tile.y, tile.buffer, callback);
  }, { concurrency: 1000 });

  input.pipe(unzipper).pipe(splitter).pipe(deserializer);

  return new Promise(function(resolve, reject) {
    input.on('error', reject);
    unzipper.on('error', reject);
    splitter.on('error', reject);
    deserializer.on('error', reject);
    deserializer.on('finish', resolve);
  });
}
