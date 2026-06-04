function normalizeWhatsAppNumber(jid) {
  return String(jid).replace('whatsapp:', '').replace('+', '');
}

function normalizeDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

module.exports = { normalizeWhatsAppNumber, normalizeDigits };
