vs-mongo
========

Thin wrapper around native MongoDB driver for NodeJS


Installation
------------

```
npm install vs-mongo
```


Quick Start
-----------

```
var mongo = require('vs-mongo');

var uri = 'mongodb://localhost/sandbox';
var config = {
}

var db = mongo.connect(uri, config);

db.disconnect();
```


Configuration
-------------

  * `dropSync` - allow to drop collection when does not match configuration
  * `maxBatchSize` - maximum batch size used for retrieving large sets of documents
  * `isCapped` - collection should be capped
  * `maxSize` - maximum size of collection in bytes
  * `maxDocCount` - maximum number of documents in collection
  * `shouldAutoIndexId` - auto-populate and index `_id` field
  * `index` - fields and orders used for indexing
  * `options` - options used for indexing

```
<config> = {
  <collection name> : {
    dropSync          : <shouldDropSync>,
    batchSize         : <maxBatchSize>,
    create            : {
      capped            : <isCapped>,
      size              : <maxSize>,
      max               : <maxDocCount>,
      autoIndexId       : <shouldAutoIndexId>
    },
    indexes           : [
      [ <index>, <options> ]
    ]
  }
}
```


License
-------

MIT
