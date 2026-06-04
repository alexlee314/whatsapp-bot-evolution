function normalizeWhatsAppFrom(from) {
  const value = String(from || '').trim();
  // form-urlencoded treats "+" as space — restore E.164 prefix
  if (/^whatsapp:\s*\d/.test(value)) {
    return `whatsapp:+${value.replace(/^whatsapp:\s*/, '')}`;
  }
  if (value.startsWith('whatsapp:') && !value.startsWith('whatsapp:+')) {
    return `whatsapp:+${value.slice('whatsapp:'.length)}`;
  }
  return value;
}

function parseTwilioWebhook(body) {
  if (!body || !body.From) {
    return null;
  }

  // Twilio status callbacks — no user message to process
  if (body.MessageStatus && !body.Body && Number(body.NumMedia || 0) === 0) {
    return null;
  }

  const from = normalizeWhatsAppFrom(body.From);
  const text = (body.Body || '').trim();
  const numMedia = Number(body.NumMedia || 0);
  const hasImage = numMedia > 0 && Boolean(body.MediaUrl0);

  return {
    from,
    text,
    hasImage,
    media: hasImage
      ? {
          url: body.MediaUrl0,
          contentType: body.MediaContentType0 || 'image/jpeg',
        }
      : null,
  };
}

module.exports = { parseTwilioWebhook };
