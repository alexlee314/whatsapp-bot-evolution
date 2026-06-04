const {
  buildPaidSessionSystemPrompt,
  loadBrain,
  loadInstruction,
  BRAIN_PATH,
  INSTRUCTION_PATH,
} = require('./oanBrainService');

function loadKnowledgeBase() {
  return loadBrain();
}

module.exports = {
  loadKnowledgeBase,
  buildPaidSessionSystemPrompt,
  KNOWLEDGE_PATH: BRAIN_PATH,
  INSTRUCTION_PATH,
};
