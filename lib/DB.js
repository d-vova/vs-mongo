var bond = require('vs-bond');
var mongo = require('mongodb');


var Collection = require('./Collection');
var LOG = 'VS MONGO:';
var DEFAULT_BATCH_SIZE = 100;


var DB = module.exports = function DB ( uri, config ) {
  this.uri = uri; this.config = config;

  for ( var name in this.config ) {
    if ( !(this.config[name].batchSize > 0) ) {
      this.config[name].batchSize = DEFAULT_BATCH_SIZE;
    }
  
    if ( !this.config[name].create ) this.config[name].create = { }
    if ( !this.config[name].indexes ) this.config[name].indexes = [ ];
  }
}

DB.prototype.connect = function connect ( ) {
  var db = this.connection = bond.obj(mongo.MongoClient).run('connect', this.uri);

  db.callback(DB.log('"' + this.uri + '" database connection'));

  for ( var name in this.config ) {
    var collection = bond.run(DB.setup, [ db, name, this.config[name] ]);

    if ( !this[name] ) {
      this[name] = new Collection(name, collection);

      this[name].batchSize = this.config[name].batchSize;
    }

    collection.callback(DB.log('"' + name + '" collection setup'));
  }

  return this;
}

DB.prototype.disconnect = function disconnect ( ) {
  var disconnect = bond.obj(this.connection).run('close');

  disconnect.callback(DB.log('"' + this.uri + '" database disconnection'));

  return this;
}


DB.setup = function setup ( db, name, config, callback ) {
  var collection = bond.obj(db).run('collection', name);

  if ( !config.dropSync ) collection.callback(callback);
  else {
    var options = bond.obj(collection).run('options').callback(DB.log('"' + name + '" collection option retrieval'));
    var indexes = bond.obj(collection).run('indexes').callback(DB.log('"' + name + '" collection index retrieval'));

    var optSetup = bond.run(DB.setup.options, [ collection, config, options ]);
    var idxSetup = bond.dep(optSetup).run(DB.setup.indexes, [ collection, config, indexes ]);

    collection = bond.dep(idxSetup).obj(db).run('collection', name).callback(callback);
  }
}

DB.setup.options = function setupOptions ( collection, config, options, callback ) {
  var optCmpr = DB.compareOptions(options, config.create);

  if ( optCmpr === true ) callback(null, collection);
  else {
    var db = collection.db, name = collection.collectionName;
    var drop = bond.obj(db.collection(name)).run('drop').callback(DB.log('"' + name + '" collection removal'));

    bond.dep(drop).obj(db).run('createCollection', [ name, config.create ]).callback(callback);
  }
}

DB.setup.indexes = function setupIndexes ( collection, config, indexes, callback ) {
  var idxCmpr = DB.compareIndexes(indexes, config.indexes);

  if ( idxCmpr === true ) callback();
  else {
    var removed = [ ], created = [ ];

    for ( var i = 0; i < idxCmpr.remove.length; i += 1 ) {
      var index = DB.normalizeIndex(idxCmpr.remove[i]);
      var removedIndex = bond.obj(collection).run('dropIndex', idxCmpr.remove[i].key);

      removed.push(removedIndex);

      removedIndex.callback(DB.log('"' + index.name + '" index removal'));
    }

    for ( var i = 0; i < idxCmpr.create.length; i += 1 ) {
      var index = DB.normalizeIndex(idxCmpr.create[i]);
      var createdIndex = bond.dep(removed).obj(collection).run('createIndex', idxCmpr.create[i]);

      created.push(createdIndex);

      createdIndex.callback(DB.log('"' + index.name + '" index creation'));
    }

    bond.dep(removed).run().callback(callback);
  }
}


DB.compareOptions = function compareOptions ( optA, optB ) {
  var optA = optA || { }, optB = optB || { }

  var cap = optA.capped == optB.capped;
  var max = optA.max == optB.max;
  var size = optA.size == optB.size;
  var auto = optA.autoIndexId == optB.autoIndexId;

  return cap && max && size && auto;
}

DB.compareIndexes = function compareIndexes ( idxA, idxB ) {
  var hashA = { }, hashB = { }, indexes = { remove: [ ], create: [ ] };

  for ( var i = 0; i < idxA.length; i += 1 ) {
    var index = DB.normalizeIndex(idxA[i], i);

    if ( index && index.name != '_id_' ) hashA[index.name] = index;
  }

  for ( var i = 0; i < idxB.length; i += 1 ) {
    var index = DB.normalizeIndex(idxB[i], i);

    if ( index && index.name != '_id_' ) hashB[index.name] = index;
  }

  for ( var hash in hashA ) {
    var a = hashA[hash], b = hashB[hash];

    if ( !DB.compareIndexes.couple(a, b) ) {
      indexes.remove.push(idxA[a.v]);
    }
  }

  for ( var hash in hashB ) {
    var a = hashA[hash], b = hashB[hash];

    if ( !DB.compareIndexes.couple(a, b) ) {
      indexes.create.push(idxB[b.v]);
    }
  }

  return indexes.remove.length || indexes.create.length ? indexes : true;
}

DB.compareIndexes.couple = function compareIndexesCouple ( idxA, idxB ) {
  if ( !idxA || !idxB ) return false;

  for ( var i in idxA ) {
    if ( i != 'v' && i != 'ns' && i != 'key' && idxA[i] != idxB[i] ) return false;
  }

  for ( var i in idxB ) {
    if ( i != 'v' && i != 'ns' && i != 'key' && idxA[i] != idxB[i] ) return false;
  }

  return true;
}

DB.normalizeIndex = function normalizeIndex ( index, i ) {
  var result = null;

  if ( index instanceof Object ) {
    result = { v: i }

    for ( var name in index ) {
      if ( name != 'v' && name != 'ns' ) result[name] = index[name];
    }
  }

  if ( index instanceof Array ) {
    var parts = [ ], key = index[0] || { }, options = index[1] || { }

    for ( var part in key ) parts.push(part, key[part]);

    result = { v: i, key: key, name: parts.join('_') }

    for ( var name in options ) result[name] = options[name];
  }

  return result;
}


DB.log = function log ( title ) {
  if ( !DB.log.isOn ) return null;

  var title = '\033[1m' + title + '\033[0m';

  return function callback ( error, value ) {
    console.log([ LOG, title, error ? 'failed' : 'succeeded' ].join(' '));
  }
}


DB.log.isOn = true;


if ( require.main === module ) {
  console.log('Testing DB at "' + __filename + '"...');

  var uri = 'mongodb://localhost/sandbox';
  var config = { users: { dropSync: true } }
  
  var db = new DB(uri, config).connect();

  var User = function User ( doc ) {
    db.users.create(doc, this);
  }

  db.users.extend(User);
  
  var names = [ 'Bill', 'Jill', 'Phil', 'Will' ];
  var users = names.map(function ( name ) {
    return new User({ name: name });
  });

//  User.save(users, function ( error, value ) {
//    if ( error ) console.log('error occurred while saving users: ' + error);
//    else console.log('users have been successfully saved');
//  });
//
//  var onBatch = function onBatch ( error, value ) {
//    console.log('batch');
//  }
//
//  var onDone = function onDone ( error, value ) {
//    console.log('done streaming');
//  }
//
//  User.stream({ name: 'Bill' }, { }, onBatch, onDone);
//
//  db.users.save(users, function ( error, value ) {
//    if ( error ) console.log('error occurred while saving users: ' + error);
//    else console.log('users have been successfully saved');
//  });
//
//  var query = { name: /^.ill$/ }
//
//  db.users.count(query, function ( error, value ) {
//    if ( error ) console.log('error occurred while counting users: ' + error);
//    else console.log('users have been successfully counted: ' + String(value));
//  });

  setTimeout(function ( ) { db.disconnect(); }, 1000);
}
