function toTestResponse({ incoming, replies, session }) {
  return {
    ok: true,
    processed: true,
    from: incoming.from,
    input: {
      text: incoming.text,
      hasImage: incoming.hasImage,
    },
    replies,
    session: session
      ? {
          state: session.state,
          birthDate: session.birthDate,
          location: session.location,
          lifePath: session.numerology?.lifePath ?? null,
        }
      : null,
  };
}

function toError(message) {
  return {
    ok: false,
    processed: false,
    error: message,
  };
}

function toTwimlEmpty() {
  return '<Response></Response>';
}

module.exports = { toTestResponse, toError, toTwimlEmpty };
