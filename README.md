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

var config = {
}

var db = mongo.connect(config);

db.disconnect();
```


License
-------

MIT
