const fs = require('fs');
const path = require('path');

const BRAIN_PATH = path.join(__dirname, '../../data/oraculo_mind.json');
const INSTRUCTION_PATH = path.join(__dirname, '../../docs/oraculo_systemprompt.md');
const ASTRO_DICT_PATH = path.join(__dirname, '../../data/diccionarioastrologico.json');

let cachedBrain = null;
let cachedInstruction = null;
let cachedAstroDictionary = null;

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

function loadAstroDictionary() {
  if (cachedAstroDictionary) return cachedAstroDictionary;
  cachedAstroDictionary = JSON.parse(fs.readFileSync(ASTRO_DICT_PATH, 'utf8'));
  return cachedAstroDictionary;
}

function getPaidSessionMinutes() {
  return loadBrain().duracion_sesion_pagada_minutos || 30;
}

function getPreCobroArch() {
  return loadBrain().arquitectura_conversacional_pre_cobro || {};
}

function getPostCobroArch() {
  return loadBrain().arquitectura_conversacional_post_cobro || {};
}

function getLinguistics() {
  const brain = loadBrain();
  return brain.manual_linguistico || brain.manual_identidad_linguistica || {};
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getMotorConfig() {
  const brain = loadBrain();
  return (
    brain.motor_algoritmico_numerologia_y_astrologia ||
    brain.motor_algoritmico_numerologia ||
    null
  );
}

function getArchetype(numberKey) {
  const key = String(numberKey);
  return getMotorConfig()?.arquetipos_matrices?.[key] || null;
}

function getArchetypeConcepts(archetype) {
  return (
    archetype?.conceptos_clave ||
    'ciclos, equilibrio y caminar paso a paso con mente fría'
  );
}

function formatWhatsAppMarkdown(text) {
  return String(text || '').replace(/\*\*/g, '*');
}

function buildKnowledgeSourceGuard() {
  return (
    `FUENTE DE VERDAD ÚNICA (INQUEBRANTABLE):\n` +
    `- Solo puedes usar INSTRUCCIONES OFICIALES (oraculo_systemprompt.md), CEREBRO TÉCNICO (oraculo_mind.json) y DICCIONARIO (diccionarioastrologico.json) incluidos abajo.\n` +
    `- PROHIBIDO buscar en internet, usar navegador, herramientas web, noticias, Wikipedia o cualquier fuente externa.\n` +
    `- PROHIBIDO apoyarte en conocimiento general, entrenamiento previo o datos que NO aparezcan en esos documentos.\n` +
    `- PROHIBIDO inventar precios, teléfonos, textos comerciales, arquetipos o reglas que no estén en esos documentos.\n` +
    `- Si el usuario pide algo fuera de los documentos, responde con lo permitido por el blindaje comercial o redirige al hilo sin inventar.\n\n`
  );
}

function buildEmbeddedKnowledgeContext() {
  const brain = loadBrain();
  const instruction = loadInstruction();
  const astroDictionary = loadAstroDictionary();

  return (
    `${buildKnowledgeSourceGuard()}` +
    `--- INSTRUCCIONES OFICIALES ---\n\n${instruction}\n\n` +
    `--- CEREBRO TÉCNICO (oraculo_mind.json) ---\n\n${JSON.stringify(brain, null, 2)}\n\n` +
    `--- DICCIONARIO ASTROLÓGICO (diccionarioastrologico.json) ---\n\n${JSON.stringify(astroDictionary, null, 2)}`
  );
}

function stripBrainForPaidSession(brain) {
  const copy = JSON.parse(JSON.stringify(brain));
  const pre = copy.arquitectura_conversacional_pre_cobro;
  if (pre?.mensaje_4_o_5_oraculo) {
    delete pre.mensaje_4_o_5_oraculo;
  }

  const post = copy.arquitectura_conversacional_post_cobro;
  if (post) {
    delete post.candado_espera_comprobante;
    delete post.flujo_recompra_inmediata;
  }

  const legacyShield = copy.blindaje_seguridad_comercial;
  if (legacyShield) {
    delete legacyShield.flujo_cobro_dinamico_sensible;
    if (legacyShield.validacion_pago) {
      const { recordatorio_congelado, ...restValidation } = legacyShield.validacion_pago;
      legacyShield.validacion_pago = restValidation;
    }
  }

  return copy;
}

function buildPaidSessionInstruction() {
  const instruction = loadInstruction();
  const match = instruction.match(/^([\s\S]*?)## 5\.[\s\S]*?(## 8\.[\s\S]*)$/);
  if (!match) return instruction;

  return (
    `${match[1].trim()}\n\n` +
    `## 5. SESIÓN PAGADA ACTIVA (OVERRIDE — PRIORIDAD MÁXIMA)\n` +
    `* El usuario YA pagó. Su sesión de ${getPaidSessionMinutes()} minutos está ABIERTA.\n` +
    `* PROHIBIDO mencionar Yape, Plin, S/ 4.90, captura, comprobante, contribución o "abrir sesión".\n` +
    `* DEBES responder la pregunta literal del usuario en la primera oración.\n` +
    `* Sigue los bloques post-cobro: Río (0-10 min), Piedra (10-20 min), Montaña (20-30 min).\n` +
    `* NO apliques el muro de cobro ni el candado post-cobro del embudo gratuito.\n\n` +
    match[2].trim()
  );
}

function buildPaidSessionKnowledgeContext() {
  const brain = stripBrainForPaidSession(loadBrain());
  const instruction = buildPaidSessionInstruction();

  return (
    `${buildKnowledgeSourceGuard()}` +
    `CONTEXTO DE SESIÓN: PAGADA Y ACTIVA. Ignora cualquier regla de embudo gratuito o muro de cobro en los documentos.\n\n` +
    `--- INSTRUCCIONES OFICIALES (sesión pagada) ---\n\n${instruction}\n\n` +
    `--- CEREBRO TÉCNICO (sin funnel comercial) ---\n\n${JSON.stringify(brain, null, 2)}`
  );
}

const PAYMENT_WALL_MARKERS = [
  /952\s*989\s*503/i,
  /S\/\s*4\.?\s*90/i,
  /4\.?\s*90.*yape/i,
  /yape.*4\.?\s*90/i,
  /captura.*(?:yape|plin|comprobante)/i,
  /env[ií]ame.*captura/i,
  /contribuci[oó]n.*sesi[oó]n/i,
  /abrir tu sesi[oó]n de (?:1 hora|30 minutos)/i,
  /esperando tu captura/i,
  /quedo aqu[ií] en serenidad/i,
  /realiza la colaboraci[oó]n/i,
];

const SESSION_SCOPE_PATTERNS = [
  /de qu[eé]\s+(podemos|puedo)\s+hablar/i,
  /qu[eé]\s+puedo\s+preguntar/i,
  /me\s+vas\s+a\s+dar\s+consejos?/i,
  /qu[eé]\s+tipo\s+de\s+(lectura|consulta)/i,
  /c[oó]mo\s+funciona\s+(esta\s+)?sesi[oó]n/i,
  /qu[eé]\s+incluye/i,
  /what can we talk about/i,
  /will you give me advice/i,
];

const QUESTION_CHALLENGE_PATTERNS = [
  /y\s+la\s+pregunta\s+que\s+te\s+hice/i,
  /no\s+(me\s+)?respondiste/i,
  /no\s+contestaste/i,
  /respondiste\s+sin\s+sentido/i,
  /you\s+didn'?t\s+answer/i,
  /what\s+about\s+my\s+question/i,
];

function isPaymentWallLikeReply(text) {
  const value = String(text || '');
  if (!value) return false;

  const hits = PAYMENT_WALL_MARKERS.filter((pattern) => pattern.test(value));
  if (hits.length >= 2) return true;

  return /952\s*989\s*503/.test(value) && /S\/\s*4|4\.90|4,90/i.test(value);
}

function isSessionScopeQuestion(text) {
  const value = String(text || '');
  return SESSION_SCOPE_PATTERNS.some((pattern) => pattern.test(value));
}

function isQuestionChallenge(text) {
  const value = String(text || '');
  return QUESTION_CHALLENGE_PATTERNS.some((pattern) => pattern.test(value));
}

function buildPaidSessionScopeReply() {
  return (
    'En esta sesión de 30 minutos exploramos a fondo tu mapa en tres bloques: Río (potencial y tránsitos), Piedra (bloqueos ocultos) y Montaña (hoja de ruta + ritual de reciprocidad).\n\n' +
    'Te doy orientación simbólica y numerológica — señales para mirar tu camino con claridad, no predicciones rígidas ni respuestas de sí o no.\n\n' +
    'Sí te acompaño con consejos de enfoque; no reemplazo médico, legal ni contable. ¿Por qué tema quieres empezar?'
  );
}

function buildPaidSessionFallbackReply(userText, numerology) {
  if (isSessionScopeQuestion(userText)) {
    return buildPaidSessionScopeReply();
  }

  const theme = detectUserTheme(userText);
  const archetype = getArchetype(numerology?.lifePath) || getArchetype(22);
  if (theme) {
    return (
      `${pickThemeOpening(theme, 0)} Con *${archetype.nombre}* en tu mapa, conviene mirarlo con mente fría.\n\n` +
      `${pickFollowUpQuestion(theme, userText, 0)}`
    );
  }

  return (
    'Entiendo tu inquietud. En esta sesión podemos profundizar en amor, trabajo, dinero o una decisión que lleves postergando.\n\n' +
    '¿Qué situación concreta quieres que miremos primero?'
  );
}

function getCommercialShield() {
  const pre = getPreCobroArch();
  const post = getPostCobroArch();
  const paymentBlock = pre.mensaje_4_o_5_oraculo?.componentes_bloque_pago;

  return {
    primer_mensaje_registro_ritual: { texto: pre.mensaje_1_oraculo?.texto },
    flujo_cobro_dinamico_sensible: paymentBlock
      ? {
          componentes_ensamblaje: {
            '1_arranque_variable_y_coherente': paymentBlock['1_espejo_diagnostico_dinamico'],
            '2_frase_puente_fija': paymentBlock['2_frase_puente_variable'],
            '3_llamado_accion_comercial_fijo': paymentBlock['3_cta_comercial_fijo'],
          },
        }
      : {},
    validacion_pago: {
      recordatorio_congelado: post.candado_espera_comprobante,
      flujo_despedida_retorno: {
        texto_referencial: post.gatillo_cierre_min_30?.texto_salida_fijo,
      },
    },
    filtro_edad: loadBrain().validacion_pago?.filtro_edad,
  };
}

function normalizeInstitutionalText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isInstitutionalQuestion(text) {
  const normalized = normalizeInstitutionalText(text);
  const triggers = loadBrain().gestion_dudas_institucionales?.disparadores || [];
  return triggers.some((trigger) => normalized.includes(normalizeInstitutionalText(trigger)));
}

function buildInstitutionalReengagement(session) {
  const messages = session?.funnelMessages || [];
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === 'user') {
      const value = String(messages[index].content || '').trim();
      if (value.length >= 8) {
        return value.length <= 90 ? value : `${value.slice(0, 87).trim()}...`;
      }
    }
  }

  return 'lo que hoy pesa en tu corazón';
}

function buildInstitutionalReply(session, userText = '') {
  const matrix = loadBrain().gestion_dudas_institucionales?.matriz_respuesta_autoridad;
  if (!matrix) {
    return (
      'El Oráculo Andino es un espacio de acompañamiento espiritual y autoconocimiento con numerología y astrología elemental.\n\n' +
      'Nuestra sesión completa dura 30 minutos en tres bloques de 10 minutos: Río, Piedra y Montaña.\n\n' +
      `Volviendo a tus señales, ${buildInstitutionalReengagement(session)} sigue pidiendo ser mirado con mente fría.`
    );
  }

  const reenganche = buildInstitutionalReengagement(session);
  const closing = String(matrix.oracion_3_reenganche_contextual || '').replace(
    /\[Insertar reenganche[^\]]*\]/i,
    reenganche
  );

  return [
    matrix.oracion_1_identidad,
    matrix.oracion_2_estructura_tangible,
    closing,
  ].join('\n\n');
}

function buildRepurchaseWallMessage() {
  const flow = getPostCobroArch().flujo_recompra_inmediata?.componentes;
  if (!flow) {
    return (
      'Me alegra que tu río busque seguir profundizando en sus señales para abrir nuevos caminos.\n\n' +
      'Para habilitar una nueva sesión de 30 minutos, puedes enviar tu Yape de *S/ 4.90* al *952 989 503*. Quedo en serenidad esperando tu nueva captura.'
    );
  }

  return `${formatWhatsAppMarkdown(flow['1_validacion'])}\n\n${formatWhatsAppMarkdown(flow['2_cta_recompra'])}`;
}

function wantsRepurchaseSession(text) {
  const value = normalizeInstitutionalText(text);
  return /(mas tiempo|m[aá]s tiempo|otra sesi[oó]n|continuar la lectura|seguir leyendo|extender|renovar sesi[oó]n|quiero pagar otra|new session|more time)/i.test(
    value
  );
}

function getGreetAndPaymentMessages() {
  return [
    'El Oráculo Andino te saluda ✨ Para abrir tu sesión personalizada de 30 minutos sobre amor, dinero o tus proyectos, realiza la colaboración de *S/ 4.90* vía Yape al *952 989 503* y envíame la captura de tu comprobante.',
    'Qué bueno que escribas ✨ El Oráculo Andino te acompaña con una sesión de hasta 30 minutos. Para acceder, envía *S/ 4.90* por Yape al *952 989 503* y comparte la foto de tu constancia aquí.',
    'Bienvenido al Oráculo Andino ✨ Tu lectura personalizada de 30 minutos ya puede iniciarse. Realiza *S/ 4.90* vía Yape al *952 989 503* y envíame la captura para abrir tu sesión hoy.',
  ];
}

function buildGreetAndPaymentMessage() {
  return pickRandom(getGreetAndPaymentMessages());
}

function getWelcomeMessages() {
  const ritual =
    getPreCobroArch().mensaje_1_oraculo?.texto ||
    getCommercialShield().primer_mensaje_registro_ritual?.texto;
  if (ritual) return [formatWhatsAppMarkdown(ritual)];

  return [
    'Bienvenido. Toma un respiro profundo y dedica un instante a sentir qué busca realmente tu corazón en este momento. Cuando estés listo, compárteme tu *fecha de nacimiento* junto a tu *ciudad actual*, y comenzaremos a observar tus señales.',
  ];
}

function getFirstSignalFollowUpQuestions() {
  const examples = loadBrain().ejemplos_base_respuestas_por_area || {};
  const fromAreas = [examples.amor, examples.trabajo, examples.dinero].filter(Boolean);
  if (fromAreas.length) {
    return fromAreas.map((sample) => {
      const match = String(sample).match(/(?:^|[.!]\s*)([^?]+\?)\s*$/);
      return match ? match[1].trim() : String(sample).trim();
    });
  }

  return [
    '¿Sientes que esta tensión viene de heridas que no han cerrado o de la incertidumbre actual?',
    '¿Sientes que este estancamiento se debe a la falta de oportunidades o a dudas propias?',
    '¿Resuena contigo lo que acabas de leer?',
  ];
}

function getSecondSignalFollowUpQuestions() {
  return [
    '¿Sientes que el color y la señal juntos te dicen algo sobre lo que vives?',
    '¿Te gustaría conectar esto con amor, trabajo o una decisión tuya?',
    '¿Resuena contigo lo que marcan tus números y tu color hoy?',
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

function getMinorRejectedMessage() {
  return (
    loadBrain().validacion_pago?.filtro_edad?.regla_menor ||
    getCommercialShield().filtro_edad?.regla_menor ||
    'El Oráculo Andino es un espacio reservado para adultos. No me es posible continuar con la lectura, pero te envío una señal de armonía y buena energía ✨.'
  );
}

function getPaymentConfirmedMessage() {
  return (
    loadBrain().validacion_pago?.mensaje_exito ||
    'Agradezco tu reciprocidad ✨ Tu energía se integra armónicamente al Oráculo Andino. Demos inicio formal a tu sesión de 30 minutos.'
  );
}

function getPaymentFreezeMessage() {
  const reminder =
    getPostCobroArch().candado_espera_comprobante ||
    getCommercialShield().validacion_pago?.recordatorio_congelado;
  if (reminder) return formatWhatsAppMarkdown(reminder);

  return 'Para continuar con la interpretación detallada de tu mapa, envíame la captura de tu Yape de *S/ 4.90* al *952 989 503*. Las señales ya se encuentran dispuestas para ti.';
}

function buildFirstFreeSignalMessage(numerology) {
  const archetype = getArchetype(numerology.lifePath) || getArchetype(22);
  const signal = `${archetype.emoticon || '✨'} ${archetype.senal_gratuita}`;
  const colorLine =
    archetype.color && archetype.significado_color
      ? `\n\n🎨 El color *${archetype.color}* es tu color protector para tus próximas 24 horas: ${archetype.significado_color}`
      : '';

  return `${signal}${colorLine}\n\n${pickRandom(getFirstSignalFollowUpQuestions())}`;
}

function buildSecondFreeSignalMessage(numerology) {
  const archetype = getArchetype(numerology.lifePath) || getArchetype(22);
  const color = archetype?.color || numerology.color || numerology.dayColor;
  const colorMeaning = archetype?.significado_color || '';
  const colorLine = colorMeaning
    ? `🎨 El color *${color}* es tu color protector para tus próximas 24 horas: ${colorMeaning}`
    : `🎨 El color *${color}* te acompaña hoy con una señal de equilibrio y claridad.`;

  return `${colorLine}\n\n${pickRandom(getSecondSignalFollowUpQuestions())}`;
}

const GENERIC_ANCHORS = new Set([
  'esa sensación que compartes',
  'lo que hoy pesa en tu corazón',
  'esa duda que llevas dentro',
]);

const REASSURANCE_PATTERNS = [
  /voy a estar bien/i,
  /me ir[aá]\s+bien/i,
  /saldr[eé]\s+adelante/i,
  /todo va a (salir|estar) bien/i,
  /estar[eé]\s+bien/i,
  /will i be ok/i,
  /am i going to be ok/i,
  /going to be okay/i,
];

function isGenericAnchor(anchor) {
  return GENERIC_ANCHORS.has(String(anchor || '').trim().toLowerCase());
}

function isReassuranceQuestion(text) {
  const value = String(text || '');
  return REASSURANCE_PATTERNS.some((pattern) => pattern.test(value));
}

function extractSubstantiveClause(userText) {
  const value = String(userText || '').trim();
  if (!value) return null;

  if (/\b(es|est[aá])\s+algo\s+m[aá]s\s+difuso\b/i.test(value)) {
    return 'esa sensación difusa que te acompaña';
  }

  if (/\b(es|est[aá])\s+algo\s+m[aá]s\s+personal\b/i.test(value)) {
    return 'algo más personal en lo que vives';
  }

  if (/\b(es|est[aá])\s+(.{4,45}?)(?:[.?,]|$)/i.test(value)) {
    const match = value.match(/\b(es|est[aá])\s+(.{4,45}?)(?:[.?,]|$)/i);
    const clause = match?.[2]?.trim().toLowerCase();
    if (clause && !isReassuranceQuestion(clause) && clause.length <= 45) {
      return clause.replace(/\s+(pero|but)\b.*$/i, '').trim() || null;
    }
  }

  return null;
}

function buildReassuranceFunnelReply(numerology, userText = '') {
  const archetype = getArchetype(numerology.lifePath) || getArchetype(22);
  const diffuse = /\bdifuso\b/i.test(userText);
  const opening = diffuse
    ? 'Entiendo: es algo difuso, no un evento puntual — eso también se lee en tu mapa.'
    : 'Tu pregunta por estar bien es válida.';

  return (
    `${opening} *${archetype.nombre}* no marca un final cerrado; señala un proceso donde la calma y el paso a paso importan más que la prisa.\n\n` +
    `¿Qué parte de lo que sientes pesa más hoy: el miedo, el cansancio o la incertidumbre?`
  );
}

const OPINION_FILLER_PREFIX =
  /^(creo que\s+(es\s+)?|pienso que\s+(es\s+)?|siento que\s+(es\s+)?|me parece que\s+(es\s+)?|i think( it's| it is)?\s*)/i;

const UNCLEAR_MESSAGE_PATTERNS = [
  /\bhan\s+(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/i,
  /\bno\s+han\s+s[aá]bado\b/i,
  /\bheridas?\b.*\bhan\s+s[aá]bado\b/i,
  /\bwounds?\b.*\b(saturday|sunday|monday|tuesday|wednesday|thursday|friday)\b/i,
];

function needsUserClarification(userText) {
  const value = String(userText || '').trim();
  if (!value) return false;
  if (UNCLEAR_MESSAGE_PATTERNS.some((pattern) => pattern.test(value))) return true;

  const normalized = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

  if (OPINION_FILLER_PREFIX.test(value) && /\bhan sabado\b/.test(normalized)) {
    return true;
  }

  return false;
}

function buildUserClarificationReply(userText = '') {
  const value = String(userText || '').trim();

  if (/\bheridas?\b/i.test(value) && /\bhan\s+s[aá]bado\b/i.test(value)) {
    return (
      'Quise entenderte bien: ¿hablabas de *heridas que aún no han sanado*?\n\n' +
      'Cuéntame en una frase simple qué sientes — así conecto tu señal con claridad ✨'
    );
  }

  if (/\bhan\s+s[aá]bado\b/i.test(value)) {
    return (
      'No me quedó del todo claro tu mensaje — ¿quizá quisiste decir *sanado* en lugar de *sábado*?\n\n' +
      'Escríbelo otra vez en pocas palabras y te leo con precisión ✨'
    );
  }

  return (
    'Quise entenderte, pero no me quedó del todo claro lo que escribiste.\n\n' +
    '¿Puedes decirlo otra vez en una frase corta? Así conecto tu señal con claridad ✨'
  );
}

function summarizeAnchorPhrase(value) {
  const cleaned = String(value || '')
    .trim()
    .replace(OPINION_FILLER_PREFIX, '')
    .replace(/^["'“”]+|["'“”]+$/g, '')
    .trim();

  if (!cleaned) return 'esa sensación que compartes';

  const words = cleaned.split(/\s+/);
  if (words.length <= 6 && cleaned.length <= 45) return cleaned.toLowerCase();

  if (/\bheridas?\b/.test(cleaned)) return 'heridas que aún no han sanado';
  if (/\b(miedo|duda|incertidumbre)\b/.test(cleaned)) return 'esa duda que llevas dentro';
  if (/\b(trabajo|empleo|carrera|software)\b/.test(cleaned)) return 'tu camino profesional';
  if (/\b(dinero|deuda|econ[oó]m)\b/.test(cleaned)) return 'tu situación económica';
  if (/\b(relaci[oó]n|pareja|amor)\b/.test(cleaned)) return 'esa tensión en tus afectos';

  return 'esa sensación que compartes';
}

function extractAnchorPhrase(userText) {
  const value = String(userText || '').trim();
  if (!value) return null;

  if (/^(thanks|thank you|gracias|thanks a lot)/i.test(value)) {
    return 'lo que hoy pesa en tu corazón';
  }

  const substantive = extractSubstantiveClause(value);
  if (substantive) return substantive;

  const theme = detectUserTheme(value);
  if (theme?.key === 'work') return 'asumir más responsabilidad en tu camino profesional';
  if (theme?.key === 'money') return 'ordenar tu economía paso a paso';
  if (theme?.key === 'relationship' || theme?.key === 'toxic_relationship') {
    return 'esa tensión en tus afectos';
  }
  if (theme?.key === 'decision') return 'postergar una decisión importante';
  if (/\bheridas?\b/.test(value)) return 'heridas que aún no han sanado';
  if (isReassuranceQuestion(value)) return 'tu necesidad de calma frente a lo difuso';

  const summarized = summarizeAnchorPhrase(value);
  return isGenericAnchor(summarized) ? null : summarized;
}

function buildPaymentMirror(userText, numerology) {
  const archetype = getArchetype(numerology?.lifePath) || getArchetype(22);

  if (isReassuranceQuestion(userText)) {
    const diffuse = /\bdifuso\b/i.test(userText);
    return pickRandom(
      diffuse
        ? [
            `Entiendo: es algo difuso, y preguntas si vas a estar bien. *${archetype.nombre}* señala un proceso de equilibrio, no un cierre fatal.`,
            `Lo difuso que sientes es real; tu pregunta por estar bien también. En tu mapa, *${archetype.nombre}* invita a confiar en el paso a paso.`,
          ]
        : [
            `Preguntas si vas a estar bien — es natural cuando algo pesa. *${archetype.nombre}* marca un camino de templanza, no un final cerrado.`,
            `Tu necesidad de certeza encaja con lo que marcan tus números hoy. *${archetype.nombre}* habla de equilibrio y constancia, no de miedo.`,
          ]
    );
  }

  const anchor = extractAnchorPhrase(userText);

  if (!anchor || isGenericAnchor(anchor)) {
    return pickRandom([
      `Lo que compartes hoy encaja con la piedra que frena el río en tu mapa de *${archetype.nombre}*.`,
      `Siento en tu mensaje un hilo claro que pide ser mirado con mente fría. *${archetype.nombre}* marca ese punto de inflexión.`,
    ]);
  }

  return pickRandom([
    `Esa duda sobre ${anchor} refleja la piedra exacta que hoy detiene tu río.`,
    `Lo que compartes sobre ${anchor} muestra la piedra que frena el río de tu camino.`,
    `Lo que nombras sobre ${anchor} se alinea con la piedra que hoy detiene el río de *${archetype.nombre}*.`,
  ]);
}

function buildFirstSignalClarification(numerology, userText = '') {
  const archetype = getArchetype(numerology.lifePath) || getArchetype(22);
  const signal = archetype.senal_gratuita.replace(/^[A-ZÁÉÍÓÚÑ]/, (c) => c.toLowerCase());
  const theme = detectUserTheme(userText);
  const opening = theme ? `${pickThemeOpening(theme, 0)} ` : '';

  return (
    `${opening}Me refiero a que ${signal}\n\n` +
    `En tu mapa, esto se enlaza con *${archetype.nombre}*.\n\n` +
    pickFollowUpQuestion(theme, userText, 0)
  );
}

function buildSecondSignalClarification(numerology, userText = '') {
  const archetype = getArchetype(numerology.lifePath) || getArchetype(22);
  const colorArchetype = getArchetype(numerology.dayNumber);
  const color = colorArchetype?.color || numerology.dayColor;
  const colorMeaning = colorArchetype?.significado_color || archetype.significado_color;
  const meaning = colorMeaning.replace(/^[A-ZÁÉÍÓÚÑ]/, (c) => c.toLowerCase());
  const theme = detectUserTheme(userText);
  const opening = theme ? `${pickThemeOpening(theme, 0)} ` : '';

  return (
    `${opening}Me refiero a que el color *${color}* hoy acompaña tu proceso: ${meaning}\n\n` +
    pickFollowUpQuestion(theme, userText, 0)
  );
}

function pickByIndex(items, seed = 0) {
  if (!items.length) return '';
  const hash = String(seed)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return items[hash % items.length];
}

const EXPLAIN_PATTERNS = [
  /qu[eé]\s*significa/i,
  /qu[eé]\s*quiere\s*decir/i,
  /expl[ií]came/i,
  /expl[ií]ca(me)?\s/i,
  /no\s+entiendo/i,
  /qu[eé]\s*es\s+eso/i,
  /what\s+does\s+it\s+mean/i,
  /\bexplain\b/i,
];

const THEME_DETECTORS = [
  {
    key: 'toxic_relationship',
    pattern: /relaci[oó]n.*t[oó]xic|t[oó]xic.*relaci[oó]n|relaci[oó]n.*(terminar|cerrar|dejar|posterg)/i,
    openings: [
      'Ese vínculo ya te está pidiendo un límite claro.',
      'Llevas tiempo sintiendo que esa relación drena más de lo que da.',
      'Tu energía sabe que ese ciclo ya cumplió su tiempo.',
    ],
    questions: [
      '¿Qué es lo que más te frena para cerrar ese ciclo?',
      '¿Sientes que el miedo o la costumbre es lo que más te ata ahí?',
      '¿Qué pasaría en tu día a día si mañana dieras ese paso?',
    ],
  },
  {
    key: 'relationship',
    pattern: /relaci[oó]n|pareja|novio|novia|\bex\b|amor/i,
    openings: [
      'El corazón te está marcando algo que ya no puedes postergar.',
      'Hay emociones ahí que piden ser nombradas con honestidad.',
      'En el amor, tus números hoy hablan de claridad, no de prisa.',
    ],
    questions: [
      '¿Qué es lo que más necesitas sentir en esa relación ahora?',
      '¿Buscas cerrar, sanar o entender mejor lo que pasa?',
      '¿Qué parte de ese vínculo sientes que más te desgasta?',
    ],
  },
  {
    key: 'work',
    pattern:
      /software|developer|programador|programming|ingenier|career|carrera|profesi|cambiar de trabajo|trabajo nuevo|nuevo empleo|renunciar|buscar trabajo|trabajo|empleo|laboral|jefe|oficina/i,
    openings: [
      'El trabajo ocupa tu mente más de lo que admites en voz alta.',
      'Hay un movimiento laboral rondando tu energía estos días.',
      'Tus números marcan un momento de evaluar hacia dónde quieres crecer.',
    ],
    questions: [
      '¿Qué es lo que más te impulsa o te frena en ese cambio?',
      '¿Buscas estabilidad o un giro más grande en lo laboral?',
      '¿Qué perderías y qué ganarías si das ese paso?',
    ],
  },
  {
    key: 'money',
    pattern: /dinero|deuda|econ[oó]m|finanz/i,
    openings: [
      'Lo económico te está marcando el ritmo en este momento.',
      'Hay una tensión con el dinero que pide orden y enfoque.',
      'Tus números señalan que conviene mirar las finanzas con calma.',
    ],
    questions: [
      '¿Sientes que el bloqueo es falta de oportunidad o de dirección?',
      '¿Qué área económica te preocupa más hoy?',
      '¿Buscas estabilizar o crecer en lo material?',
    ],
  },
  {
    key: 'family',
    pattern: /familia|padre|madre|hijo|hija|herman/i,
    openings: [
      'La familia está tocando fibras sensibles en tu mapa hoy.',
      'Hay un tema de raíz que pide atención en tu entorno cercano.',
      'Tus números conectan este momento con lazos muy profundos.',
    ],
    questions: [
      '¿Qué parte de esa dinámica familiar te pesa más?',
      '¿Buscas distancia, reconciliación o entender mejor lo que pasa?',
    ],
  },
  {
    key: 'decision',
    pattern: /decisi[oó]n|posterg|duda|miedo|no s[eé]/i,
    openings: [
      'Hay una decisión que ya llevas demasiado tiempo posponiendo.',
      'Tu mente da vueltas porque intuyes que algo debe moverse.',
      'El mapa muestra que postergar ya no te protege, solo te agota.',
    ],
    questions: [
      '¿Qué te frena más: el miedo a equivocarte o a perder algo?',
      '¿Qué pasaría si confiaras en lo que ya sientes por dentro?',
      '¿Qué necesitas escuchar de ti mismo/a para decidir?',
    ],
  },
];

const GENERAL_OPENINGS = [
  'Lo que cuentas encaja con la energía que marcan tus números hoy.',
  'Hay algo en tu mensaje que conecta con la señal que viste.',
  'Tus números invitan a mirar esto con calma, sin forzar la respuesta.',
];

const GENERAL_QUESTIONS = [
  '¿Qué parte de tu vida te gustaría mirar con esta señal: amor, trabajo o una decisión?',
  '¿Hay algún tema concreto — afectos, trabajo o dinero — que te ronda la mente?',
  '¿Qué situación tuya te gustaría entender mejor con esta lectura?',
];

function isExplanationRequest(text) {
  return EXPLAIN_PATTERNS.some((pattern) => pattern.test(String(text || '')));
}

function isUncertaintyMessage(text) {
  const value = String(text || '').trim().toLowerCase();
  return (
    /not sure|no s[eé]|no estoy seguro|no mucho|no realmente|no me convence|maybe|tal vez|quiz[aá]s|i don'?t know|idk|who knows|doubt|indecis/i.test(
      value
    ) && value.length <= 60
  );
}

function isShortAmbiguousMessage(text) {
  const value = String(text || '').trim();
  if (!value || value.length > 25) return false;
  if (value.includes('?')) return false;
  return /^(sure|ok|okay|yes|yep|yeah|thanks|thank you|gracias|s[ií]|dale|claro|ya|bueno|fine|alright|got it|entendido|va)$/i.test(
    value
  );
}

function isDeclineMessage(text) {
  const value = String(text || '').trim().toLowerCase();
  if (!value || value.length > 40) return false;
  return /^(no|nah|nope|no thanks|no thank you|no gracias|not really|paso|no quiero|don'?t want|not now|ahora no)$/i.test(
    value
  );
}

function isSubstantiveMessage(text) {
  const value = String(text || '').trim();
  if (!value) return false;
  if (isUncertaintyMessage(value) || isShortAmbiguousMessage(value) || isDeclineMessage(value)) {
    return false;
  }
  if (detectUserTheme(value)) return true;
  return value.length >= 12;
}

function buildDeclineReply({ step, numerology }) {
  const nextHint =
    step === 'after_first_signal'
      ? 'Si más adelante quieres ver la *siguiente señal* gratis, escríbeme *cuéntame más*.'
      : 'Si quieres conocer la lectura completa, escríbeme *cuéntame más* y te muestro cómo acceder.';

  return pickByIndex(
    [
      `Está bien, no hay prisa. Respeto tu espacio.\n\n${nextHint}`,
      `Entiendo. No tienes que explorar nada que no quieras hoy.\n\n${nextHint}`,
    ],
    numerology.lifePath
  );
}

function buildUncertaintyReply({ numerology, turnIndex = 0 }) {
  const archetype = getArchetype(numerology.lifePath) || getArchetype(22);
  const metaphors = loadBrain().manual_identidad_linguistica?.metodologia_propia_identidad
    ?.diccionario_metaforas_andinas;

  return pickByIndex(
    [
      `Es normal dudar; la niebla invita a observar con mente fría antes de decidir.\n\n¿Sientes que el freno viene más del pasado o de lo que enfrentas hoy?`,
      `Está bien no sentirlo fuerte todavía; *${archetype.nombre}* se aclara cuando lo conectas con algo concreto.\n\n¿Prefieres mirar amor, trabajo o dinero?`,
      metaphors?.incertidumbre
        ? `${metaphors.incertidumbre}\n\n¿Qué área sientes más movida ahora?`
        : `Tu señal pide paciencia, no prisa.\n\n¿Qué tema te ronda más hoy?`,
    ],
    numerology.lifePath + turnIndex
  );
}

function buildShortAckReply({ lastBotMessage = '' }) {
  if (/claridad|fuerza|permiso|amor.*trabajo|decisi/i.test(lastBotMessage)) {
    return (
      'Perfecto. Cuéntame en una frase qué tema te pesa hoy — amor, trabajo, dinero o una decisión — y lo conecto con tu señal.\n\n' +
      '¿Por cuál empezamos?'
    );
  }

  return (
    'Gracias. Para afinar la lectura, escríbeme qué situación concreta quieres mirar — amor, trabajo, dinero o una decisión.\n\n' +
    'Cuando quieras ver la siguiente señal, puedes escribir *cuéntame más*.'
  );
}

function detectUserTheme(userText) {
  const value = String(userText || '');
  return THEME_DETECTORS.find((theme) => theme.pattern.test(value)) || null;
}

function pickThemeOpening(theme, seed = 0) {
  if (theme?.openings?.length) return pickByIndex(theme.openings, seed);
  return pickByIndex(GENERAL_OPENINGS, seed);
}

function pickFollowUpQuestion(theme, userText, seed = 0) {
  if (theme?.questions?.length) return pickByIndex(theme.questions, seed + 3);
  return pickByIndex(GENERAL_QUESTIONS, seed + 5);
}

function pickConceptSnippet(concepts, seed = 0) {
  const parts = String(concepts || '')
    .replace(/\.$/, '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return pickByIndex(parts.length ? parts : ['lo que estás viviendo'], seed + 7);
}

function buildSignalBridge(archetype, step, numerology, seed = 0) {
  const concept = pickConceptSnippet(getArchetypeConcepts(archetype), seed);
  const trilogia = loadBrain().manual_identidad_linguistica?.metodologia_propia_identidad?.ejes;

  if (step === 'after_second_signal') {
    const color = numerology.color || numerology.dayColor || 'tu color del día';
    return pickByIndex(
      [
        `El *${color}* refuerza que este tema pide calma y enfoque.`,
        trilogia?.la_piedra
          ? `La piedra hoy parece ser ${concept.toLowerCase()}; el color te invita a mirarlo sin prisa.`
          : `Tu color *${color}* acompaña ese proceso con paciencia.`,
      ],
      seed + 1
    );
  }

  return pickByIndex(
    [
      trilogia?.el_rio
        ? `En tu mapa, el río quiere avanzar pero la piedra marca ${concept.toLowerCase()}.`
        : `Tu arquetipo *${archetype.nombre}* conecta esto con ${concept.toLowerCase()}.`,
      `La señal encaja con ${concept.toLowerCase()} en tu camino actual.`,
    ],
    seed + 2
  );
}

function buildConversationalFunnelReply({
  step,
  numerology,
  userText,
  turnIndex = 0,
  lastBotMessage = '',
}) {
  const text = String(userText || '').trim();
  if (!text) {
    return 'Cuéntame qué sientes al leer esa señal ✨.';
  }

  if (needsUserClarification(text)) {
    return buildUserClarificationReply(text);
  }

  if (isExplanationRequest(text)) {
    return step === 'after_first_signal'
      ? buildFirstSignalClarification(numerology, userText)
      : buildSecondSignalClarification(numerology, userText);
  }

  if (isDeclineMessage(text)) {
    return buildDeclineReply({ step, numerology });
  }

  if (isUncertaintyMessage(text)) {
    return buildUncertaintyReply({ numerology, turnIndex });
  }

  if (isShortAmbiguousMessage(text)) {
    return buildShortAckReply({ lastBotMessage });
  }

  if (isReassuranceQuestion(text)) {
    return buildReassuranceFunnelReply(numerology, text);
  }

  const archetype = getArchetype(numerology.lifePath) || getArchetype(22);
  const theme = detectUserTheme(text);
  const seed = numerology.lifePath + turnIndex * 11 + text.length;
  const opening = pickThemeOpening(theme, seed);
  const bridge = buildSignalBridge(archetype, step, numerology, seed);
  const question = pickFollowUpQuestion(theme, userText, seed);

  return `${opening} ${bridge}\n\n${question}`;
}

/** @deprecated Combined message — use buildFirstFreeSignalMessage + buildSecondFreeSignalMessage */
function buildFreeSignalsMessage(numerology) {
  return (
    `${buildFirstFreeSignalMessage(numerology)}\n\n` +
    `${buildSecondFreeSignalMessage(numerology)}\n\n` +
    pickRandom(getHookQuestions())
  );
}

function buildPaymentWallMessage(userText = '', numerology = null) {
  if (needsUserClarification(userText)) {
    return buildUserClarificationReply(userText);
  }

  const components =
    getCommercialShield().flujo_cobro_dinamico_sensible?.componentes_ensamblaje;

  if (!components) {
    return (
      `${buildPaymentMirror(userText, numerology)}\n\n` +
      'Apenas estamos viendo la superficie de tus señales y hay un patrón mucho más profundo que merece una lectura completa.\n\n' +
      'Si deseas abrir tu sesión de 30 minutos, la contribución es de *S/ 4.90* vía Yape al *952 989 503*. Quedo aquí en serenidad esperando tu captura para revelarte todo. ¿Te gustaría?'
    );
  }

  const mirror = buildPaymentMirror(userText, numerology);
  const bridge = formatWhatsAppMarkdown(components['2_frase_puente_fija'] || '');
  const cta = formatWhatsAppMarkdown(components['3_llamado_accion_comercial_fijo'] || '');

  return `${mirror}\n\n${bridge}\n\n${cta}`;
}

function buildSessionClosing(numerology) {
  const closingText =
    getPostCobroArch().gatillo_cierre_min_30?.texto_salida_fijo ||
    getCommercialShield().validacion_pago?.flujo_despedida_retorno?.texto_referencial ||
    'Tu sesión de 30 minutos ha culminado con armonía. Tu color protector está activo por 24 horas y el Oráculo queda aquí en sintonía con tu caminar para cuando decidas volver. Hasta luego.';

  return (
    `${closingText}\n\n` +
    `🎨 *Color protector:* ${numerology.color || numerology.dayColor}\n` +
    `🔮 *Número de la suerte:* ${numerology.dayNumber}`
  );
}

function getUiPolicy() {
  const brain = loadBrain();
  if (brain.politicas_longitud) {
    const pre = brain.politicas_longitud.fase_pre_cobro || {};
    const post = brain.politicas_longitud.fase_post_cobro || {};
    return {
      longitud_embudo_gratis: `Entre ${pre.min_palabras || 35} y ${pre.max_palabras || 75} palabras (${pre.oraciones || 3} oraciones).`,
      longitud_maxima_respuesta: `Entre ${post.min_palabras || 50} y ${post.max_palabras || 100} palabras (máximo ${post.oraciones || 4} oraciones).`,
      estructura_mensaje_lectura: [
        'Oración 1 (Espejo): validación con palabras ancla + metáfora andina.',
        'Oración 2 (Loop abierto): diagnóstico causal sin soluciones prematuras.',
        'Oración 3 (Bifurcación): pregunta cerrada de dos opuestos emocionales.',
      ],
    };
  }

  return brain.politica_interfaz_usuario || {};
}

function getPaidSessionLengthPolicy() {
  return (
    getUiPolicy().longitud_maxima_respuesta ||
    'Entre 3 y 5 oraciones por mensaje. Desarrolla la lectura con profundidad.'
  );
}

function getFreeFunnelLengthPolicy() {
  return (
    getUiPolicy().longitud_embudo_gratis ||
    'Entre 2 y 4 oraciones más una pregunta de enfoque.'
  );
}

function buildFreeFunnelChatPrompt(step, numerology) {
  const lifeArchetype = getArchetype(numerology.lifePath) || getArchetype(22);
  const linguistics = getLinguistics();
  const uiPolicy = getUiPolicy();
  const pre = getPreCobroArch();

  const phaseRule =
    step === 'after_first_signal'
      ? `Fase: ${pre.mensaje_3_oraculo?.tipo || 'AISLAMIENTO_RAÍZ'} — ${pre.mensaje_3_oraculo?.regla || 'Aislar la Piedra con dilema interno y bifurcación A/B.'} NO menciones pago ni Yape.`
      : `Fase: ${pre.mensaje_2_oraculo?.tipo || 'LECTURA_SUPERFICIE'} — ${pre.mensaje_2_oraculo?.regla || 'Mapear el Río con espejo + loop abierto + bifurcación.'} NO menciones pago ni Yape.`;

  const astroLine = numerology.zodiacSign
    ? `- Signo: ${numerology.zodiacSign} (${numerology.zodiacElement || 'elemento'})\n`
    : '';

  return (
    `Eres El Oráculo Andino — guía sabio en WhatsApp. Hablas humano, sereno y contextualizado.\n\n` +
    `AÑO ACTUAL: ${new Date().getFullYear()} (usar siempre el año del servidor, nunca un año fijo).\n\n` +
    `IDIOMA: responde en el idioma del usuario (español o inglés).\n\n` +
    `${phaseRule}\n\n` +
    `LONGITUD: ${getFreeFunnelLengthPolicy()}\n` +
    `ESTRUCTURA: ${(uiPolicy?.estructura_mensaje_lectura || []).join(' ')}\n\n` +
    `METODOLOGÍA: Río = lo que fluye; Piedra = bloqueo; Montaña = evolución.\n\n` +
    `NUMEROLOGÍA:\n` +
    `- Camino de vida ${numerology.lifePath}: ${lifeArchetype.nombre}\n` +
    `- Señal enviada: ${lifeArchetype.senal_gratuita}\n` +
    `- Color protector 24h: ${lifeArchetype.color || numerology.color}\n` +
    astroLine +
    `\nREGLAS:\n` +
    `1. Responde SOLO a lo que el usuario acaba de decir; usa sus palabras ancla.\n` +
    `2. Si el usuario hace una pregunta directa, respóndela primero antes de profundizar.\n` +
    `3. PROHIBIDO plantillas genéricas, repetir textualmente al usuario o frases sin sentido.\n` +
    `4. Tono: ${(linguistics.palabras_permitidas || []).slice(0, 8).join(', ')}. Evita: ${(linguistics.palabras_prohibidas || []).join(', ')}.\n\n` +
    buildEmbeddedKnowledgeContext()
  );
}

function buildPaidSessionSystemPrompt() {
  const brain = loadBrain();
  const linguistics = getLinguistics();
  const uiPolicy = getUiPolicy();
  const hallucination = brain.blindaje_contra_alucinaciones;
  const post = getPostCobroArch();
  const minutes = getPaidSessionMinutes();

  return (
    `Eres el Oráculo Andino en una sesión PAGADA por WhatsApp (${minutes} minutos).\n\n` +
    `AÑO ACTUAL: ${new Date().getFullYear()} (usar siempre el año del servidor, nunca un año fijo).\n\n` +
    `ESTADO ACTUAL: El usuario YA pagó. La sesión está ABIERTA. El cobro ya terminó.\n` +
    `REGLA INQUEBRANTABLE: NUNCA pidas Yape, Plin, captura, comprobante, S/ 4.90, contribución ni "abrir sesión".\n` +
    `REGLA DE RESPUESTA: Responde PRIMERO la pregunta literal del usuario.\n` +
    `BLOQUES POST-COBRO:\n` +
    `- 0-10 min: ${post.bloque_1_min_0_10?.fase || 'El Desglose del Río'} — ${post.bloque_1_min_0_10?.ejecucion || ''}\n` +
    `- 10-20 min: ${post.bloque_2_min_10_20?.fase || 'La Extracción de la Piedra'} — ${post.bloque_2_min_10_20?.ejecucion || ''}\n` +
    `- 20-30 min: ${post.bloque_3_min_20_30?.fase || 'La Conquista de la Montaña'} — ${post.bloque_3_min_20_30?.ejecucion || ''}\n\n` +
    `LONGITUD: ${getPaidSessionLengthPolicy()}\n` +
    `PROFUNDIDAD: Desarrolla cada respuesta; evita mensajes telegráficos.\n` +
    `ESTRUCTURA: ${(uiPolicy?.estructura_mensaje_lectura || []).join(' ')}\n` +
    `Palabras permitidas: ${(linguistics.palabras_permitidas || []).join(', ')}.\n` +
    `Palabras PROHIBIDAS: ${(linguistics.palabras_prohibidas || []).join(', ')}.\n` +
    `ALUCINACIONES: ${hallucination?.prohibicion_estricta || 'No inventes hechos concretos.'}\n` +
    `Enfoque válido: ${hallucination?.enfoque_valido || 'Tendencias, emociones y patrones.'}\n\n` +
    buildPaidSessionKnowledgeContext()
  );
}

module.exports = {
  loadBrain,
  loadInstruction,
  getArchetype,
  getWelcomeMessages,
  pickRandom,
  buildFirstFreeSignalMessage,
  buildSecondFreeSignalMessage,
  buildFirstSignalClarification,
  buildSecondSignalClarification,
  buildConversationalFunnelReply,
  buildFreeFunnelChatPrompt,
  isExplanationRequest,
  isUncertaintyMessage,
  isShortAmbiguousMessage,
  isDeclineMessage,
  isSubstantiveMessage,
  detectUserTheme,
  buildFreeSignalsMessage,
  buildPaymentWallMessage,
  buildPaymentMirror,
  needsUserClarification,
  buildUserClarificationReply,
  buildReassuranceFunnelReply,
  isReassuranceQuestion,
  buildGreetAndPaymentMessage,
  buildSessionClosing,
  buildPaidSessionSystemPrompt,
  buildPaidSessionKnowledgeContext,
  buildPaidSessionScopeReply,
  buildPaidSessionFallbackReply,
  isPaymentWallLikeReply,
  isSessionScopeQuestion,
  isQuestionChallenge,
  isInstitutionalQuestion,
  buildInstitutionalReply,
  buildRepurchaseWallMessage,
  wantsRepurchaseSession,
  loadAstroDictionary,
  buildKnowledgeSourceGuard,
  buildEmbeddedKnowledgeContext,
  getMinorRejectedMessage,
  getPaymentConfirmedMessage,
  getPaymentFreezeMessage,
  BRAIN_PATH,
  INSTRUCTION_PATH,
  ASTRO_DICT_PATH,
};
