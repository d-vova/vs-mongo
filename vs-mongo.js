var DB = require('./lib/DB');


var connect = exports.connect = function connect ( uri, config ) {
  return new DB(uri, config).connect();
}


var log = exports.log = function log ( shouldLog ) {
  DB.log.isOn = shouldLog;
}

log.on = function logOn ( ) {
  DB.log.isOn = true;
}

log.off = function logOff ( ) {
  DB.log.isOn = false;
}


if ( require.main === module && process.argv[2] == 'test' ) {
  var exec = require('child_process').exec;

  var log = function log ( error, value ) {
    console.log(error || value);
  }

  exec('node lib/DB.js', log);
}
