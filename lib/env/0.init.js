'use strict';

const which = require('which');
const {execSync} = require('child_process');

exports.devrootUpdate = () => {
  /* Provide the current SDKROOT for having a working clang compiler */
  try {
    which.sync('xcrun');
    const sdkRoot = execSync('xcrun --show-sdk-path')
      .toString()
      .trim();
    process.env.SDKROOT = sdkRoot;
  } catch (ex) {
    /* ignore */
  }
};
