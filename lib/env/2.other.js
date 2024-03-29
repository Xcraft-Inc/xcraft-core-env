'use strict';

const fs = require('fs');
const path = require('path');

const xPlatform = require('xcraft-core-platform');
const xConfig = require('xcraft-core-etc')().load('xcraft');

const helpers = require('../helpers.js');

exports.devrootUpdate = function (distribution) {
  const xFs = require('xcraft-core-fs');

  const arch = xPlatform.getToolchainArch();
  const dir = path.join(xConfig.pkgTargetRoot, arch, 'etc/env/other');

  const xcraftEnv = {};
  let oXcraftEnv = {};
  if (process.env.XCRAFT_ENV) {
    oXcraftEnv = JSON.parse(process.env.XCRAFT_ENV);
  }

  if (distribution !== 'bootstrap') {
    try {
      xFs.ls(dir).forEach((item) => {
        const other = JSON.parse(fs.readFileSync(path.join(dir, item), 'utf8'));

        Object.keys(other).forEach((key) => {
          const value = helpers.injectPh(`${other[key]}`, distribution);
          process.env[`${key}`] = `${value}`;
          xcraftEnv[`${key}`] = item;
        });
      });
    } catch (ex) {
      if (ex.code !== 'ENOENT') {
        console.log(ex.stack || ex);
      }
    }
  }

  /* Remove entries that are no longer available in etc/env/other */
  for (const key in oXcraftEnv) {
    if (!xcraftEnv[key]) {
      delete process.env[key];
    }
  }

  if (!process.env.CCACHE_PATH) {
    /* Ensure that host ccache can find the host compiler. */
    process.env.CCACHE_PATH = process.env.XCRAFT_CCACHE_PATH;
  }

  process.env.XCRAFT_ENV = JSON.stringify(xcraftEnv);
};
