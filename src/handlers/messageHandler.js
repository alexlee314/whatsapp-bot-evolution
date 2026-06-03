const { getSession, createSession, updateSession, endSession } = require('../services/sessionService');
const { sendMessage } = require('../services/evolutionService');
const { validatePaymentImage } = require('../services/ocrService');
const { chatWithGPT } = require('../services/openaiService');

// USER STATES
const STATE = {
  NEW: 'NEW',
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  ACTIVE: 'ACTIVE',
};

async function handleIncomingMessage(req, res) {
  res.status(200).send('ok');

  // Evolution API webhook payload structure
  const event = req.body;

  // Only handle incoming messages
  if (event.event !== 'messages.upsert') return;

  const message = event.data?.message;
  if (!message) return;

  // Ignore messages sent by the bot itself
  if (event.data?.key?.fromMe) return;

  const from = event.data?.key?.remoteJid; // e.g. 51952989503@s.whatsapp.net
  const body = message?.conversation || message?.extendedTextMessage?.text || '';

  // Check for image
  const hasImage = !!message?.imageMessage;
  const imageData = hasImage ? message.imageMessage : null;

  const session = await getSession(from);

  // ── STEP 1: New user ─────────────────────────────────────────
  if (!session || session.state === STATE.NEW) {
    await createSession(from, STATE.AWAITING_PAYMENT);
    await sendMessage(from,
      `👋 Hello! Welcome to our service.\n\n` +
      `To get started, please make a payment via Yape to the number: *+51 952 989 503*\n\n` +
      `Once done, send a screenshot of your payment receipt here and we'll activate your 1-hour session immediately. ✅`
    );
    return;
  }

  // ── STEP 2: Awaiting payment image ───────────────────────────
  if (session.state === STATE.AWAITING_PAYMENT) {
    if (!hasImage) {
      await sendMessage(from,
        `📸 Please send a *screenshot* of your Yape payment to continue.`
      );
      return;
    }

    await sendMessage(from, `⏳ Validating your payment, please wait a moment...`);

    // Pass image message data to OCR service
    const validation = await validatePaymentImage(imageData, from);

    if (!validation.isValid) {
      await sendMessage(from,
        `❌ We couldn't validate your payment from the image.\n\n` +
        `Please make sure the screenshot clearly shows:\n` +
        `• Payment amount\n• Date\n• Transaction reference\n\n` +
        `Then send the screenshot again.`
      );
      return;
    }

    // Payment accepted — start 1 hour session
    const expiresAt = Date.now() + 60 * 60 * 1000;
    await updateSession(from, {
      state: STATE.ACTIVE,
      expiresAt,
      paymentData: validation.data,
      messages: [],
    });

    setTimeout(() => endSessionGracefully(from), 60 * 60 * 1000);

    await sendMessage(from,
      `✅ Payment confirmed!\n\n` +
      `Amount: *${validation.data.amount || 'detected'}*\n` +
      `Your 1-hour session has started. 🚀\n\n` +
      `How can I help you today?`
    );
    return;
  }

  // ── STEP 3: Active session — chat with GPT ───────────────────
  if (session.state === STATE.ACTIVE) {
    if (Date.now() > session.expiresAt) {
      await endSessionGracefully(from);
      return;
    }

    const timeLeft = Math.round((session.expiresAt - Date.now()) / 60000);

    session.messages.push({ role: 'user', content: body });

    const reply = await chatWithGPT(session.messages);

    session.messages.push({ role: 'assistant', content: reply });
    await updateSession(from, { messages: session.messages });

    const warning = timeLeft <= 10
      ? `\n\n⏰ _${timeLeft} minutes remaining in your session._`
      : '';

    await sendMessage(from, reply + warning);
    return;
  }
}

async function endSessionGracefully(from) {
  await endSession(from);
  await sendMessage(from,
    `⏱️ Your 1-hour session has ended. Thank you for using our service!\n\n` +
    `Send any message to start a new session. 👋`
  );
}

module.exports = { handleIncomingMessage };
