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
  const mediaUrl = body.MediaUrl0 || body.mediaUrl0;
  const hasImage = numMedia > 0 && Boolean(mediaUrl);
  const messageSid = body.MessageSid || body.SmsMessageSid || null;

  if (numMedia > 0 && !mediaUrl) {
    console.warn('Twilio webhook: NumMedia>0 but MediaUrl0 missing', { from, messageSid });
  }

  return {
    from,
    text,
    hasImage,
    messageSid,
    media: hasImage
      ? {
          url: mediaUrl,
          contentType: body.MediaContentType0 || body.mediaContentType0 || 'image/jpeg',
        }
      : null,
  };
}

module.exports = { parseTwilioWebhook };
