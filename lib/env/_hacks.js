'use strict';

var path = require ('path');

var xPlatform = require ('xcraft-core-platform');
var xConfig   = require ('xcraft-core-etc').load ('xcraft');


var init = function () {
  /* HACK: pkg-config and autom4te must be handled by an etc/ file. */
  var arch = xPlatform.getToolchainArch ();
  /* pkg-config */
  process.env.PKG_CONFIG_PATH     = path.join (xConfig.pkgTargetRoot, arch, 'usr/lib/pkgconfig');

  /* autoconf */
  process.env.AUTOCONF            = path.join (xConfig.pkgTargetRoot, arch, 'usr/bin/autoconf');
  process.env.AUTOHEADER          = path.join (xConfig.pkgTargetRoot, arch, 'usr/bin/autoheader');
  process.env.AUTOM4TE            = path.join (xConfig.pkgTargetRoot, arch, 'usr/bin/autom4te');
  process.env.autom4te_perllibdir = path.join (xConfig.pkgTargetRoot, arch, 'usr/share/autoconf');
  process.env.AC_MACRODIR         = path.join (xConfig.pkgTargetRoot, arch, 'usr/share/autoconf');
};

init ();
