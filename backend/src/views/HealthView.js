function toJson(brain) {
  return {
    ok: true,
    service: 'oraculo-andino-bot',
    brainVersion: brain.version,
    brainLoaded: true,
  };
}

module.exports = { toJson };
