var test = require('tape');
var AWS = require('aws-sdk');
var mock = require('mock-aws-s3');
var path = require('path');
var os = require('os');
var crypto = require('crypto');
var zlib = require('zlib');
var scrape = require('../lib/scrape');
var events = require('events');
var fs = require('fs');
var stream = require('stream');

mock.config.basePath = path.resolve(__dirname, 'fixtures', 'mockS3');
var Client;

test('[scrape] start mocking S3 client', function(assert) {
  Client = AWS.S3;
  AWS.S3 = function() {};
  AWS.S3.prototype = mock.S3();
  AWS.S3.prototype.getObject = function(params, callback) {
    mock.S3().getObject(params, callback);
    return new events.EventEmitter();
  };
  assert.end();
});

test('[scrape] success', function(assert) {
  var url = 's3://bucket/00/tileset-a';
  var output = path.join(os.tmpdir(), crypto.randomBytes(16).toString('hex'));
  var expected = fs.readFileSync(path.resolve(__dirname, 'expected', 'tileset-a-00.serialtiles'), 'utf8');

  scrape(url, output, function(err) {
    if (err) return assert.end(err);
    assert.pass('finished successfully');

    zlib.gunzip(fs.readFileSync(output), function(err, data) {
      if (err) return assert.end(err);

      assert.equal(data.toString(), expected, 'wrote expected serialtiles');
      assert.end();
    });
  });
});

test('[scrape] with a transform', function(assert) {
  var url = 's3://bucket/00/tileset-a';
  var output = path.join(os.tmpdir(), crypto.randomBytes(16).toString('hex'));
  var expected = fs.readFileSync(path.resolve(__dirname, 'expected', 'tileset-a-00.serialtiles'), 'utf8');
  var transform = new stream.Transform({ objectMode: true });
  var count = 0;

  transform._transform = function(tile, enc, callback) {
    var acceptable = [
      '10/576/560',
      '10/592/544',
      '10/592/560'
    ];
    var coords = [tile.z, tile.x, tile.y].join('/');
    assert.ok(acceptable.indexOf(coords) > -1, `transform was provided tile ${coords}`);
    count++;
    callback(null, tile);
  };

  scrape(url, output, transform, function(err) {
    if (err) return assert.end(err);
    assert.pass('finished successfully');

    zlib.gunzip(fs.readFileSync(output), function(err, data) {
      if (err) return assert.end(err);

      assert.equal(data.toString(), expected, 'wrote expected serialtiles');
      assert.equal(count, 3, 'transform was given each tile');
      assert.end();
    });
  });
});

test('[scrape] stop mocking S3', function(assert) {
  AWS.S3 = Client;
  assert.end();
});
