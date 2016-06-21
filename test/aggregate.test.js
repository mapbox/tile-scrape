var test = require('tape');
var AWS = require('aws-sdk');
var mock = require('mock-aws-s3');
var path = require('path');
var os = require('os');
var crypto = require('crypto');
var Mbtiles = require('mbtiles');
var scraper = require('../lib/scrape');
var events = require('events');
var mkdirp = require('mkdirp');
var aggregate = require('../lib/aggregate');

mock.config.basePath = path.resolve(__dirname, 'fixtures', 'mockS3');
var Client;

test('[aggregate] start mocking S3 client', function(assert) {
  Client = AWS.S3;
  AWS.S3 = function() {};
  AWS.S3.prototype = mock.S3();
  AWS.S3.prototype.getObject = function(params, callback) {
    mock.S3().getObject(params, callback);
    return new events.EventEmitter();
  };
  assert.end();
});

test('[aggregate] success w/ reads from S3', function(assert) {
  var tmpDir = path.join(os.tmpdir(), crypto.randomBytes(16).toString('hex'));
  var fileA = path.join(tmpDir, crypto.randomBytes(16).toString('hex'));
  var fileB = path.join(tmpDir, crypto.randomBytes(16).toString('hex'));

  mktmp(tmpDir).catch(function(err) { assert.ifError(err, 'make tmpdir'); assert.end(); })
    .then(scrapeAll).catch(function(err) { assert.ifError(err, 'scrape mock S3'); assert.end(); })
    .then(aggregation).catch(function(err) { assert.ifError(err, 'aggregate'); assert.end(); })
    .then(open).catch(function(err) { assert.ifError(err, 'open output mbtiles'); assert.end(); })
    .then(listTiles).catch(function(err) { assert.ifError(err, 'list tiles'); assert.end(); })
    .then(function(tiles) {
      assert.deepEqual(tiles, [
        '10/576/561',
        '10/576/560',
        '10/592/560',
        '10/592/545',
        '10/592/544',
        ''
      ], 'mbtiles file contains expected tiles');
      assert.end();
    });

  function mktmp(dirPath) {
    return new Promise(function(resolve, reject) {
      mkdirp(dirPath, function(err) {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  function scrape(url, filePath) {
    return new Promise(function(resolve, reject) {
      scraper(url, filePath, function(err) {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  function scrapeAll() {
    return Promise.all([
      scrape('s3://bucket/00/tileset-a', fileA),
      scrape('s3://bucket/01/tileset-a', fileB)
    ]);
  }

  function aggregation() {
    var output = path.join(os.tmpdir(), crypto.randomBytes(16).toString('hex'));
    return new Promise(function(resolve, reject) {
      aggregate(tmpDir, output, function(err) {
        if (err) return reject(err);
        resolve(output);
      });
    });
  }

  function open(mbtilesPath) {
    return new Promise(function(resolve, reject) {
      new Mbtiles(mbtilesPath, function(err, src) {
        if (err) return reject(err);
        resolve(src);
      });
    });
  }

  function listTiles(src) {
    return new Promise(function(resolve, reject) {
      var tiles = [];
      src.createZXYStream()
        .on('error', reject)
        .on('data', function(d) { tiles = tiles.concat(d.toString().split('\n')); })
        .on('end', function() { resolve(tiles); });
    });
  }
});

test('[aggregate] stop mocking S3', function(assert) {
  AWS.S3 = Client;
  assert.end();
});
