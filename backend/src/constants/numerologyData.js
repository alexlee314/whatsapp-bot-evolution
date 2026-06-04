const NUMBER_MEANINGS = {
  1: { meaning: 'Inicios, liderazgo, acción', color: 'Rojo' },
  2: { meaning: 'Unión, sensibilidad, cooperación', color: 'Blanco' },
  3: { meaning: 'Creatividad, comunicación, alegría', color: 'Amarillo' },
  4: { meaning: 'Orden, disciplina, estabilidad', color: 'Verde' },
  5: { meaning: 'Cambio, movimiento, libertad', color: 'Celeste' },
  6: { meaning: 'Amor, armonía, familia', color: 'Rosado' },
  7: { meaning: 'Sabiduría, introspección, espiritualidad', color: 'Morado' },
  8: { meaning: 'Poder, éxito, abundancia', color: 'Gris' },
  9: { meaning: 'Cierre, generosidad, humanidad', color: 'Dorado' },
  11: { meaning: 'Intuición profunda y maestría espiritual', color: 'Plateado' },
  22: { meaning: 'Constructor de grandes logros', color: 'Azul oscuro' },
};

const SIGNAL_1_BANK = {
  1: 'Estás en un momento ideal para abrir trocha y arrancar ese proyecto con punche. Tienes todo para liderar.',
  2: 'Tu intuición está fuerte estos días. Busca conciliar, no cargues todo tú solo y apóyate en los tuyos.',
  3: 'Tu entorno necesita de tu buena onda y tu palabra. Es una etapa genial para comunicar y aclarar las cosas.',
  4: 'Es tiempo de poner orden en tus pendientes y en la mente. Construye tus bases con paciencia, paso a paso.',
  5: 'Se vienen vientos de cambio y movimiento. No le tengas miedo a lo nuevo, adáptate y sácale provecho.',
  6: 'Tu energía hoy se centra en los afectos y el hogar. Es un momento hermoso para cuidar y dejarte cuidar por los tuyos.',
  7: 'Tus números piden una pequeña pausa. Regálate un momento contigo mismo para pensar frío antes de decidir.',
  8: 'Hay una vibración fuerte de abundancia y enfoque en tu chamba. Ponle ganas porque tu esfuerzo va a dar frutos.',
  9: 'Estás cerrando un ciclo importante en tu vida. Agradece lo aprendido, suelta lo que pesa y avanza libre.',
  11: 'Tienes una conexión y una corazonada muy fuerte activada hoy. Hazle caso a tu sexto sentido, no falla.',
  22: 'Tienes una conexión y una corazonada muy fuerte activada hoy. Hazle caso a tu sexto sentido, no falla.',
};

const COLOR_SIGNAL_BANK = {
  Rojo: 'Te da la fuerza y la energía para tomar decisiones rápidas y sin dudar.',
  Blanco: 'Te trae la paz mental que necesitas para limpiar las malas vibras a tu alrededor.',
  Amarillo: 'Activa tu chispa creativa y te ayuda a conectar mejor con la gente.',
  Verde: 'Te da el equilibrio y la paciencia para avanzar sobre seguro en tus planes.',
  Celeste: 'Te recuerda que la flexibilidad abre puertas; adáptate al momento.',
  Rosado: 'Suma armonía en tus relaciones personales y te ayuda a empatizar con los demás.',
  Morado: 'Te conecta con tu sabiduría interna; es un buen día para analizar las cosas a fondo.',
  Gris: 'Te impulsa a enfocarte en tus metas materiales y en la organización de tu dinero.',
  Dorado: 'Atrae el desprendimiento positivo; cuando dejas ir lo viejo, llega lo mejor.',
  Plateado: 'Dispara tu sensibilidad; confía en lo que sientes a primera vista.',
  'Azul oscuro':
    'Te da la visión a largo plazo para construir proyectos grandes e importantes.',
};

const MYSTIC_SYMBOLS = ['Huayruro', 'Chakana', 'Velita blanca', 'Amuleto de cuarzo'];

const SESSION_END_TRIGGERS = [
  'terminar',
  'finalizar',
  'cerrar sesión',
  'cerrar sesion',
  'eso es todo',
  'ya no más',
  'ya no mas',
  'gracias por todo',
  'hasta aquí',
  'hasta aqui',
];

module.exports = {
  NUMBER_MEANINGS,
  SIGNAL_1_BANK,
  COLOR_SIGNAL_BANK,
  MYSTIC_SYMBOLS,
  SESSION_END_TRIGGERS,
};
