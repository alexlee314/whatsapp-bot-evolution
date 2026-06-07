const {
  buildPaidSessionSystemPrompt,
  buildKnowledgeSourceGuard,
  buildEmbeddedKnowledgeContext,
  loadBrain,
  loadInstruction,
  loadAstroDictionary,
  BRAIN_PATH,
  INSTRUCTION_PATH,
  ASTRO_DICT_PATH,
} = require('./oanBrainService');

/** Official knowledge sources — no web or external docs. */
const OFFICIAL_SOURCES = [BRAIN_PATH, INSTRUCTION_PATH, ASTRO_DICT_PATH];

function loadKnowledgeBase() {
  return loadBrain();
}

module.exports = {
  loadKnowledgeBase,
  loadAstroDictionary,
  buildPaidSessionSystemPrompt,
  buildKnowledgeSourceGuard,
  buildEmbeddedKnowledgeContext,
  OFFICIAL_SOURCES,
  KNOWLEDGE_PATH: BRAIN_PATH,
  INSTRUCTION_PATH,
  ASTRO_DICT_PATH,
};
