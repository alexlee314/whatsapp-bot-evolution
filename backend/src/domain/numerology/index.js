const calculator = require('./calculator');
const parser = require('./parser');
const oanBrain = require('../../services/oanBrainService');

module.exports = {
  ...calculator,
  ...parser,
  buildFreeSignalsMessage: oanBrain.buildFreeSignalsMessage,
  buildSessionClosing: oanBrain.buildSessionClosing,
  getArchetype: oanBrain.getArchetype,
};
