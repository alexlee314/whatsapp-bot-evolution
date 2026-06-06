const chains = new Map();

async function withUserLock(userId, fn) {
  const key = String(userId || '');
  const previous = chains.get(key) || Promise.resolve();

  const run = previous.catch(() => {}).then(fn);
  chains.set(key, run);

  try {
    return await run;
  } finally {
    if (chains.get(key) === run) {
      chains.delete(key);
    }
  }
}

module.exports = { withUserLock };
