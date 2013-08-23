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

```javascript
var mongo = require('vs-mongo');

var uri = 'mongodb://localhost/sandbox';
var config = {
}

var db = mongo.connect(uri, config);

db.disconnect();
```


Configuration
-------------

  - `shouldDropSync` - permission to drop collections and indexes
  - `batchSize` - batch size used for retrieving large sets of documents (default - 10)
  - `isCapped` - collection should be capped
  - `maxSize` - maximum size of collection in bytes
  - `maxDocCount` - maximum number of documents in collection
  - `shouldAutoIndexId` - auto-populate and index `_id` field
  - `keys` - fields and orders used for indexing
  - `options` - options used for indexing

```
<config> = {
  <collection name> : {
    dropSync          : <shouldDropSync>,
    batchSize         : <batchSize>,
    create            : {
      capped            : <isCapped>,
      size              : <maxSize>,
      max               : <maxDocCount>,
      autoIndexId       : <shouldAutoIndexId>
    },
    indexes           : [
      [ <keys>, <options> ]
    ]
  }
}
```


Collection
----------

Collection objects match `<collection name>` and are available immediately.


#### Create ####

Create a single document

```javascript
var mongo = require('vs-mongo');

var uri = 'mongodb://localhost/sandbox';
var config = { users: { dropSync: true } }

var db = mongo.connect(uri, config);

var names = [ 'Bill', 'Jill', 'Phil', 'Will' ];
var users = names.map(function ( name ) {
  return db.users.create({ name: name });
});
```


#### Save ####

Saving one or multiple documents

```javascript
db.users.save(users, function ( error, value ) {
  if ( error ) console.log('error occurred while saving users: ' + error);
  else console.log('users have been successfully saved');
});
```


#### Refresh ####

Refreshing one or multiple documents

```javascript
db.users.refresh(users, function ( error, value ) {
  if ( error ) console.log('error occurred while refreshing users: ' + error);
  else console.log('users have been successfully refreshed');
});
```


#### Remove ####

Removing one or multiple documents

```javascript
db.users.remove(users, function ( error, value ) {
  if ( error ) console.log('error occurred while removing users: ' + error);
  else console.log('users have been successfully removed');
});
```


#### Find One ####

Find first matching document

```javascript
var query = { name: /^.ill$/ }, options = { }

db.users.findOne(query, options, function ( error, value ) {
  if ( error ) console.log('error occurred while looking for user: ' + error);
  else console.log('successfully found user: ' + String(value));
});
```


#### Find All ####

Find all matching documents (the result is limited by `batchSize`)

```javascript
var query = { name: /^.ill$/ }, options = { }

db.users.findAll(query, options, function ( error, value ) {
  if ( error ) console.log('error occurred while looking for users: ' + error);
  else {
    console.log('successfully found users:');
    
    for ( var i = 0; i < value.length; i += 1 ) {
      console.log('user' + i + ' - ' + String(value[i]));
    }
  }
});
```


#### Count ####

Counting matching documents

```javascript
var query = { name: /^.ill$/ }

db.users.count(query, function ( error, value ) {
  if ( error ) console.log('error occurred while counting users: ' + error);
  else console.log('users have been successfully counted: ' + String(value));
});
```


#### Remove One ####

Remove first matching document

```javascript
var query = { name: /^.ill$/ }

db.users.removeOne(query, function ( error, value ) {
  if ( error ) console.log('error occurred while removing user: ' + error);
  else console.log('successfully removed user: ' + String(value));
});
```


#### Remove All ####

Remove all matching documents

```javascript
var query = { name: /^.ill$/ }

db.users.removeAll(query, function ( error, value ) {
  if ( error ) console.log('error occurred while removing users: ' + error);
  else console.log('successfully removed users: ' + String(value));
});
```


Document
--------

Objects return by collection methods are wrappers around raw documents retrieved from the database.

These wrappers provide additional functionality that should make developer's life easier


#### Save ####

Save can easily be chained to the end of document creation

```javascript
var callback = function callback ( error, value ) {
  if ( error ) console.log('error occurred while saving user: ' + error);
  else console.log('user have been successfully saved');
}

var user = db.users.create({ name: 'Joe' }).save(callback);
```


#### Refresh ####

Refresh helps to make sure the underlying document is up-to-date

```javascript
var callback = function callback ( error, value ) {
  if ( error ) console.log('error occurred while refreshing user: ' + error);
  else console.log('user have been successfully refreshed');
}

user.refresh(callback);
```


#### Remove ####

Remove can be called directly on the object

```javascript
var callback = function callback ( error, value ) {
  if ( error ) console.log('error occurred while removing user: ' + error);
  else console.log('user have been successfully removed');
}

user.remove(callback);
```


Extend
------

When extending a class, collection functionality is transferred to the class,
and all retrieved documents are passed to the class constructor

```javascript
var mongo = require('vs-mongo');

var uri = 'mongodb://localhost/sandbox';
var config = { users: { dropSync: true } }

var db = mongo.connect(uri, config);

var User = function User ( doc ) {
  db.users.create(doc, this);
}

db.users.extend(User);

var names = [ 'Bill', 'Jill', 'Phil', 'Will' ];
var users = names.map(function ( name ) {
  return new User({ name: name });
});

User.save(users, function ( error, value ) {
  if ( error ) console.log('error occurred while saving users: ' + error);
  else console.log('users have been successfully saved');
});
```


Logging
-------

The output to the console, generated by the module, can be turned on or off

```javascript
var mongo = require('vs-mongo');

mongo.log.on();    // turn logging on
mongo.log.off();   // turn logging off

mongo.log(true);   // turn logging on
mongo.log(false);  // turn logging off
```


License
-------

MIT
