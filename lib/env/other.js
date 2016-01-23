'use strict';

const fs   = require ('fs');
const path = require ('path');

const xPlatform = require ('xcraft-core-platform');
const xConfig   = require ('xcraft-core-etc').load ('xcraft');


/* FIXME: this function should be called by a file watcher but most file
 *        watchers are bugged on Windows like:
 *          node-watch, gaze < 0.6, watchr, chokidar, ...
 *        When a directory is removed, it is unstable or it breaks with a stupid
 *        EPERM exception. Maybe it works with gaze >= 0.6, but it needs
 *        the native compiler and something is broken with node >= 0.12.
 */
exports.devrootUpdate = function () {
  const xFs = require ('xcraft-core-fs');

  const arch = xPlatform.getToolchainArch ();
  const dir = path.join (xConfig.pkgTargetRoot, arch, 'etc/env/other');

  xFs.ls (dir).forEach (item => {
    const other = JSON.parse (fs.readFileSync (path.join (dir, item), 'utf8'));

    Object
      .keys (other)
      .forEach (key => {
        process.env[key] = other[key];
      });
  });
};
