'use strict';

var fs   = require ('fs');
var path = require ('path');

var xPlatform = require ('xcraft-core-platform');
var xConfig   = require ('xcraft-core-etc') ().load ('xcraft');

const helpers = require ('../helpers.js');

var pathList = {
  xcraft:  [],
  devroot: []
};


var updatePath = function () {
  process.env.PATH = pathList.devroot.concat (pathList.xcraft).join (path.delimiter);

  /* HACK: add a `;` delimiter at then end otherwise the spawn function is not
   *       able to find the executable (in a sub process). Windows, wpkg or
   *       node bug? No idea.
   */
  if (xPlatform.getOs () === 'win') {
    process.env.PATH += path.delimiter;
  }
};

var init = function () {
  pathList.xcraft = [path.resolve ('./bin')];

  if (xConfig.hasOwnProperty ('path')) {
    xConfig.path.reverse ().forEach (function (location) {
      pathList.xcraft.unshift (location);
    });
  }

  pathList.xcraft.unshift (path.resolve ('./usr/bin'));
  pathList.xcraft.unshift (path.resolve ('.'));
  pathList.xcraft.unshift (path.resolve ('./node_modules/.bin'));

  updatePath ();
};

exports.devrootUpdate = function () {
  var xFs = require ('xcraft-core-fs');

  var arch = xPlatform.getToolchainArch ();
  const rootDir = path.join (xConfig.pkgTargetRoot, arch);

  pathList.devroot.length = 0;
  pathList.devroot.unshift (path.join (rootDir, 'usr/bin'));
  pathList.devroot.unshift (path.join (rootDir, 'bin'));

  var length = pathList.devroot.length;

  var dir = path.join (xConfig.pkgTargetRoot, arch, 'etc/env/path');
  try {
    xFs.ls (dir).forEach (function (item) {
      var location = JSON.parse (fs.readFileSync (path.join (dir, item), 'utf8'));
      location.forEach (function (entry) {
        entry = helpers.injectPh (entry);

        if (!path.isAbsolute (entry)) {
          entry = path.join (xConfig.pkgTargetRoot, arch, entry);
        }

        pathList.devroot.unshift (entry);
      });
    });
  } catch (ex) {
    pathList.devroot.length = length;
  }

  updatePath ();
};

/**
 * Unshift a new location in the PATH.
 *
 * The new location will be at the top.
 *
 * @param {string} location
 */
exports.unshift = function (location) {
  location = path.resolve (location);
  if (pathList.xcraft.indexOf (location) !== -1) {
    return;
  }

  pathList.xcraft.unshift (location);
  updatePath ();
};

/**
 * Push a new location in the PATH.
 *
 * The new location will be at the bottom.
 *
 * @param {string} location
 */
exports.push = function (location) {
  location = path.resolve (location);
  if (pathList.xcraft.indexOf (location) !== -1) {
    return;
  }

  pathList.xcraft.push (location);
  updatePath ();
};

/**
 * Look for a file in the PATH.
 *
 * In most of cases it should be an executable, but this function looks only
 * if the file exists. The full name must be used. For example on Windows, the
 * extension (like exe) is mandatory.
 *
 * @param {string} bin
 * @returns {Object} The index and the location.
 */
exports.isIn = function (bin) {
  var fullLocation = null;
  var position = 0;

  var exists = ['devroot', 'xcraft'].some (function (item) {
    return pathList[item].some (function (location, index) {
      fullLocation = path.join (location, bin);
      position     = item === 'xcraft' ? index : -1;
      return fs.existsSync (fullLocation);
    });
  });

  return exists ? {
    index: position,
    location: fullLocation
  } : null;
};

/**
 * Strip an entry in the Xcraft PATH.
 *
 * @param {number} index
 * @returns {string|null} The stripped location.
 */
exports.strip = function (index) {
  if (index < 0) {
    return null;
  }

  var location = pathList.xcraft.splice (index, 1)[0];
  updatePath ();
  return location;
};

/**
 * Insert a location in the Xcraft PATH.
 *
 * @param {number} index
 * @param {string} location
 */
exports.insert = function (index, location) {
  if (index < 0) {
    return;
  }

  pathList.xcraft.splice (index, 0, location);
  updatePath ();
};

/**
 * Get all locations available in PATH.
 *
 * @returns {string[]} The current PATH.
 */
exports.getList = function () {
  return pathList.devroot.concat (pathList.xcraft).slice ();
};

init ();
