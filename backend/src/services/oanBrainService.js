const fs = require('fs');
const path = require('path');

const BRAIN_PATH = path.join(__dirname, '../../data/oan_fin.json');
const INSTRUCTION_PATH = path.join(__dirname, '../../docs/instruction-oan-behavior.txt');

let cachedBrain = null;
let cachedInstruction = null;

function loadBrain() {
  if (cachedBrain) return cachedBrain;
  cachedBrain = JSON.parse(fs.readFileSync(BRAIN_PATH, 'utf8')).oraculo_andino_config;
  return cachedBrain;
}

function loadInstruction() {
  if (cachedInstruction) return cachedInstruction;
  cachedInstruction = fs.readFileSync(INSTRUCTION_PATH, 'utf8');
  return cachedInstruction;
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getArchetype(numberKey) {
  const key = String(numberKey);
  return loadBrain().motor_algoritmico_numerologia.arquetipos_matrices[key] || null;
}

function getGreetAndPaymentMessages() {
  return [
    'El Oráculo Andino te saluda ✨ Para abrir tu sesión personalizada de 1 hora sobre amor, dinero o tus proyectos, realiza la colaboración de *S/ 4.90* vía Yape al *952 989 503* y envíame la captura de tu comprobante.',
    'Qué bueno que escribas ✨ El Oráculo Andino te acompaña con una sesión de hasta 1 hora. Para acceder, envía *S/ 4.90* por Yape al *952 989 503* y comparte la foto de tu constancia aquí.',
    'Bienvenido al Oráculo Andino ✨ Tu lectura personalizada de 1 hora ya puede iniciarse. Realiza *S/ 4.90* vía Yape al *952 989 503* y envíame la captura para abrir tu sesión hoy.',
  ];
}

function buildGreetAndPaymentMessage() {
  return pickRandom(getGreetAndPaymentMessages());
}

function getWelcomeMessages() {
  return [
    'Bienvenido al Oráculo Andino ✨ Para ver las señales de tu camino, compárteme tu fecha de nacimiento — en cualquier formato — y, si quieres, tu hora y ciudad en un solo mensaje.',
    'Qué bueno encontrarte por aquí ✨ Déjame ver qué cartas y números te rodean hoy. Escríbeme tu fecha de nacimiento como prefieras (ej.: 4 de mayo 1980, 3pm, Lima) y seguimos.',
    'El Oráculo Andino te saluda ✨ Para revelar el mapa de tu energía, necesito tu fecha de nacimiento. Puedes incluir hora y ciudad en el mismo mensaje, en español o inglés.',
  ];
}

function getHookQuestions() {
  return [
    'Al procesar tus datos, se nota que estás cargando con un peso que no te corresponde. ¿Sientes que esto tiene que ver con tus proyectos actuales o con algo más personal?',
    'Tus fuentes andinas marcan que se viene un giro importante en tu entorno. ¿Estás sintiendo ya esa necesidad de mover tus fichas o cambiar de rumbo hoy?',
    'Tus números muestran que tu mente está dándole demasiadas vueltas a un asunto. ¿Te hace sentido esto con una decisión que vienes postergando con la mente fría?',
    'Tus señales indican que es momento de parar un ratito la máquina y ordenar prioridades. ¿Sientes que te describe bien el momento que estás atravesando hoy?',
  ];
}

function getPaymentWallMessages() {
  return [
    'Es completamente natural sentir ese peso. Si deseas profundizar en amor, dinero o tus proyectos personales, el Oráculo Andino ofrece una sesión personalizada de hasta 1 hora. La contribución para acceder es de *S/ 4.90* vía Yape al *952 989 503*. Me quedo en calma esperando tu captura para abrir tu sesión hoy. ¿Te gustaría?',
    'Comprendo perfectamente lo que pasas. Para abrir tu sesión personalizada de 1 hora y destrabar esos nudos en tu amor o dinero, puedes realizar la colaboración de *S/ 4.90* por Yape al número *952 989 503*. Aguardo aquí la captura de tu constancia para empezar con la mejor energía. ¿Le damos?',
    'Esa energía se puede canalizar a tu favor. Si estás listo para revisar a fondo tus proyectos y tu destino en una sesión de 1 hora, el acceso es de *S/ 4.90* mediante Yape al *952 989 503*. La lectura completa ya está lista; envíame la foto de tu comprobante para revelarla. ¿Te animas?',
  ];
}

function getMinorRejectedMessage() {
  return 'El Oráculo Andino es un servicio para adultos. No puedo continuar la lectura, pero te envío una señal simbólica de buena energía ✨.';
}

function getPaymentConfirmedMessage() {
  return loadBrain().blindaje_seguridad_comercial.validacion_pago.mensaje_exito;
}

function getPaymentFreezeMessage() {
  return 'Para continuar con tu lectura detallada, por favor envíame la captura de tu Yape de *S/ 4.90* al *952 989 503*. Las respuestas ya están listas para ti.';
}

function getMysticSymbols() {
  return ['Huayruro', 'Chakana', 'Velita blanca', 'Cuarzo'];
}

function getRandomMantra() {
  return pickRandom(loadBrain().blindaje_seguridad_comercial.cierre_y_mantras.frases_mantra_aleatorias);
}

function buildFreeSignalsMessage(numerology) {
  const archetype = getArchetype(numerology.lifePath) || getArchetype(22);
  const colorArchetype = getArchetype(numerology.dayNumber);
  const color = colorArchetype?.color || numerology.dayColor;
  const colorMeaning = colorArchetype?.significado_color || archetype.significado_color;

  return (
    `${archetype.emoticon || '✨'} *Primera Señal:* ${archetype.senal_gratuita}\n\n` +
    `🎨 *Segunda Señal:* El color *${color}* te acompaña hoy, recordándote que ${colorMeaning}\n\n` +
    pickRandom(getHookQuestions())
  );
}

function buildPaymentWallMessage() {
  return pickRandom(getPaymentWallMessages());
}

function buildSessionClosing(numerology) {
  const brain = loadBrain();
  const closing = brain.blindaje_seguridad_comercial.cierre_y_mantras;
  const symbol = pickRandom(getMysticSymbols());

  return (
    `${closing.mensaje_cierre_textual}\n\n` +
    `🎨 *Color del día:* ${numerology.dayColor}\n` +
    `🔮 *Número de la suerte:* ${numerology.dayNumber}\n` +
    `🌿 *Símbolo místico:* ${symbol}\n` +
    `*${closing.bloque_adjunto_final.nombre}*\n` +
    `'${closing.bloque_adjunto_final.slogan}'`
  );
}

function buildPaidSessionSystemPrompt() {
  const brain = loadBrain();
  const instruction = loadInstruction();

  return (
    `Eres el Oráculo Andino en una sesión de lectura completa PAGADA por WhatsApp (hasta 1 hora).\n\n` +
    `AÑO ACTUAL: ${brain.anio_actual}\n` +
    `NATURALEZA: ${brain.naturaleza_servicio}\n\n` +
    `REGLAS DE RESPUESTA:\n` +
    `- Máximo 2 a 3 frases cortas por mensaje.\n` +
    `- Estructura: 1) observación numerológica/astrológica, 2) consejo breve positivo, 3) pregunta abierta.\n` +
    `- Palabras permitidas: ${brain.manual_identidad_linguistica.palabras_permitidas.join(', ')}.\n` +
    `- Palabras PROHIBIDAS: ${brain.manual_identidad_linguistica.palabras_prohibidas.join(', ')}.\n` +
    `- No des consejos médicos, legales ni financieros. No predigas tragedias.\n` +
    `- Precio único: S/4.90 Yape al 952 989 503.\n\n` +
    `--- REGLAS DE COMPORTAMIENTO (INSTRUCTION_OAN) ---\n\n${instruction}\n\n` +
    `--- CEREBRO TÉCNICO (oan_fin.json) ---\n\n${JSON.stringify(brain, null, 2)}`
  );
}

module.exports = {
  loadBrain,
  loadInstruction,
  getArchetype,
  getWelcomeMessages,
  pickRandom,
  buildFreeSignalsMessage,
  buildPaymentWallMessage,
  buildGreetAndPaymentMessage,
  buildSessionClosing,
  buildPaidSessionSystemPrompt,
  getMinorRejectedMessage,
  getPaymentConfirmedMessage,
  getPaymentFreezeMessage,
  BRAIN_PATH,
  INSTRUCTION_PATH,
};
