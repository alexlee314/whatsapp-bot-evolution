const {
  buildPaidSessionSystemPrompt,
  buildKnowledgeSourceGuard,
  buildEmbeddedKnowledgeContext,
  loadBrain,
  loadInstruction,
  BRAIN_PATH,
  INSTRUCTION_PATH,
} = require('./oanBrainService');

/** Official knowledge sources — no web or external docs. */
const OFFICIAL_SOURCES = [BRAIN_PATH, INSTRUCTION_PATH];

function loadKnowledgeBase() {
  return loadBrain();
}

module.exports = {
  loadKnowledgeBase,
  buildPaidSessionSystemPrompt,
  buildKnowledgeSourceGuard,
  buildEmbeddedKnowledgeContext,
  OFFICIAL_SOURCES,
  KNOWLEDGE_PATH: BRAIN_PATH,
  INSTRUCTION_PATH,
};
