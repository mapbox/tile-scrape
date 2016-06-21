var test = require('tape');
var expander = require('../lib/expander');
var fs = require('fs');
var path = require('path');

test('[expander] no prefix', function(assert) {
  var result = expander('s3://bucket/somewhere/{z}/{x}/{y}');
  assert.deepEqual(result, ['somewhere/'], 'returned expected results');
  assert.end();
});

test('[expander] 2-char prefix', function(assert) {
  var result = expander('s3://bucket/{prefix}/somewhere/{z}/{x}/{y}');
  var expected = path.resolve(__dirname, 'expected', 'prefix2');
  assert.deepEqual(result, fs.readFileSync(expected, 'utf8').split('\n'), 'returned expected results');
  assert.end();
});

test('[expander] 4-char prefix', function(assert) {
  var result = expander('s3://bucket/{prefix4}/somewhere/{z}/{x}/{y}');
  var expected = path.resolve(__dirname, 'expected', 'prefix4');
  assert.deepEqual(result, fs.readFileSync(expected, 'utf8').split('\n'), 'returned expected results');
  assert.end();
});
