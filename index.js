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

/* FIXME: this function should be called by a file watcher but most file
 *        watchers are bugged on Windows like:
 *          node-watch, gaze < 0.6, watchr, chokidar, ...
 *        When a directory is removed, it is unstable or it breaks with a stupid
 *        EPERM exception. Maybe it works with gaze >= 0.6, but it needs
 *        the native compiler and something is broken with node >= 0.12.
 */
exports.devrootUpdate = function () {
  Object.keys (env).forEach (function (key) {
    if (env[key].hasOwnProperty ('devrootUpdate')) {
      env[key].devrootUpdate ();
    }
  });
};

exports.var = env;
