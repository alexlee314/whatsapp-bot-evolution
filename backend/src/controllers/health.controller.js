const { loadBrain } = require('../services/oanBrainService');
const HealthView = require('../views/HealthView');

function getHealth(req, res) {
  const brain = loadBrain();
  res.json(HealthView.toJson(brain));
}

module.exports = { getHealth };
