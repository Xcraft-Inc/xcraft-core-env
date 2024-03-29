'use strict';

var path = require('path');
var xFs = require('xcraft-core-fs');
const xPlatform = require('xcraft-core-platform');

var envRoot = path.join(__dirname, 'lib/env');
var env = {};
var envList = xFs.ls(envRoot, /\.js$/).sort();

envList.forEach(function (file) {
  var name = file.replace(/^[0-9]+\.(.*)\.js$/, '$1');
  env[name] = require(path.join(envRoot, file));
});

/* FIXME: this function should be called by a file watcher but most file
 *        watchers are bugged on Windows like:
 *          node-watch, gaze < 0.6, watchr, chokidar, ...
 *        When a directory is removed, it is unstable or it breaks with a stupid
 *        EPERM exception. Maybe it works with gaze >= 0.6, but it needs
 *        the native compiler and something is broken with node >= 0.12.
 */
exports.devrootUpdate = function (distribution) {
  Object.keys(env).forEach(function (key) {
    if (env[key].devrootUpdate) {
      env[key].devrootUpdate(distribution);
    }
  });
};

exports.var = env;

/* Preprocess environment for pacman rules.env variables */
exports.pp = (env) =>
  Object.keys(env)
    .filter((key) => {
      if (key.indexOf('/') === -1) {
        return true;
      }
      const [os, arch] = key.split('/')[0].split('-');
      if (arch && arch !== xPlatform.getArch()) {
        return false;
      }
      return os === xPlatform.getOs();
    })
    .reduce((out, key) => {
      out[key.replace(/^[^/]+[/]/, '')] = env[key];
      return out;
    }, {});
