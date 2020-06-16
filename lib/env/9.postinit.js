'use strict';

const which = require('which');
const {execSync} = require('child_process');

const vars = require('../vars.js');

const isNotSet = (v) => vars[v] && !process.env[v];

exports.devrootUpdate = () => {
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
