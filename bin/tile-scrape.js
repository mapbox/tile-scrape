#!/usr/bin/env node

var minimist = require('minimist');
var stream = require('stream');
var os = require('os');
var crypto = require('crypto');
var path = require('path');
var combiner = require('stream-combiner');
var serialize = require('tilelive/lib/stream-util').serialize;
var scrape = require('..').scrape;

var args = minimist(process.argv.slice(2), {
  boolean: ['h', 'help']
});

var url = args._[0];
var output = args.o || args.output;
var transform = args.t || args.transform;
if (transform) transform = require(transform);

function help() {
  console.error('USAGE: tile-scrape [OPTIONS] <s3 url>');
  console.error('');
  console.error('The s3 url should be provided as an s3-style URI like s3://my-bucket/my-prefix');
  console.error('');
  console.error('Options:');
  console.error(' -h, --help        show this message');
  console.error(' -o, --output      path to desired output serialtiles file');
  console.error(' -t, --transform   path to a module which exports a transform stream');
}

if (args.h || args.help || !url) return help();

if (!output) {
  output = path.join(os.tmpdir(), crypto.randomBytes(8).toString('hex'));
  var printer = new stream.Transform({ objectMode: true });
  printer._transform = function(tile, enc, callback) {
    console.log(serialize(tile));
    callback(null, tile);
  };

  transform = transform ? combiner(transform, printer) : printer;
}

scrape(url, output, transform, function(err) {
  if (err) throw err;
});
