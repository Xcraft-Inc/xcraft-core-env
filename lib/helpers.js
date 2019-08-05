'use strict';

const path = require('path');

const xPh = require('xcraft-core-placeholder');
const xPlatform = require('xcraft-core-platform');
const xConfig = require('xcraft-core-etc')().load('xcraft');

class Helpers {
  static injectPh(data) {
    let ph = new xPh.Placeholder();

    const arch = xPlatform.getToolchainArch();
    const rootDir = path.join(xConfig.pkgTargetRoot, arch);

    let arch2 = arch;
    switch (process.arch) {
      case 'x32':
        arch2 = 'x86_32';
        break;
      case 'x64':
        arch2 = 'x86_64';
        break;
    }

    ph.set('NAME', process.platform)
      .set('ARCH', process.arch)
      .set('ARCH2', arch2)
      .set('WPKG_ARCH', arch)
      .set('ROOTDIR', rootDir)
      .set('ENV', process.env)
      .set('ROOTTEMP', xConfig.tempRoot)
      .set(
        'ROOTDRIVE',
        xPlatform.getOs() === 'win' ? rootDir.split(path.sep)[0] : '/'
      );

    if (process.env['ProgramFiles(x86)'] || process.env.ProgramFiles) {
      ph.set(
        'PROGRAMFILES.32',
        process.env['ProgramFiles(x86)'] || process.env.ProgramFiles
      ).set(
        'PROGRAMFILES.64',
        process.env['ProgramFiles(x86)'] ? process.env.ProgramFiles : ''
      );
    }

    return ph.inject('OS', data);
  }
}

module.exports = Helpers;
