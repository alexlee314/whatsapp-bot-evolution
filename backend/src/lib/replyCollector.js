let activeCollector = null;

function withReplyCollector(fn) {
  const replies = [];
  activeCollector = (to, text) => replies.push({ to, text });

  return Promise.resolve(fn())
    .then((result) => ({ replies, result }))
    .finally(() => {
      activeCollector = null;
    });
}

function recordReply(to, text) {
  if (activeCollector) {
    activeCollector(to, text);
  }
}

module.exports = { withReplyCollector, recordReply };
