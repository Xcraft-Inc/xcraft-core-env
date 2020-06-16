'use strict';

const vars = require('../vars.js');

exports.devrootUpdate = () => {
  Object.keys(vars).forEach((v) => delete process.env[v]);
};
