const TTL_MS = 24 * 60 * 60 * 1000;
const completed = new Map();
const inFlight = new Map();
const IN_FLIGHT_MAX_MS = 90_000;

function prune(map, now = Date.now()) {
  for (const [sid, expiresAt] of map) {
    if (expiresAt <= now) map.delete(sid);
  }
}

function isDuplicateMessageSid(messageSid) {
  if (!messageSid) return false;
  prune(completed);
  return completed.has(messageSid);
}

function isMessageSidInFlight(messageSid) {
  if (!messageSid) return false;

  const startedAt = inFlight.get(messageSid);
  if (!startedAt) return false;

  if (Date.now() - startedAt > IN_FLIGHT_MAX_MS) {
    inFlight.delete(messageSid);
    return false;
  }

  return true;
}

function beginMessageSid(messageSid) {
  if (!messageSid) return;
  inFlight.set(messageSid, Date.now());
}

function completeMessageSid(messageSid) {
  if (!messageSid) return;
  inFlight.delete(messageSid);
  completed.set(messageSid, Date.now() + TTL_MS);
}

function failMessageSid(messageSid) {
  if (!messageSid) return;
  inFlight.delete(messageSid);
}

module.exports = {
  isDuplicateMessageSid,
  isMessageSidInFlight,
  beginMessageSid,
  completeMessageSid,
  failMessageSid,
};
