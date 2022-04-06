'use strict';

const path = require('path');
const which = require('which');
const {execSync} = require('child_process');
const xConfig = require('xcraft-core-etc')().load('xcraft');

const vars = require('../vars.js');

const isNotSet = (v) => vars[v] && !process.env[v];

exports.devrootUpdate = () => {
  process.env.npm_config_cache = path.join(xConfig.tempRoot, 'npm-cache');
  process.env.TMP = process.env.TEMP = path.join(xConfig.tempRoot, 'system');

  if (isNotSet('HOME') && process.env.USERPROFILE) {
    process.env.HOME = process.env.USERPROFILE;
  }

  if (isNotSet('SDKROOT')) {
    /* Provide the current SDKROOT for having a working clang compiler */
    try {
      which.sync('xcrun');
      const sdkRoot = execSync('xcrun --show-sdk-path').toString().trim();
      process.env.SDKROOT = sdkRoot;
    } catch (ex) {
      /* ignore */
    }
  }

  /* Provide default optimization flags until a package override */
  if (isNotSet('CFLAGS')) {
    process.env.CFLAGS = '-O2 -g0 -fPIC';
  }
  if (isNotSet('CXXFLAGS')) {
    process.env.CXXFLAGS = '-O2 -g0 -fPIC';
  }

  if (isNotSet('LDFLAGS')) {
    try {
      if (
        execSync('gcc -v 2>&1 | grep -c "gcc version"').toString().trim() ===
        '1'
      ) {
        process.env.LDFLAGS = '-static-libgcc -static-libstdc++';
      }
    } catch (ex) {
      /* ignore */
    }
  }
};
