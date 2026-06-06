const {
  getWelcomeMessages,
  pickRandom,
  getMinorRejectedMessage,
  getPaymentConfirmedMessage,
  getPaymentFreezeMessage,
  buildFirstFreeSignalMessage,
  buildSecondFreeSignalMessage,
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
    'Cuando estés listo, compárteme tu *fecha de nacimiento* junto a tu *ciudad actual*, y comenzaremos a observar tus señales ✨.',

  birthDateInvalid:
    'No logré leer tu fecha. Escríbela como prefieras — en español o inglés — y puedes incluir hora y ciudad en el mismo mensaje ✨ (ej.: 4 de mayo 1980, 3pm, Lima · 4 of may 1980 born at noon in Cusco).',

  get paymentScreenshotRequired() {
    return getPaymentFreezeMessage();
  },

  paymentValidating: '⏳ Estoy revisando tu comprobante de pago (Yape o Plin), un momentito...',

  paymentInvalidDefault:
    'No pude validar tu comprobante. Debe ser captura exitosa de *Yape* o *Plin*, monto *S/ 4.90* o más, destino Yape terminado en *503* (*952 989 503*) y operación visible. Envíala de nuevo ✨.',

  paymentInvalidAmount:
    'El monto debe ser *S/ 4.90* o superior. Revisa tu captura de Yape o Plin y envíala de nuevo ✨.',

  paymentInvalidDestination:
    'El pago debe ir al Yape *952 989 503* (celular/cuenta destino terminada en *503*). En Plin debe decir destino *Yape* con esos dígitos. Verifica la captura ✨.',

  paymentAlreadyUsed:
    'Este comprobante ya fue usado para abrir una sesión ✨. Cada pago solo puede utilizarse una vez. Si necesitas otra lectura, realiza un nuevo Yape de *S/ 4.90* y envía esa captura.',

  paymentIncompleteReceipt:
    'No pude identificar de forma única tu comprobante. Envía la captura completa donde se vean el *número de operación*, la *fecha y hora* y el monto *S/ 4.90* ✨.',

  activeSessionPrompt:
    'Cuéntame qué deseas explorar: amor, trabajo, dinero, salud, estudios o familia ✨.',

  alreadyInPaidSession:
    'Tu sesión pagada ya está activa ✨. Cuéntame qué deseas explorar: amor, trabajo, dinero o una decisión pendiente.',

  paidSessionExpired:
    'Tu sesión pagada ya finalizó ✨. Si deseas una nueva lectura completa, escribe *reiniciar* para empezar de nuevo.',

  openaiError:
    'Disculpa, en este momento tengo dificultad para responderte. Intenta de nuevo en un momentito ✨',
};

function sessionTimeWarning(minutesLeft) {
  return `\n\n⏰ _Te quedan ${minutesLeft} minutos de sesión._`;
}

module.exports = {
  MESSAGES,
  sessionTimeWarning,
  buildFirstFreeSignalMessage,
  buildSecondFreeSignalMessage,
  buildFreeSignalsMessage,
  buildPaymentWallMessage,
  buildGreetAndPaymentMessage,
  buildSessionClosing,
};
