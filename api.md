# tile-scrape

Tools for scraping tiles from S3.

**Examples**

```javascript
var scraper = require('tile-scrape');
```

## scrape

Scans an S3 prefix and writes tiles into a serialtiles file

**Parameters**

-   `url` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the S3 url (e.g. s3://bucket/prefix) to scan
-   `outPath` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the path to the intended output serialtiles file
-   `transform` **\[[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)]** an optional transform stream to manipulate tiles as they are read
-   `callback` **[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** triggered on completion or if an error occurs

**Examples**

```javascript
scraper.scrape('s3://my-bucket/tileset/prefix', '/tmp/output.serialtiles', function(err) {
  if (err) throw err;
});
```

## aggregate

Convert a folder full of serialtiles files into an mbtiles file

**Parameters**

-   `folderPath` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the folder containing serialtiles files
-   `outPath` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the intended `.mbtiles` output file
-   `callback` **[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** triggered on completion or if an error occurs

**Examples**

```javascript
scraper.aggregate('/tmp/serialtiles-files', '/tmp/aggregated.mbtiles', function(err) {
  if (err) throw err;
});
```

## expander

Expand a `{prefix}` or `{prefix4}` tileset URL into an array of absolute prefixes

**Parameters**

-   `tilesetUrl` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** an s3 URL containing `{prefix}` or `{prefix4}`

**Examples**

```javascript
scraper.expander('s3://my-bucket/{prefix}/tileset-id/{z}/{x}/{y}', function(err, prefixes) {
  if (err) throw err;
  console.log(prefixes.join('\n'));
  // 00/tileset-id
  // 0a/tileset-id
  // 0b/tileset-id
  // ...
});
```

Returns **[array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>** an array of absolute S3 prefixes suitable for scraping
