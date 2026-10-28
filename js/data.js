(function (root) {
  const CARD_LIST = [];

  const front3 = [[1, -1], [1, 0], [1, 1]];
  const front6 = [[1, -1], [1, 0], [1, 1], [2, -1], [2, 0], [2, 1]];
  const all8 = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const line2 = [[1, 0], [2, 0]];
  const cross4 = [[-1, 0], [0, -1], [0, 1], [1, 0]];

  function define(def) {
    CARD_LIST.push(Object.assign({
      kind: 'attack',
      cost: 0,
      damage: 0,
      pattern: [],
      icon: 'slash',
      tone: 'ink',
      rarity: 'base',
      label: 'Tajo'
    }, def));
  }

  define({ id: 'move-fwd', name: 'Avanzar', kind: 'move', move: { x: 1, y: 0 }, icon: 'step', label: 'Movimiento', tone: 'ink', desc: 'Avanza una casilla hacia el rival.', flavor: 'El primer paso siempre pesa más.' });
  define({ id: 'move-back', name: 'Retroceder', kind: 'move', move: { x: -1, y: 0 }, icon: 'stepBack', label: 'Movimiento', tone: 'ink', desc: 'Retrocede una casilla.', flavor: 'Ceder terreno no es perder la guerra.' });
  define({ id: 'move-up', name: 'Salto alto', kind: 'move', move: { x: 0, y: -1 }, icon: 'up', label: 'Movimiento', tone: 'ink', desc: 'Muévete una casilla hacia arriba.', flavor: 'Busca el ángulo que nadie vigila.' });
  define({ id: 'move-down', name: 'Salto bajo', kind: 'move', move: { x: 0, y: 1 }, icon: 'down', label: 'Movimiento', tone: 'ink', desc: 'Muévete una casilla hacia abajo.', flavor: 'La sombra también es refugio.' });
  define({ id: 'guard', name: 'Guardia', kind: 'guard', guard: 15, icon: 'shield', label: 'Defensa', tone: 'silver', desc: 'Bloquea hasta 15 de daño en esta acción.', flavor: 'Acero, madera, fe: cualquier cosa sirve.' });
  define({ id: 'focus', name: 'Concentrar', kind: 'energy', gain: 15, icon: 'orb', label: 'Energía', tone: 'jade', desc: 'Recupera 15 de energía.', flavor: 'Respira. El poder llega con el silencio.' });

  define({ id: 'kuro-claw', name: 'Zarpazo', damage: 20, cost: 10, pattern: front3, icon: 'claw', tone: 'red', label: 'Tajo', desc: '20 de daño en las tres casillas frontales.', flavor: 'Tres surcos de acero atraviesan el aire.' });
  define({ id: 'kuro-whirl', name: 'Torbellino de Filos', damage: 30, cost: 25, pattern: [[0, -1], [0, 1], [1, -1], [1, 0], [1, 1]], icon: 'slash', tone: 'red', label: 'Tajo', desc: '30 de daño alrededor del flanco.', flavor: 'La hoja dibuja un círculo perfecto.' });
  define({ id: 'kuro-fang', name: 'Colmillo Lunar', damage: 40, cost: 35, pattern: [[1, -1], [1, 0], [1, 1], [2, 0]], icon: 'fang', tone: 'gold', label: 'Técnica', desc: '40 de daño en un cono amplio.', flavor: 'La luna se tiñe de rojo.' });
  define({ id: 'kuro-fury', name: 'Furia Carmesí', damage: 60, cost: 60, pattern: front6, icon: 'flame', tone: 'red', label: 'Técnica Final', desc: '60 de daño en una marea de colmillos.', flavor: 'El humano duerme. El demonio despierta.' });
  define({ id: 'kuro-red', name: 'Colmillo Rojo', damage: 45, cost: 40, pattern: front6, icon: 'fang', tone: 'red', rarity: 'rare', label: 'Técnica', desc: '45 de daño a media distancia.', flavor: 'Un instinto que atraviesa montañas.' });
  define({ id: 'kuro-iron', name: 'Piel de Hierro', kind: 'guard', guard: 25, cost: 10, icon: 'shield', tone: 'silver', rarity: 'rare', label: 'Defensa', desc: 'Bloquea 25 de daño por 10 de energía.', flavor: 'No hay armadura como la propia piel.' });

  define({ id: 'aiko-arrow', name: 'Flecha Purificadora', damage: 20, cost: 15, pattern: line2, icon: 'arrow', tone: 'ivory', label: 'Disparo', desc: '20 de daño en línea recta a distancia 2.', flavor: 'Luz limpia contra la oscuridad.' });
  define({ id: 'aiko-rain', name: 'Lluvia de Flechas', damage: 30, cost: 25, pattern: front6, icon: 'arrowRain', tone: 'ivory', label: 'Disparo', desc: '30 de daño en una zona de 2x3.', flavor: 'El cielo entero es un carcaj.' });
  define({ id: 'aiko-seal', name: 'Sello Espiritual', damage: 35, cost: 30, pattern: [[1, -1], [1, 0], [1, 1], [2, 0]], icon: 'cross', tone: 'gold', label: 'Técnica', desc: '35 de daño en cruz a distancia.', flavor: 'Un nombre escrito con luz no se borra.' });
  define({ id: 'aiko-dawn', name: 'Flecha del Alba', damage: 60, cost: 60, pattern: [[0, -1], [0, 1], [1, -1], [1, 0], [1, 1], [2, -1], [2, 0], [2, 1]], icon: 'sun', tone: 'gold', label: 'Técnica Final', desc: '60 de daño en un amanecer de energía.', flavor: 'El primer rayo no perdona a los demonios.' });
  define({ id: 'aiko-barrier', name: 'Barrera Sagrada', kind: 'guard', guard: 'all', cost: 20, icon: 'shield', tone: 'ivory', rarity: 'rare', label: 'Defensa', desc: 'Anula por completo el daño de esta acción.', flavor: 'Un círculo de sal y una oración.' });
  define({ id: 'aiko-star', name: 'Flecha Estelar', damage: 55, cost: 55, pattern: [[0, -1], [0, 1], [1, -1], [1, 0], [1, 1], [2, -1], [2, 0], [2, 1]], icon: 'star', tone: 'gold', rarity: 'rare', label: 'Técnica', desc: '55 de daño en una explosión de luz.', flavor: 'Ni el más veloz esquiva una estrella.' });

  define({ id: 'ren-staff', name: 'Bastón Giratorio', damage: 20, cost: 10, pattern: front3, icon: 'staff', tone: 'violet', label: 'Golpe', desc: '20 de daño frente a ti.', flavor: 'El bastón pesa menos que la culpa.' });
  define({ id: 'ren-fist', name: 'Puño Espiritual', damage: 30, cost: 20, pattern: line2, icon: 'fist', tone: 'violet', label: 'Golpe', desc: '30 de daño en línea recta.', flavor: 'El aire se abre como una puerta.' });
  define({ id: 'ren-cyclone', name: 'Torbellino', damage: 35, cost: 30, pattern: all8, icon: 'vortex', tone: 'jade', label: 'Técnica', desc: '35 de daño a todo tu alrededor.', flavor: 'El viento no distingue amigos de enemigos.' });
  define({ id: 'ren-void', name: 'Vórtice Devorador', damage: 60, cost: 70, drain: 15, pattern: front6, icon: 'vortex', tone: 'violet', label: 'Técnica Final', desc: '60 de daño; recupera 15 si acierta.', flavor: 'El vacío siempre cobra su parte.' });
  define({ id: 'ren-sutra', name: 'Sutra de Absorción', damage: 30, cost: 30, drain: 20, pattern: front3, icon: 'scroll', tone: 'gold', rarity: 'rare', label: 'Técnica', desc: '30 de daño; recupera 20 si acierta.', flavor: 'Las palabras beben el aliento del enemigo.' });
  define({ id: 'ren-wind', name: 'Viento del Vacío', damage: 45, cost: 50, pattern: front6, icon: 'wave', tone: 'jade', rarity: 'rare', label: 'Técnica', desc: '45 de daño en una amplia ráfaga.', flavor: 'Hasta los demonios aprenden a temer la brisa.' });

  define({ id: 'suzu-boom', name: 'Bumerán', damage: 20, cost: 15, pattern: [[1, -1], [1, 1], [2, 0]], icon: 'boomerang', tone: 'teal', label: 'Arma', desc: '20 de daño en un arco amplio.', flavor: 'Va, viene y nunca vuelve sola.' });
  define({ id: 'suzu-chain', name: 'Cadena de Acero', damage: 30, cost: 25, pattern: line2, icon: 'chain', tone: 'silver', label: 'Arma', desc: '30 de daño en línea recta.', flavor: 'Cada eslabón recuerda una batalla.' });
  define({ id: 'suzu-kirara', name: 'Llama de Kirara', damage: 30, cost: 30, pattern: all8, icon: 'cat', tone: 'gold', label: 'Técnica', desc: '30 de daño a todo tu alrededor.', flavor: 'Dos colas, un corazón de fuego.' });
  define({ id: 'suzu-spin', name: 'Tajo Giratorio', damage: 55, cost: 55, pattern: front6, icon: 'slash', tone: 'teal', label: 'Técnica Final', desc: '55 de daño en un giro devastador.', flavor: 'El bumerán regresa con intereses.' });
  define({ id: 'suzu-beast', name: 'Kirara Salvaje', damage: 40, cost: 40, pattern: all8, icon: 'cat', tone: 'gold', rarity: 'rare', label: 'Técnica', desc: '40 de daño a todo tu alrededor.', flavor: 'La bestia recuerda su verdadera forma.' });
  define({ id: 'suzu-trap', name: 'Cadena Doble', damage: 35, cost: 30, pattern: [[1, -1], [1, 0], [1, 1], [2, 0]], icon: 'chain', tone: 'silver', rarity: 'rare', label: 'Arma', desc: '35 de daño en un cono de cadenas.', flavor: 'Dos vueltas y el enemigo ya no respira.' });

  define({ id: 'kaze-fan', name: 'Abanico Cortante', damage: 20, cost: 10, pattern: front3, icon: 'fan', tone: 'jade', label: 'Tajo', desc: '20 de daño frente a ti.', flavor: 'Un gesto elegante, un filo invisible.' });
  define({ id: 'kaze-petal', name: 'Danza de Pétalos', damage: 30, cost: 25, pattern: [[1, -1], [1, 1], [2, -1], [2, 1]], icon: 'petal', tone: 'ivory', label: 'Danza', desc: '30 de daño en dos diagonales.', flavor: 'Las flores caen antes que el cuerpo.' });
  define({ id: 'kaze-wind', name: 'Viento Cortante', damage: 40, cost: 35, pattern: front6, icon: 'wave', tone: 'jade', label: 'Danza', desc: '40 de daño en una zona de 2x3.', flavor: 'El aire afila sus propias cuchillas.' });
  define({ id: 'kaze-dragon', name: 'Danza del Dragón', damage: 60, cost: 65, pattern: [[0, -1], [0, 1], [1, -1], [1, 0], [1, 1], [2, -1], [2, 0], [2, 1]], icon: 'dragon', tone: 'gold', label: 'Técnica Final', desc: '60 de daño en una espiral de vendaval.', flavor: 'El dragón no danza para ti.' });
  define({ id: 'kaze-death', name: 'Danza de la Muerte', damage: 50, cost: 50, pattern: front6, icon: 'dragon', tone: 'jade', rarity: 'rare', label: 'Danza', desc: '50 de daño en una danza imparable.', flavor: 'El último compás siempre es silencioso.' });
  define({ id: 'kaze-breeze', name: 'Brisa Sanadora', kind: 'heal', heal: 25, gain: 15, cost: 30, icon: 'feather', tone: 'jade', rarity: 'rare', label: 'Curación', desc: 'Recupera 25 de vida y 15 de energía.', flavor: 'Un viento que recuerda cómo estar entero.' });

  define({ id: 'ryu-rush', name: 'Embestida', damage: 25, cost: 15, pattern: line2, icon: 'fang', tone: 'blue', label: 'Carga', desc: '25 de daño en línea recta.', flavor: 'La manada no frena.' });
  define({ id: 'ryu-claw', name: 'Garra Lunar', damage: 30, cost: 25, pattern: front3, icon: 'claw', tone: 'silver', label: 'Carga', desc: '30 de daño frente a ti.', flavor: 'La luna guía cada zarpazo.' });
  define({ id: 'ryu-howl', name: 'Aullido', damage: 20, cost: 10, pattern: [[0, -1], [0, 1], [1, 0]], icon: 'moon', tone: 'blue', label: 'Carga', desc: '20 de daño alrededor del flanco.', flavor: 'El aullido llama a algo peor.' });
  define({ id: 'ryu-pack', name: 'Furia de la Manada', damage: 55, cost: 55, pattern: front6, icon: 'wolf', tone: 'blue', label: 'Técnica Final', desc: '55 de daño en una carga de lobos.', flavor: 'No estás luchando contra uno.' });
  define({ id: 'ryu-savage', name: 'Manada Salvaje', damage: 45, cost: 45, pattern: all8, icon: 'wolf', tone: 'blue', rarity: 'rare', label: 'Técnica', desc: '45 de daño a todo tu alrededor.', flavor: 'La noche se llena de ojos.' });
  define({ id: 'ryu-hide', name: 'Piel de Lobo', kind: 'guard', guard: 25, cost: 10, icon: 'shield', tone: 'silver', rarity: 'rare', label: 'Defensa', desc: 'Bloquea 25 de daño por 10 de energía.', flavor: 'El pelaje endurece bajo la luna.' });

  define({ id: 'sei-whip', name: 'Látigo de Luz', damage: 25, cost: 20, pattern: [[1, 0], [2, -1], [2, 0], [2, 1]], icon: 'whip', tone: 'gold', label: 'Técnica', desc: '25 de daño a distancia media.', flavor: 'La luz obedece a quien no duda.' });
  define({ id: 'sei-claw', name: 'Garra Venenosa', damage: 30, cost: 25, pattern: [[1, -1], [1, 1], [2, -1], [2, 1]], icon: 'claw', tone: 'violet', label: 'Técnica', desc: '30 de daño en diagonales.', flavor: 'Ni el veneno se atreve a tocarle.' });
  define({ id: 'sei-invest', name: 'Investidura', damage: 40, cost: 35, pattern: all8, icon: 'lightning', tone: 'gold', label: 'Técnica', desc: '40 de daño a todo tu alrededor.', flavor: 'El poder de un señor no se discute.' });
  define({ id: 'sei-dragon', name: 'Dragón Celestial', damage: 70, cost: 80, pattern: [[0, -1], [0, 1], [1, -1], [1, 0], [1, 1], [2, -1], [2, 0], [2, 1]], icon: 'dragon', tone: 'gold', label: 'Técnica Final', desc: '70 de daño en una estela celestial.', flavor: 'El cielo recuerda el nombre de Seiryu.' });
  define({ id: 'sei-mandate', name: 'Mandato Celestial', damage: 60, cost: 60, pattern: all8, icon: 'sun', tone: 'gold', rarity: 'rare', label: 'Técnica', desc: '60 de daño a todo tu alrededor.', flavor: 'Una orden que la tormenta no ignora.' });
  define({ id: 'sei-lash', name: 'Látigo Doble', damage: 35, cost: 25, pattern: [[1, -1], [1, 0], [1, 1], [2, 0]], icon: 'whip', tone: 'ivory', rarity: 'rare', label: 'Técnica', desc: '35 de daño en un latigazo amplio.', flavor: 'Dos chasquidos, una sola sentencia.' });

  define({ id: 'mur-cloud', name: 'Nube Tóxica', damage: 20, cost: 15, pattern: front3, icon: 'cloud', tone: 'violet', label: 'Miasma', desc: '20 de daño frente a ti.', flavor: 'El aire se vuelve una mentira.' });
  define({ id: 'mur-tendril', name: 'Zarcillos', damage: 30, cost: 25, pattern: [[1, -1], [1, 0], [1, 1], [2, 0]], icon: 'vine', tone: 'jade', label: 'Miasma', desc: '30 de daño en un cono de raíces.', flavor: 'La tierra recuerda a sus muertos.' });
  define({ id: 'mur-miasma', name: 'Miasma', damage: 35, cost: 35, pattern: all8, icon: 'eye', tone: 'violet', label: 'Miasma', desc: '35 de daño a todo tu alrededor.', flavor: 'Nadie respira cerca del trono.' });
  define({ id: 'mur-abyss', name: 'Abismo', damage: 65, cost: 75, drain: 15, pattern: front6, icon: 'portal', tone: 'violet', label: 'Técnica Final', desc: '65 de daño; recupera 15 si acierta.', flavor: 'La oscuridad abre la boca.' });
  define({ id: 'mur-devour', name: 'Abismo Devorador', damage: 50, cost: 60, drain: 25, pattern: front6, icon: 'portal', tone: 'violet', rarity: 'rare', label: 'Miasma', desc: '50 de daño; recupera 25 si acierta.', flavor: 'Todo lo que cae, alimenta.' });
  define({ id: 'mur-choke', name: 'Nube Asfixiante', damage: 35, cost: 35, pattern: all8, icon: 'cloud', tone: 'jade', rarity: 'rare', label: 'Miasma', desc: '35 de daño a todo tu alrededor.', flavor: 'El último aliento sabe a ceniza.' });

  define({ id: 'adv-step2', name: 'Paso Fantasma', kind: 'move', move: { x: 2, y: 0 }, icon: 'step', tone: 'jade', rarity: 'common', label: 'Movimiento', desc: 'Avanza dos casillas.', flavor: 'Entre un latido y el siguiente.' });
  define({ id: 'adv-back2', name: 'Retirada Doble', kind: 'move', move: { x: -2, y: 0 }, icon: 'stepBack', tone: 'jade', rarity: 'common', label: 'Movimiento', desc: 'Retrocede dos casillas.', flavor: 'Vivir es saber cuándo desaparecer.' });
  define({ id: 'adv-perfect', name: 'Guardia Perfecta', kind: 'guard', guard: 'all', cost: 25, icon: 'shield', tone: 'gold', rarity: 'common', label: 'Defensa', desc: 'Anula por completo el daño de esta acción.', flavor: 'Ni un rasguño. Ni una grieta.' });
  define({ id: 'adv-meditate', name: 'Respiración Profunda', kind: 'energy', gain: 30, icon: 'orb', tone: 'jade', rarity: 'common', label: 'Energía', desc: 'Recupera 30 de energía.', flavor: 'El manantial está dentro.' });
  define({ id: 'adv-heal', name: 'Recuperación', kind: 'heal', heal: 40, cost: 60, icon: 'lotus', tone: 'jade', rarity: 'common', label: 'Curación', desc: 'Recupera 40 de vida.', flavor: 'La carne obedece a la voluntad.' });
  define({ id: 'adv-punish', name: 'Castigo de la Sacerdotisa', damage: 80, cost: 100, pattern: all8, icon: 'moon', tone: 'gold', rarity: 'common', label: 'Técnica Final', desc: '80 de daño a todo tu alrededor.', flavor: 'Un amor convertido en sentencia.' });
  define({ id: 'adv-fox', name: 'Invocar Zorro', damage: 15, cost: 15, pattern: front3, icon: 'fox', tone: 'gold', rarity: 'common', label: 'Invocación', desc: '15 de daño frente a ti.', flavor: 'Tres colas, cero paciencia.' });
  define({ id: 'adv-wolves', name: 'Invocar Lobos', damage: 25, cost: 40, pattern: all8, icon: 'wolf', tone: 'blue', rarity: 'common', label: 'Invocación', desc: '25 de daño a todo tu alrededor.', flavor: 'La manada responde al colmillo.' });
  define({ id: 'adv-kirara', name: 'Invocar Kirara', damage: 20, cost: 20, pattern: all8, icon: 'cat', tone: 'gold', rarity: 'common', label: 'Invocación', desc: '20 de daño a todo tu alrededor.', flavor: 'Un fuego pequeño con dos colas.' });
  define({ id: 'adv-jaken', name: 'Invocar Jaken', damage: 25, cost: 15, pattern: [[1, -1], [1, 1], [-1, -1], [-1, 1]], icon: 'imp', tone: 'jade', rarity: 'common', label: 'Invocación', desc: '25 de daño en las cuatro diagonales.', flavor: 'Pequeno, ruidoso, sorprendentemente útil.' });
  define({ id: 'adv-demons', name: 'Invocar Demonios', damage: 20, cost: 20, pattern: all8, icon: 'demon', tone: 'violet', rarity: 'common', label: 'Invocación', desc: '20 de daño a todo tu alrededor.', flavor: 'La oscuridad siempre tiene hijos.' });
  define({ id: 'adv-cross', name: 'Tajo Cruzado', damage: 35, cost: 30, pattern: cross4, icon: 'slash', tone: 'silver', rarity: 'common', label: 'Tajo', desc: '35 de daño en cruz a tu alrededor.', flavor: 'Dos líneas. Un solo movimiento.' });
  define({ id: 'adv-drain', name: 'Absorción', damage: 25, cost: 30, drain: 20, pattern: front3, icon: 'scroll', tone: 'violet', rarity: 'common', label: 'Técnica', desc: '25 de daño; recupera 20 si acierta.', flavor: 'Su fuerza se convierte en la tuya.' });
  define({ id: 'adv-snipe', name: 'Tiro Certero', damage: 40, cost: 35, pattern: [[2, 0]], icon: 'arrow', tone: 'ivory', rarity: 'common', label: 'Disparo', desc: '40 de daño a dos casillas de distancia.', flavor: 'No hay segunda flecha.' });
  define({ id: 'adv-line', name: 'Lanza Espiritual', damage: 35, cost: 30, pattern: line2, icon: 'lightning', tone: 'gold', rarity: 'common', label: 'Técnica', desc: '35 de daño en línea recta.', flavor: 'Una sola dirección, sin retorno.' });

  define({ id: 'jade-legend', name: 'Poder del Jade', damage: 50, cost: 40, heal: 20, pattern: all8, icon: 'jade', tone: 'jade', rarity: 'legend', label: 'Jade', desc: '50 de daño a tu alrededor y recupera 20.', flavor: 'Cinco fragmentos. Una voluntad.' });

  const CARDS = {};
  for (const card of CARD_LIST) CARDS[card.id] = card;

  const BASE = ['move-fwd', 'move-back', 'move-up', 'move-down', 'guard', 'focus'];

  const CHARACTERS = [
    {
      id: 'kurogane',
      name: 'Kurogane',
      title: 'El Medio Demonio',
      style: 'Asalto frontal',
      tone: 'red',
      hp: 105,
      energy: 50,
      bio: 'Mitad humano, mitad colmillo. Busca el Jade para dejar de ser un extranjero en ambos mundos.',
      taunt: 'No necesito un deseo. Solo un rival que no huya.',
      deck: BASE.concat(['kuro-claw', 'kuro-whirl', 'kuro-fang', 'kuro-fury']),
      exclusives: ['kuro-red', 'kuro-iron']
    },
    {
      id: 'aiko',
      name: 'Aiko',
      title: 'La Sacerdotisa',
      style: 'Control a distancia',
      tone: 'ivory',
      hp: 95,
      energy: 60,
      bio: 'Guardiana de un templo en ruinas. Cada flecha suya recuerda el nombre de los caídos.',
      taunt: 'La luz no pide permiso para entrar.',
      deck: BASE.concat(['aiko-arrow', 'aiko-rain', 'aiko-seal', 'aiko-dawn']),
      exclusives: ['aiko-barrier', 'aiko-star']
    },
    {
      id: 'ren',
      name: 'Ren',
      title: 'El Monje Errante',
      style: 'Zona y drenaje',
      tone: 'violet',
      hp: 100,
      energy: 55,
      bio: 'Un monje que sonríe demasiado y reza muy poco. Su bastón guarda deudas antiguas.',
      taunt: 'Rezo por tu alma. También por mi bolsillo.',
      deck: BASE.concat(['ren-staff', 'ren-fist', 'ren-cyclone', 'ren-void']),
      exclusives: ['ren-sutra', 'ren-wind']
    },
    {
      id: 'suzu',
      name: 'Suzu',
      title: 'La Cazadora',
      style: 'Área y presión',
      tone: 'teal',
      hp: 100,
      energy: 50,
      bio: 'Cazadora de demonios con una bestia de dos colas. No falla dos veces el mismo tiro.',
      taunt: 'Tú no eres mi presa. Eso es lo único que te salva.',
      deck: BASE.concat(['suzu-boom', 'suzu-chain', 'suzu-kirara', 'suzu-spin']),
      exclusives: ['suzu-beast', 'suzu-trap']
    },
    {
      id: 'kaze',
      name: 'Kaze',
      title: 'La Hechicera del Viento',
      style: 'Danza amplia',
      tone: 'jade',
      hp: 95,
      energy: 60,
      bio: 'Nació en una jaula de plumas. Ahora cada vendaval es un paso de su danza.',
      taunt: 'Baila conmigo. El viento decide quién se cansa primero.',
      deck: BASE.concat(['kaze-fan', 'kaze-petal', 'kaze-wind', 'kaze-dragon']),
      exclusives: ['kaze-death', 'kaze-breeze']
    },
    {
      id: 'ryu',
      name: 'Ryu',
      title: 'El Lobo Demonio',
      style: 'Carga y presión',
      tone: 'blue',
      hp: 105,
      energy: 45,
      bio: 'Caudillo de una manada que solo obedece a la luna. Corre más rápido que su propia sombra.',
      taunt: 'La manada ya huele tu miedo.',
      deck: BASE.concat(['ryu-rush', 'ryu-claw', 'ryu-howl', 'ryu-pack']),
      exclusives: ['ryu-savage', 'ryu-hide']
    },
    {
      id: 'seiryu',
      name: 'Seiryu',
      title: 'El Señor Demonio',
      style: 'Alcance y poder',
      tone: 'gold',
      hp: 115,
      energy: 55,
      bio: 'Un señor de la tormenta que considera el torneo una molestia necesaria. Su látigo no conoce rival.',
      taunt: 'Arrodíllate y quizá recuerde tu nombre.',
      deck: BASE.concat(['sei-whip', 'sei-claw', 'sei-invest', 'sei-dragon']),
      exclusives: ['sei-mandate', 'sei-lash']
    },
    {
      id: 'muraki',
      name: 'Muraki',
      title: 'El Demonio Oscuro',
      style: 'Miasma y resistencia',
      tone: 'violet',
      hp: 100,
      energy: 60,
      bio: 'Nadie sabe qué esconde bajo esa sonrisa. El miasma que lo rodea susurra nombres olvidados.',
      taunt: 'Todos los caminos terminan dentro de mí.',
      deck: BASE.concat(['mur-cloud', 'mur-tendril', 'mur-miasma', 'mur-abyss']),
      exclusives: ['mur-devour', 'mur-choke']
    }
  ];

  const CHARACTER_MAP = {};
  for (const character of CHARACTERS) CHARACTER_MAP[character.id] = character;

  const MYSTERY_COMMON = [
    'adv-step2', 'adv-back2', 'adv-perfect', 'adv-meditate', 'adv-heal',
    'adv-punish', 'adv-fox', 'adv-wolves', 'adv-kirara', 'adv-jaken',
    'adv-demons', 'adv-cross', 'adv-drain', 'adv-snipe', 'adv-line'
  ];

  const DIFFICULTIES = {
    easy: { id: 'easy', name: 'Fácil', blurb: 'La IA duda y ataca sin calcular.', samples: 0, candidates: 0 },
    normal: { id: 'normal', name: 'Normal', blurb: 'La IA anticipa tus movimientos.', samples: 6, candidates: 140 },
    hard: { id: 'hard', name: 'Difícil', blurb: 'La IA busca la mejor línea posible.', samples: 10, candidates: 420 }
  };

  function getCard(id) {
    return CARDS[id];
  }

  function character(id) {
    return CHARACTER_MAP[id];
  }

  function rewardPool(characterId) {
    const data = CHARACTER_MAP[characterId];
    return MYSTERY_COMMON.concat(data ? data.exclusives : []);
  }

  function attackCells(card, x, y, facing) {
    if (!card.pattern || !card.pattern.length) return [];
    return card.pattern.map(([dx, dy]) => ({ x: x + dx * facing, y: y + dy }))
      .filter((cell) => cell.x >= 0 && cell.x < 5 && cell.y >= 0 && cell.y < 3);
  }

  function displayPattern(card, facing) {
    const cells = [];
    const dir = facing || 1;
    if (!card.pattern) return cells;
    for (const [dx, dy] of card.pattern) {
      const cx = 2 + dx * dir;
      const cy = 1 + dy;
      if (cx >= 0 && cx < 5 && cy >= 0 && cy < 3) cells.push({ x: cx, y: cy });
    }
    return cells;
  }

  function displayMove(card, facing) {
    if (!card.move) return null;
    const dir = facing || 1;
    return { x: 2 + card.move.x * dir, y: 1 + card.move.y };
  }

  root.DT = {
    CARDS,
    CARD_LIST,
    CHARACTERS,
    CHARACTER_MAP,
    BASE,
    MYSTERY_COMMON,
    DIFFICULTIES,
    getCard,
    character,
    rewardPool,
    attackCells,
    displayPattern,
    displayMove
  };
})(typeof window !== 'undefined' ? window : globalThis);
