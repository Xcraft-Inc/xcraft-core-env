'use strict';

var path = require ('path');

var xPlatform = require ('xcraft-core-platform');
var xConfig   = require ('xcraft-core-etc').load ('xcraft');


var init = function () {
  /* HACK: pkg-config */
  var arch = xPlatform.getToolchainArch ();
  process.env.PKG_CONFIG_PATH = path.join (xConfig.pkgTargetRoot, arch, 'usr/lib/pkgconfig');
};

init ();
