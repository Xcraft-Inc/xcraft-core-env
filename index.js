'use strict';

var path = require ('path');
var xFs  = require ('xcraft-core-fs');

var envRoot = path.join (__dirname, 'lib/env');
var env = {};
var envList = xFs.ls (envRoot, /\.js$/);

envList.forEach (function (file) {
  var name = file.replace (/\.js$/, '');
  env[name] = require (path.join (envRoot, file));
});

exports.devrootUpdate = function () {
  Object.keys (env).forEach (function (key) {
    if (env[key].hasOwnProperty ('devrootUpdate')) {
      env[key].devrootUpdate ();
    }
  });
};

exports.var = env;
