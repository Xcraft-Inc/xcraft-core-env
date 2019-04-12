'use strict';

const which = require('which');
const {execSync} = require('child_process');

exports.devrootUpdate = () => {
  /* Provide the current SDKROOT for having a working clang compiler */
  if (which.sync('xcrun')) {
    try {
      const sdkRoot = execSync('xcrun --show-sdk-path')
        .toString()
        .trim();
      process.env.SDKROOT = sdkRoot;
    } catch (ex) {
      /* ignore SDKROOT otherwise */
    }
  }
};
