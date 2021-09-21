'use strict';

const path = require('path');

const xPh = require('xcraft-core-placeholder');
const xPlatform = require('xcraft-core-platform');
const xConfig = require('xcraft-core-etc')().load('xcraft');

class Helpers {
  static injectPh(data, distribution) {
    const xPacman = require('xcraft-contrib-pacman');
    let ph = new xPh.Placeholder();

    const arch = xPlatform.getToolchainArch();
    const rootDir = path.join(xConfig.pkgTargetRoot, arch);
    const targetRoot = path.join(xPacman.getTargetRoot(distribution), arch); /* Should be exported by an other module */

    ph.set('NAME', process.platform)
      .set('ARCH', process.arch)
      .set('ARCH2', xPlatform.getArchVariant(process.arch))
      .set('WPKG.ARCH', arch)
      .set('ROOTDIR', rootDir)
      .set('PROD.ROOTDIR', targetRoot)
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
