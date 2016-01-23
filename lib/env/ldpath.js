'use strict';

var fs   = require ('fs');
var path = require ('path');

var xPlatform = require ('xcraft-core-platform');
var xConfig   = require ('xcraft-core-etc').load ('xcraft');

var typeList = [];
var envLdPath = {};
var ldPathList = {
  xcraft:  {},
  devroot: {}
};


var updateLdPath = function () {
  if (envLdPath.hasOwnProperty ('posix')) {
    process.env.LD_LIBRARY_PATH = ldPathList.devroot.posix.concat (ldPathList.xcraft.posix).join (path.delimiter);
  }
  if (envLdPath.hasOwnProperty ('darwin')) {
    process.env.DYLD_LIBRARY_PATH = ldPathList.devroot.darwin.concat (ldPathList.xcraft.darwin).join (path.delimiter);
  }
};

var init = function () {
  if (xPlatform.getOs () !== 'win') {
    typeList.push ('posix');
    envLdPath.posix = process.env.LD_LIBRARY_PATH || '';
    ldPathList.xcraft.posix = envLdPath.posix.split (path.delimiter);
    ldPathList.devroot.posix = [];
  }
  if (xPlatform.getOs () === 'darwin') {
    typeList.push ('darwin');
    envLdPath.darwin = process.env.DYLD_LIBRARY_PATH || '';
    ldPathList.xcraft.darwin = envLdPath.darwin.split (path.delimiter);
    ldPathList.devroot.darwin = [];
  }

  if (xConfig.hasOwnProperty ('ldPath')) {
    typeList.forEach (function (type) {
      if (!xConfig.hasOwnProperty (type)) {
        return;
      }

      xConfig.ldPath[type].reverse ().forEach (function (location) {
        ldPathList.xcraft[type].unshift (location);
      });
    });
  }

  typeList.forEach (function (type) {
    ldPathList.xcraft[type].unshift (path.resolve ('./usr/lib'));
  });

  updateLdPath ();
};

exports.devrootUpdate = function () {
  var xFs = require ('xcraft-core-fs');

  var arch = xPlatform.getToolchainArch ();

  typeList.forEach (function (type) {
    ldPathList.devroot[type].length = 0;
    ldPathList.devroot[type].unshift (path.join (xConfig.pkgTargetRoot, arch, 'usr/lib'));
    ldPathList.devroot[type].unshift (path.join (xConfig.pkgTargetRoot, arch, 'lib'));

    var length = ldPathList.devroot[type].length;

    var dir = path.join (xConfig.pkgTargetRoot, arch, 'etc/env/ldpath');
    try {
      xFs.ls (dir).forEach (function (item) {
        var location = JSON.parse (fs.readFileSync (path.join (dir, item), 'utf8'));
        location.forEach (function (entry) {
          if (!path.isAbsolute (entry)) {
            entry = path.join (xConfig.pkgTargetRoot, arch, entry);
          }

          ldPathList.devroot[type].unshift (entry);
        });
      });
    } catch (ex) {
      ldPathList.devroot[type].length = length;
    }
  });

  updateLdPath ();
};

init ();
