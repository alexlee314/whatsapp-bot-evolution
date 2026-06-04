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
    'Por favor, compárteme tu *fecha de nacimiento* y tu *ciudad o distrito* (ejemplo: 14/02/1995, Lima) ✨.',

  birthDateInvalid:
    'No logré leer tu fecha. Escríbela así: *día/mes/año* y agrega tu ciudad (ejemplo: 14/02/1995, Lima) ✨.',

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
