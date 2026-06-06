const calculator = require('./calculator');
const parser = require('./parser');
const oanBrain = require('../../services/oanBrainService');

module.exports = {
  ...calculator,
  ...parser,
  buildFirstFreeSignalMessage: oanBrain.buildFirstFreeSignalMessage,
  buildSecondFreeSignalMessage: oanBrain.buildSecondFreeSignalMessage,
  buildFreeSignalsMessage: oanBrain.buildFreeSignalsMessage,
  buildSessionClosing: oanBrain.buildSessionClosing,
  getArchetype: oanBrain.getArchetype,
};
