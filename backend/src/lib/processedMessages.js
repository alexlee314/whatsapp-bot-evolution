const TTL_MS = 24 * 60 * 60 * 1000;
const seen = new Map();

function prune(now = Date.now()) {
  for (const [sid, expiresAt] of seen) {
    if (expiresAt <= now) seen.delete(sid);
  }
}

function isDuplicateMessageSid(messageSid) {
  if (!messageSid) return false;

  prune();

  if (seen.has(messageSid)) return true;

  seen.set(messageSid, Date.now() + TTL_MS);
  return false;
}

module.exports = { isDuplicateMessageSid };
