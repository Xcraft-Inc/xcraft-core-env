'use strict';

const path = require ('path');

const xPh       = require ('xcraft-core-placeholder');
const xPlatform = require ('xcraft-core-platform');
const xConfig   = require ('xcraft-core-etc').load ('xcraft');


class Helpers {
  static injectPh (data) {
    let ph = new xPh.Placeholder ();

    const arch = xPlatform.getToolchainArch ();
    const rootDir = path.join (xConfig.pkgTargetRoot, arch);

    ph.set ('ROOTDIR', rootDir);

    if (process.env['ProgramFiles(x86)'] || process.env.ProgramFiles) {
      ph.set ('PROGRAMFILES.32', process.env['ProgramFiles(x86)'] || process.env.ProgramFiles)
        .set ('PROGRAMFILES.64', process.env['ProgramFiles(x86)'] ?  process.env.ProgramFiles : '');
    }

    return ph.inject ('OS', data);
  }
}

module.exports = Helpers;
