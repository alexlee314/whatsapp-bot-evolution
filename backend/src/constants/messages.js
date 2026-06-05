const {
  getWelcomeMessages,
  pickRandom,
  getMinorRejectedMessage,
  getPaymentConfirmedMessage,
  getPaymentFreezeMessage,
  buildFreeSignalsMessage,
  buildPaymentWallMessage,
  buildGreetAndPaymentMessage,
  buildSessionClosing,
} = require('../services/oanBrainService');

const MESSAGES = {
  get greetAndPayment() {
    return buildGreetAndPaymentMessage();
  },

  get welcome() {
    return pickRandom(getWelcomeMessages());
  },

  minorRejected: getMinorRejectedMessage(),

  paymentConfirmed: getPaymentConfirmedMessage(),

  birthDateRequired:
    'Por favor, compárteme tu *fecha de nacimiento* y, si quieres, tu *hora* y *ciudad* en un solo mensaje ✨ (ej.: 4 de mayo 1980, 3pm, Lima).',

  birthDateInvalid:
    'No logré leer tu fecha. Escríbela como prefieras — en español o inglés — y puedes incluir hora y ciudad en el mismo mensaje ✨ (ej.: 4 de mayo 1980, 3pm, Lima · 4 of may 1980 born at noon in Cusco).',

  get paymentScreenshotRequired() {
    return getPaymentFreezeMessage();
  },

  paymentValidating: '⏳ Estoy revisando tu constancia de Yape, un momentito...',

  paymentInvalidDefault:
    'No pude validar tu comprobante. Debe verse monto *S/ 4.90* o más, destino *952 989 503* y operación exitiva. Envíala de nuevo ✨.',

  paymentInvalidAmount:
    'El monto debe ser *S/ 4.90* o superior. Revisa tu captura y envíala de nuevo ✨.',

  paymentInvalidDestination:
    'El Yape debe estar dirigido al *952 989 503*. Verifica la captura y envíala otra vez ✨.',

  activeSessionPrompt:
    'Cuéntame qué deseas explorar: amor, trabajo, dinero, salud, estudios o familia ✨.',

  openaiError:
    'Disculpa, en este momento tengo dificultad para responderte. Intenta de nuevo en un momentito ✨',
};

function sessionTimeWarning(minutesLeft) {
  return `\n\n⏰ _Te quedan ${minutesLeft} minutos de sesión._`;
}

module.exports = {
  MESSAGES,
  sessionTimeWarning,
  buildFreeSignalsMessage,
  buildPaymentWallMessage,
  buildGreetAndPaymentMessage,
  buildSessionClosing,
};
