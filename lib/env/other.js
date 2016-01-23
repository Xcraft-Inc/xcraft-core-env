'use strict';

const fs   = require ('fs');
const path = require ('path');

const xPlatform = require ('xcraft-core-platform');
const xConfig   = require ('xcraft-core-etc').load ('xcraft');


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
