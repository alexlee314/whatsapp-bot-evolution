const { withTimeout } = require('./withTimeout');

const chains = new Map();
const LOCK_WAIT_MS = Number(process.env.MESSAGE_LOCK_WAIT_MS) || 25_000;
const LOCK_RUN_MS = Number(process.env.MESSAGE_LOCK_RUN_MS) || 45_000;

async function withUserLock(userId, fn) {
  const key = String(userId || '');
  const previous = chains.get(key) || Promise.resolve();

  const run = withTimeout(previous.catch(() => {}), LOCK_WAIT_MS, 'Previous message')
    .catch(() => {})
    .then(() => withTimeout(Promise.resolve().then(fn), LOCK_RUN_MS, 'Message processing'));

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
