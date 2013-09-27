var bond = require('vs-bond');
var mongo = require('mongodb');

var Collection = module.exports = function Collection ( name, collection ) {
  this.name = name;
  this.collection = collection;

  this.wrapper = Collection.wrap(this);
}

Collection.prototype.create = function create ( doc, wrapper ) {
  var doc = doc || { }
  var wrapper = wrapper || { }

  wrapper.doc = { }

  for ( var name in doc ) {
    wrapper.doc[name] = doc[name];
  }

  if ( !wrapper.doc._id ) {
    wrapper.doc._id = new mongo.ObjectID();
  }

  for ( var name in this.wrapper ) {
    wrapper[name] = this.wrapper[name];
  }

  return wrapper;
}

Collection.prototype.save = function save ( items, callback ) {
  var items = items instanceof Array ? items : items ? [ items ] : [ ];
  var saved = [ ], cb = function cb ( item ) {
    return function callback ( error, value ) {
      if ( error ) {
        console.log('Failed to save: ' + String(item), error);
      }
    }
  }

  for ( var i = 0; i < items.length; i += 1 ) {
    var savedItem, item = items[i], doc = item.doc;

    saved.push(savedItem = bond.obj(this.collection).run('save', doc));

    savedItem.callback(cb(item));
  }

  return bond.dep(saved).run().callback(callback);
}

Collection.prototype.remove = function remove ( items, callback ) {
  var items = items instanceof Array ? items : items ? [ items ] : [ ];
  var removed = [ ], cb = function cb ( item ) {
    return function callback ( error, value ) {
      if ( error ) {
        console.log('Failed to remove: ' + String(item), error);
      }
    }
  }

  for ( var i = 0; i < items.length; i += 1 ) {
    var removedItem, item = items[i], doc = item.doc;

    removed.push(removedItem = bond.obj(this.collection).run('remove', doc));

    removedItem.callback(cb(item));
  }

  return bond.dep(removed).run().callback(callback);
}

Collection.prototype.refresh = function refresh ( items, callback ) {
  var items = items instanceof Array ? items : items ? [ items ] : [ ];
  var refreshed = [ ], cb = function cb ( item ) {
    return function callback ( error, value ) {
      if ( error ) {
        console.log('Failed to retrieve: ' + String(item), error);
      }
      else if ( value ) item.doc = value;
    }
  }

  for ( var i = 0; i < items.length; i += 1 ) {
    var refreshedItem, item = items[i], doc = item.doc;

    refreshed.push(refreshedItem = bond.obj(this.collection).run('findOne', doc));

    refreshedItem.callback(cb(item));
  }

  return bond.dep(refreshed).run().callback(callback);
}


Collection.prototype.findOne = function findOne ( query, options, callback, Class ) {
  var self = this, done = function done ( error, value ) {
    if ( !error ) {
      var obj = Collection.objectify(value, self, Class);

      if ( callback ) callback(null, obj);
    }
    else if ( callback ) callback(error);
  }

  return bond.obj(this.collection).run('findOne', [ query, options ]).callback(done);
}

Collection.prototype.findAll = function findAll ( query, options, callback, Class ) {
  var self = this, options = options || { }

  var retrieve = function retrieve ( collection, callback ) {
    collection.find(query, options).toArray(callback);
  }

  var done = function done ( error, value ) {
    if ( !error ) {
      var objs = Collection.objectify(value, self, Class);

      if ( callback ) callback(null, objs);
    }
    else if ( callback ) callback(error);
  }

  options.limit = this.batchSize;

  return bond.run(retrieve, this.collection).callback(done);
}

Collection.prototype.stream = function stream ( query, options, onBatch, callback, Class ) {
  var self = this, batchSize = this.batchSize;
  var options = options || { }, skip = options.skip || 0;

  var retrieve = function retrieve ( collection, callback ) {
    var opts = { skip: skip, limit: batchSize }
    var args = [ query, opts, bond.cb, Class ];

    for ( var name in options ) {
      if ( opts[name] == null ) opts[name] = options[name];
    }
    
    bond.obj(self).run('findAll', args).callback(callback);

    skip += batchSize;
  }

  var done = function retrieveDone ( error, value ) {
    if ( !error ) {
      var value = value || [ ];

      if ( value.length > 0 ) {
        if ( onBatch ) onBatch(value);
      }

      if ( value.length == batchSize ) {
        bond.run(retrieve, self.collection).callback(done);
      }
      else if ( callback ) callback();
    }
    else if ( callback ) callback(error);
  }

  return bond.run(retrieve, this.collection).callback(done);
}


Collection.prototype.count = function count ( query, callback ) {
  return bond.obj(this.collection).run('count', query).callback(callback);
}


Collection.prototype.updateOne = function updateOne ( query, doc, callback) {
  var options = options || { multi: false, upsert: false, safe: true }

  return bond.obj(this.collection).run('update', [ query, doc, options ]).callback(callback);
}

Collection.prototype.updateAll = function updateAll ( query, doc, callback, Class ) {
  var options = options || { multi: true, upsert: false, safe: true }

  return bond.obj(this.collection).run('update', [ query, doc, options ]).callback(callback);
}


Collection.prototype.upsertOne = function upsertOne ( query, doc, callback) {
  var options = options || { multi: false, upsert: true, safe: true }

  return bond.obj(this.collection).run('update', [ query, doc, options ]).callback(callback);
}

Collection.prototype.upsertAll = function upsertAll ( query, doc, callback, Class ) {
  var options = options || { multi: true, upsert: true, safe: true }

  return bond.obj(this.collection).run('update', [ query, doc, options ]).callback(callback);
}


Collection.prototype.removeOne = function removeOne ( query, callback ) {
  return bond.obj(this.collection).run('remove', [ query, { single: true } ]).callback(callback);
}

Collection.prototype.removeAll = function removeAll ( query, callback ) {
  return bond.obj(this.collection).run('remove', [ query, { single: false } ]).callback(callback);
}


Collection.prototype.extend = function extend ( Class ) {
  var self = this;

  if ( !Class.save ) Class.save = this.save.bind(this);
  if ( !Class.remove ) Class.remove = this.remove.bind(this);
  if ( !Class.refresh ) Class.refresh = this.refresh.bind(this);

  if ( !Class.findOne ) Class.findOne = function findOne ( query, options, callback ) {
    self.findOne(query, options, callback, Class);
  }

  if ( !Class.findAll ) Class.findAll = function findAll ( query, options, callback ) {
    self.findAll(query, options, callback, Class);
  }

  if ( !Class.stream ) Class.stream = function stream ( query, options, batchCB, callback ) {
    self.stream(query, options, batchCB, callback, Class);
  }

  if ( !Class.count ) Class.count = this.count.bind(this);

  if ( !Class.updateOne ) Class.updateOne = this.updateOne.bind(this);
  if ( !Class.updateAll ) Class.updateAll = this.updateAll.bind(this);

  if ( !Class.upsertOne ) Class.upsertOne = this.upsertOne.bind(this);
  if ( !Class.upsertAll ) Class.upsertAll = this.upsertAll.bind(this);

  if ( !Class.removeOne ) Class.removeOne = this.removeOne.bind(this);
  if ( !Class.removeAll ) Class.removeAll = this.removeAll.bind(this);
}


Collection.wrap = function wrap ( collection ) {
  var wrapper = { }

  wrapper.save = Collection.wrap.save(collection);
  wrapper.remove = Collection.wrap.remove(collection);
  wrapper.refresh = Collection.wrap.refresh(collection);
  wrapper.valueOf = Collection.wrap.valueOf(collection);
  wrapper.toString = Collection.wrap.toString(collection);
  wrapper.toJSON = Collection.wrap.toJSON(collection);

  return wrapper;
}
Collection.wrap.save = function wrapSave ( collection ) {
  return function save ( callback ) { collection.save(this, callback); return this; }
}

Collection.wrap.remove = function wrapRemove ( collection ) {
  return function remove ( callback ) { collection.remove(this, callback); return this; }
}

Collection.wrap.refresh = function wrapRefresh ( collection ) {
  return function refresh ( callback ) { collection.refresh(this, callback); return this; }
}

Collection.wrap.valueOf = function wrapValueOf ( collection ) {
  return function valueOf ( ) { return this.doc; }
}

Collection.wrap.toString = function wrapToString ( collection ) {
  return function toString ( ) { return JSON.stringify(this.doc); }
}

Collection.wrap.toJSON = function wrapToJSON ( collection ) {
  return function toJSON ( ) { return this.doc; }
}


Collection.objectify = function objectify ( doc, collection, Class ) {
  if ( doc instanceof Array ) {
    var docs = [ ];

    for ( var i = 0; i < doc.length; i += 1 ) {
      docs.push(Collection.objectify(doc[i], collection, Class));
    }

    return docs;
  }

  return doc != null ? Class ? new Class(doc) : collection.create(doc) : null;
}
