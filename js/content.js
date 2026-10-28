export const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
export const SUITS = ["S", "H", "C", "D"];
export const SUIT_INFO = {
  S: { name: "Picas", symbol: "♠", color: "black" },
  H: { name: "Corazones", symbol: "♥", color: "red" },
  C: { name: "Tréboles", symbol: "♣", color: "black" },
  D: { name: "Diamantes", symbol: "♦", color: "red" },
};
export const RANK_LABEL = { 11: "J", 12: "Q", 13: "K", 14: "A" };
export const rankLabel = (r) => RANK_LABEL[r] || String(r);
export const rankChips = (r) => (r === 14 ? 11 : r >= 11 ? 10 : r);
export const isFace = (c) => c.rank >= 11 && c.rank <= 13;
export const isEven = (c) => [2, 4, 6, 8, 10].includes(c.rank);
export const isOdd = (c) => [14, 3, 5, 7, 9].includes(c.rank);

export const HAND_ORDER = [
  "Flush Five", "Flush House", "Five of a Kind", "Straight Flush", "Four of a Kind",
  "Full House", "Flush", "Straight", "Three of a Kind", "Two Pair", "Pair", "High Card",
];

export const HAND_INFO = {
  "High Card": { name: "Carta Alta", chips: 5, mult: 1, chipLv: 10, multLv: 1 },
  "Pair": { name: "Pareja", chips: 10, mult: 2, chipLv: 15, multLv: 1 },
  "Two Pair": { name: "Doble Pareja", chips: 20, mult: 2, chipLv: 20, multLv: 1 },
  "Three of a Kind": { name: "Trío", chips: 30, mult: 3, chipLv: 20, multLv: 2 },
  "Straight": { name: "Escalera", chips: 30, mult: 4, chipLv: 30, multLv: 3 },
  "Flush": { name: "Color", chips: 35, mult: 4, chipLv: 15, multLv: 2 },
  "Full House": { name: "Full", chips: 40, mult: 4, chipLv: 25, multLv: 2 },
  "Four of a Kind": { name: "Póker", chips: 60, mult: 7, chipLv: 30, multLv: 3 },
  "Straight Flush": { name: "Escalera de Color", chips: 100, mult: 8, chipLv: 40, multLv: 4 },
  "Five of a Kind": { name: "Cinco Iguales", chips: 120, mult: 12, chipLv: 35, multLv: 3 },
  "Flush House": { name: "Full de Color", chips: 140, mult: 14, chipLv: 40, multLv: 4 },
  "Flush Five": { name: "Cinco de Color", chips: 160, mult: 16, chipLv: 50, multLv: 3 },
};

export function handStats(type, level) {
  const h = HAND_INFO[type];
  const lv = Math.max(1, level || 1);
  return {
    chips: h.chips + h.chipLv * (lv - 1),
    mult: h.mult + h.multLv * (lv - 1),
  };
}

export const ENHANCEMENTS = {
  bonus: { name: "Bonus", short: "BON", color: "#1f6f3f", desc: "+30 Chips" },
  mult: { name: "Mult", short: "MUL", color: "#a32b2b", desc: "+4 Mult" },
  wild: { name: "Comodín", short: "WILD", color: "#6b3fa0", desc: "Cuenta como cualquier palo" },
  glass: { name: "Cristal", short: "CRIS", color: "#2b6f8f", desc: "x2 Mult. 1 de 4 se rompe" },
  steel: { name: "Acero", short: "ACER", color: "#4a5a66", desc: "x1.5 Mult en la mano" },
  stone: { name: "Piedra", short: "PIE", color: "#555", desc: "+50 Chips. Sin rango ni palo" },
  gold: { name: "Oro", short: "ORO", color: "#9a7614", desc: "$3 si se queda en la mano" },
  lucky: { name: "Suerte", short: "SUER", color: "#2b8a4a", desc: "1/5 +20 Mult · 1/15 $20" },
};

export const EDITIONS = {
  foil: { name: "Foil", desc: "+50 Chips", cls: "ed-foil", mark: "ed-foil-c" },
  holo: { name: "Holográfica", desc: "+10 Mult", cls: "ed-holo", mark: "ed-holo-c" },
  poly: { name: "Policroma", desc: "x1.5 Mult", cls: "ed-poly", mark: "ed-poly-c" },
  negative: { name: "Negativa", desc: "+1 espacio de comodín", cls: "ed-negative", mark: "" },
};

export const SEALS = {
  red: { name: "Rojo", desc: "Repite la carta", cls: "seal-red" },
  blue: { name: "Azul", desc: "Crea un Planeta al quedarse en la mano", cls: "seal-blue" },
  gold: { name: "Dorado", desc: "$3 al jugarse", cls: "seal-gold" },
  purple: { name: "Púrpura", desc: "Crea un Tarot al descartarse", cls: "seal-purple" },
};

const J = (id, name, rarity, cost, art, text, extra = {}) => ({
  id, name, rarity, cost, art, text, ...extra,
});

const chance = (c, num, den) => {
  const oops = c.state?.oops ? 2 : 1;
  return Math.random() < Math.min(1, (num * oops) / den);
};

export const JOKERS = [
  J("joker", "Comodín", "common", 2, "🃏", "+4 Mult.", { apply: (c) => { c.mult += 4; } }),

  J("greedy", "Codicioso", "common", 5, "♦", "+3 Mult por cada ♦ puntuado.", {
    onCard: (card, c) => { if (card.suit === "D") c.mult += 3; },
  }),
  J("lusty", "Lujurioso", "common", 5, "♥", "+3 Mult por cada ♥ puntuado.", {
    onCard: (card, c) => { if (card.suit === "H") c.mult += 3; },
  }),
  J("wrathful", "Iracundo", "common", 5, "♠", "+3 Mult por cada ♠ puntuado.", {
    onCard: (card, c) => { if (card.suit === "S") c.mult += 3; },
  }),
  J("gluttonous", "Glotón", "common", 5, "♣", "+3 Mult por cada ♣ puntuado.", {
    onCard: (card, c) => { if (card.suit === "C") c.mult += 3; },
  }),

  J("jolly", "Alegre", "common", 3, "😄", "+8 Mult si la mano contiene Pareja.", {
    apply: (c) => { if (["Pair", "Two Pair", "Full House", "Four of a Kind", "Five of a Kind"].includes(c.type)) c.mult += 8; },
  }),
  J("zany", "Chiflado", "common", 4, "🤪", "+12 Mult si contiene Trío.", {
    apply: (c) => { if (["Three of a Kind", "Full House", "Four of a Kind", "Five of a Kind", "Flush House"].includes(c.type)) c.mult += 12; },
  }),
  J("mad", "Loco", "common", 4, "😵", "+10 Mult si contiene Doble Pareja.", {
    apply: (c) => { if (["Two Pair", "Full House", "Flush House"].includes(c.type)) c.mult += 10; },
  }),
  J("crazy", "Demente", "common", 4, "🤡", "+12 Mult si contiene Escalera.", {
    apply: (c) => { if (["Straight", "Straight Flush"].includes(c.type)) c.mult += 12; },
  }),
  J("droll", "Gracioso", "common", 4, "😏", "+10 Mult si contiene Color.", {
    apply: (c) => { if (["Flush", "Straight Flush", "Flush House", "Flush Five"].includes(c.type)) c.mult += 10; },
  }),

  J("sly", "Astuto", "common", 3, "🦊", "+50 Chips si contiene Pareja.", {
    apply: (c) => { if (["Pair", "Two Pair", "Full House", "Four of a Kind", "Five of a Kind"].includes(c.type)) c.chips += 50; },
  }),
  J("wily", "Taimado", "common", 4, "🐺", "+100 Chips si contiene Trío.", {
    apply: (c) => { if (["Three of a Kind", "Full House", "Four of a Kind", "Five of a Kind", "Flush House"].includes(c.type)) c.chips += 100; },
  }),
  J("clever", "Listo", "common", 4, "🧠", "+80 Chips si contiene Doble Pareja.", {
    apply: (c) => { if (["Two Pair", "Full House", "Flush House"].includes(c.type)) c.chips += 80; },
  }),
  J("devious", "Retorcido", "common", 4, "😈", "+100 Chips si contiene Escalera.", {
    apply: (c) => { if (["Straight", "Straight Flush"].includes(c.type)) c.chips += 100; },
  }),
  J("crafty", "Ladino", "common", 4, "🎩", "+80 Chips si contiene Color.", {
    apply: (c) => { if (["Flush", "Straight Flush", "Flush House", "Flush Five"].includes(c.type)) c.chips += 80; },
  }),

  J("half", "Medio Comodín", "common", 5, "🌗", "+20 Mult si juegas 3 cartas o menos.", {
    apply: (c) => { if (c.played.length <= 3) c.mult += 20; },
  }),
  J("abstract", "Abstracto", "common", 4, "🔷", "+3 Mult por cada comodín.", {
    apply: (c) => { c.mult += 3 * c.jokers.length; },
  }),
  J("mystic", "Cumbre Mística", "common", 5, "🏔️", "+15 Mult si no te quedan descartes.", {
    apply: (c) => { if (c.state.discardsLeft <= 0) c.mult += 15; },
  }),
  J("misprint", "Error de Imprenta", "common", 4, "🖨️", "+0 a +23 Mult aleatorio.", {
    apply: (c) => { c.mult += Math.floor(Math.random() * 24); },
  }),
  J("banner", "Estandarte", "common", 5, "🚩", "+30 Chips por cada descarte restante.", {
    apply: (c) => { c.chips += 30 * c.state.discardsLeft; },
  }),
  J("blue", "Comodín Azul", "common", 5, "🔵", "+2 Chips por carta restante en el mazo.", {
    apply: (c) => { c.chips += 2 * c.state.drawPile.length; },
  }),

  J("fibonacci", "Fibonacci", "uncommon", 8, "🌀", "+8 Mult por cada As, 2, 3, 5 u 8 puntuado.", {
    onCard: (card, c) => { if ([14, 2, 3, 5, 8].includes(card.rank)) c.mult += 8; },
  }),
  J("scary", "Cara de Susto", "common", 4, "😱", "+30 Chips por cada figura puntuada.", {
    onCard: (card, c) => { if (isFace(card)) c.chips += 30; },
  }),
  J("even", "Par Perfecto", "common", 4, "➗", "+4 Mult por cada carta par puntuada.", {
    onCard: (card, c) => { if (isEven(card)) c.mult += 4; },
  }),
  J("odd", "Impar Impar", "common", 4, "➕", "+31 Chips por cada carta impar puntuada.", {
    onCard: (card, c) => { if (isOdd(card)) c.chips += 31; },
  }),
  J("scholar", "Erudito", "common", 4, "🎓", "+20 Chips y +4 Mult por cada As puntuado.", {
    onCard: (card, c) => { if (card.rank === 14) { c.chips += 20; c.mult += 4; } },
  }),
  J("business", "Tarjeta de Visita", "common", 4, "💼", "1 de 2 de ganar $2 por cada figura puntuada.", {
    onCard: (card, c) => { if (isFace(card) && chance(c, 1, 2)) c.moneyGain += 2; },
  }),
  J("supernova", "Supernova", "common", 5, "💥", "+1 Mult por cada vez que has jugado esta mano.", {
    apply: (c) => { c.mult += c.state.handPlays[c.type] || 0; },
  }),
  J("ridebus", "Sube al Autobús", "common", 6, "🚌", "+1 Mult por mano seguida sin figuras. Se reinicia con figura.", {
    defaultData: { mult: 0 },
    apply: (c) => { c.mult += c.joker.data.mult; },
    onHandPlayed: (j, state) => {
      const hadFace = state.lastPlayed.some(isFace);
      j.data.mult = hadFace ? 0 : j.data.mult + 1;
    },
  }),
  J("egg", "Huevo", "common", 4, "🥚", "Gana $3 de valor de venta al final de cada ronda.", {
    defaultData: { gained: 0 },
    onRoundEnd: (j) => { j.data.gained += 3; },
  }),

  J("blackboard", "Pizarra", "uncommon", 6, "🖤", "x3 Mult si todas las cartas en la mano son ♠ o ♣.", {
    apply: (c) => {
      if (c.held.length && c.held.every((card) => card.suit === "S" || card.suit === "C")) c.mult *= 3;
    },
  }),
  J("runner", "Corredor", "common", 5, "🏃", "Gana +15 Chips permanentemente al jugar Escalera.", {
    defaultData: { chips: 0 },
    apply: (c) => { c.chips += c.joker.data.chips; },
    onHandPlayed: (j, state) => { if (["Straight", "Straight Flush"].includes(state.lastHandType)) j.data.chips += 15; },
  }),
  J("icecream", "Helado", "common", 5, "🍦", "+100 Chips. Pierde 5 Chips por mano jugada.", {
    defaultData: { chips: 100 },
    apply: (c) => { if (c.joker.data.chips > 0) c.chips += c.joker.data.chips; },
    onHandPlayed: (j) => { j.data.chips = Math.max(0, j.data.chips - 5); },
  }),
  J("splash", "Salpicadura", "common", 3, "💦", "Todas las cartas jugadas puntúan.", { splash: true }),
  J("hiker", "Excursionista", "uncommon", 7, "🥾", "Cada carta jugada gana +5 Chips permanentemente.", {
    apply: (c) => { c.scoring.forEach((card) => { card.bonusChips = (card.bonusChips || 0) + 5; }); },
  }),
  J("green", "Comodín Verde", "common", 5, "🟢", "+1 Mult por mano jugada, -1 por descarte.", {
    defaultData: { mult: 0 },
    apply: (c) => { c.mult += c.joker.data.mult; },
    onHandPlayed: (j) => { j.data.mult += 1; },
    onDiscard: (j) => { j.data.mult = Math.max(0, j.data.mult - 1); },
  }),
  J("parking", "Aparcamiento Reservado", "common", 5, "🅿️", "1 de 2 de ganar $1 por figura en la mano.", {
    onHeld: (card, c) => { if (isFace(card) && chance(c, 1, 2)) c.moneyGain += 1; },
  }),
  J("golden", "Comodín Dorado", "common", 6, "🟡", "Gana $4 al final de la ronda.", {
    onRoundEnd: (j, state) => { state.money += 4; },
  }),
  J("bull", "Toro", "common", 5, "🐂", "+2 Chips por cada $1 que tengas.", {
    apply: (c) => { c.chips += 2 * Math.max(0, c.state.money); },
  }),
  J("bootstraps", "Por su Cuenta", "uncommon", 7, "👢", "+2 Mult por cada $5 que tengas.", {
    apply: (c) => { c.mult += 2 * Math.floor(Math.max(0, c.state.money) / 5); },
  }),
  J("flash", "Tarjeta Relámpago", "uncommon", 7, "⚡", "Gana +2 Mult por cada reroll de tienda.", {
    defaultData: { mult: 0 },
    apply: (c) => { c.mult += c.joker.data.mult; },
    onReroll: (j) => { j.data.mult += 2; },
  }),
  J("trousers", "Pantalones de Repuesto", "uncommon", 7, "👖", "Gana +2 Mult si la mano contiene Doble Pareja.", {
    defaultData: { mult: 0 },
    apply: (c) => {
      if (["Two Pair", "Full House", "Flush House"].includes(c.type)) c.mult += 2 + c.joker.data.mult;
      else c.mult += c.joker.data.mult;
    },
    onHandPlayed: (j, state) => { if (["Two Pair", "Full House", "Flush House"].includes(state.lastHandType)) j.data.mult += 2; },
  }),

  J("dusk", "Anochecer", "uncommon", 8, "🌆", "Repite todas las cartas en la última mano de la ronda.", {
    retriggerAll: (c) => c.state.handsLeft <= 1,
  }),
  J("dawn", "Amanecer", "uncommon", 8, "🌅", "Repite la primera carta puntuada de la ronda.", {
    retrigger: (card, c) => card === c.scoring[0] && c.state.handsPlayedThisRound === 0 ? 1 : 0,
  }),
  J("space", "Comodín Espacial", "uncommon", 6, "🚀", "1 de 4 de mejorar la mano jugada.", {
    apply: (c) => {
      if (chance(c, 1, 4)) {
        c.state.handLevels[c.type] = (c.state.handLevels[c.type] || 1) + 1;
        c.state.pendingToast = `${HAND_INFO[c.type].name} subió a nivel ${c.state.handLevels[c.type]}`;
      }
    },
  }),
  J("burglar", "Ladrón", "uncommon", 8, "🥷", "Al elegir la ciega: +3 manos, -1 descarte.", {
    onBlindStart: (j, state) => { state.handsLeft += 3; state.discardsLeft = Math.max(0, state.discardsLeft - 1); },
  }),
  J("moon", "A la Luna", "uncommon", 8, "🌙", "Interés extra: +$1 por cada $5 (máx. +$5 más).", { interestBonus: 1 }),

  J("baron", "Barón", "rare", 10, "👑", "Cada Rey en la mano da x1.5 Mult.", {
    onHeld: (card, c) => { if (card.rank === 13) { c.mult *= 1.5; c.trigger = true; } },
  }),
  J("shootmoon", "Dispara a la Luna", "uncommon", 8, "🌛", "+13 Mult por cada Reina en la mano.", {
    onHeld: (card, c) => { if (card.rank === 12) c.mult += 13; },
  }),
  J("blueprint", "Plano", "rare", 10, "📐", "Copia el comodín de la derecha.", { copy: "right" }),
  J("brainstorm", "Lluvia de Ideas", "rare", 10, "🧩", "Copia el comodín de la izquierda.", { copy: "left" }),
  J("mime", "Mimo", "uncommon", 8, "🎭", "Repite todas las habilidades de cartas en la mano.", {
    heldRetrigger: () => 1,
  }),
  J("smeared", "Comodín Borroso", "uncommon", 8, "🎨", "♥ y ♦ cuentan como el mismo palo; ♠ y ♣ también.", { smeared: true }),
  J("fourfingers", "Cuatro Dedos", "uncommon", 7, "🖐️", "Colores y escaleras se pueden hacer con 4 cartas.", { fourFingers: true }),
  J("shortcut", "Atajo", "uncommon", 7, "🛝", "Permite escaleras con huecos de 1 rango (2 3 5 6 8).", { shortcut: true }),
  J("oops", "¡Ups! Todo 6", "uncommon", 7, "🎲", "Duplica todas las probabilidades.", { oops: true }),
  J("photo", "Fotografía", "common", 5, "📸", "La primera figura puntuada da x2 Mult.", {
    onCard: (card, c) => {
      if (isFace(card) && !c.flags.photo) { c.flags.photo = true; c.mult *= 2; }
    },
  }),
  J("chad", "Colgado", "uncommon", 8, "👔", "Repite 2 veces la primera carta puntuada.", {
    retrigger: (card, c) => (card === c.scoring[0] ? 2 : 0),
  }),
  J("sock", "Talón y Coturno", "uncommon", 8, "👞", "Repite todas las figuras jugadas.", {
    retrigger: (card) => (isFace(card) ? 1 : 0),
  }),
  J("triboulet", "Triboulet", "legendary", 20, "🤴", "Reyes y Reinas dan x2 Mult cada uno.", {
    onCard: (card, c) => { if (card.rank === 13 || card.rank === 12) { c.mult *= 2; c.trigger = true; } },
  }),
  J("hack", "Hack", "uncommon", 8, "💻", "Repite cada 2, 3, 4 y 5 jugado.", {
    retrigger: (card) => ([2, 3, 4, 5].includes(card.rank) ? 1 : 0),
  }),
  J("dna", "ADN", "rare", 10, "🧬", "Si juegas 1 sola carta, se copia a tu mazo.", {
    apply: (c) => { if (c.played.length === 1) c.createdCards.push({ copyOf: c.played[0] }); },
  }),
  J("midas", "Máscara de Midas", "uncommon", 8, "🎭", "Las figuras jugadas se convierten en Oro.", {
    apply: (c) => { c.scoring.forEach((card) => { if (isFace(card)) card.enhancement = "gold"; }); },
  }),
  J("vampire", "Vampiro", "uncommon", 8, "🧛", "Gana x0.1 Mult por carta mejorada o con edición puntuada.", {
    defaultData: { xmult: 1 },
    apply: (c) => {
      for (const card of c.scoring) {
        if (card.enhancement) c.joker.data.xmult += 0.1;
        if (card.edition) c.joker.data.xmult += 0.1;
      }
      c.mult *= c.joker.data.xmult;
    },
  }),
  J("constellation", "Constelación", "uncommon", 8, "🌟", "Gana x0.1 Mult por cada Planeta usado.", {
    defaultData: { xmult: 1 },
    apply: (c) => { c.mult *= c.joker.data.xmult; },
    onPlanetUsed: (j) => { j.data.xmult += 0.1; },
  }),
  J("hologram", "Holograma", "uncommon", 8, "🔮", "Gana x0.25 Mult por cada carta añadida al mazo.", {
    defaultData: { xmult: 1 },
    apply: (c) => { c.mult *= c.joker.data.xmult; },
    onCardAdded: (j) => { j.data.xmult += 0.25; },
  }),
  J("luckycat", "Gato de la Suerte", "uncommon", 8, "🐈", "Gana x0.25 Mult por cada carta de Suerte activada.", {
    defaultData: { xmult: 1 },
    apply: (c) => { c.mult *= c.joker.data.xmult; },
    onLucky: (j) => { j.data.xmult += 0.25; },
  }),
  J("ramen", "Ramen", "uncommon", 8, "🍜", "x2 Mult. Pierde x0.01 por cada descarte.", {
    defaultData: { xmult: 2 },
    apply: (c) => { c.mult *= c.joker.data.xmult; },
    onDiscard: (j) => { j.data.xmult = Math.max(1, +(j.data.xmult - 0.01).toFixed(2)); },
  }),
  J("campfire", "Hoguera", "rare", 10, "🔥", "Gana x0.5 Mult por cada carta vendida. Se reinicia al ganar una ciega jefe.", {
    defaultData: { xmult: 1 },
    apply: (c) => { c.mult *= c.joker.data.xmult; },
    onSell: (j) => { j.data.xmult += 0.5; },
  }),
  J("cavendish", "Cavendish", "common", 5, "🍌", "x3 Mult. 1 de 1000 de destruirse al final de la ronda.", {
    apply: (c) => { c.mult *= 3; },
    onRoundEnd: (j, state) => { if (chance({ state }, 1, 1000)) j.destroyed = true; },
  }),
  J("cardsharp", "Tahúr", "uncommon", 8, "♠️", "x3 Mult si esta mano ya se jugó esta ronda.", {
    apply: (c) => { if (c.state.playedTypesThisRound.includes(c.type)) c.mult *= 3; },
  }),
  J("square", "Comodín Cuadrado", "common", 5, "⬜", "+4 Chips si juegas exactamente 4 cartas.", {
    apply: (c) => { c.chips += c.joker.data.chips; },
    onHandPlayed: (j, state) => { if (state.lastPlayed.length === 4) j.data.chips += 4; },
    defaultData: { chips: 4 },
  }),
  J("sixthsense", "Sexto Sentido", "uncommon", 8, "👁️", "Si la primera mano es un solo 6, destrúyelo y crea un Espectral.", {
    apply: (c) => {
      if (c.state.handsPlayedThisRound === 0 && c.played.length === 1 && c.played[0].rank === 6) {
        c.destroy.push(c.played[0]);
        c.createdConsumables.push({ kind: "spectral" });
      }
    },
  }),
  J("seance", "Sesión Espiritista", "uncommon", 8, "🕯️", "Si juegas Escalera de Color, crea un Espectral.", {
    apply: (c) => {
      if (c.type === "Straight Flush") c.createdConsumables.push({ kind: "spectral" });
    },
  }),
  J("riffraff", "Chusma", "common", 6, "🐀", "Al elegir la ciega, crea 2 comodines comunes.", {
    onBlindStart: (j, state, api) => api.createRandomJokers(2, "common"),
  }),
  J("chaos", "Caos el Payaso", "uncommon", 7, "🤹", "1 reroll gratis por tienda.", { freeRerolls: 1 }),
  J("ticket", "Billete Dorado", "uncommon", 8, "🎫", "Las cartas de Oro jugadas dan $4.", {
    apply: (c) => { c.played.forEach((card) => { if (card.enhancement === "gold") c.moneyGain += 4; }); },
  }),
  J("bones", "Sr. Huesos", "uncommon", 8, "💀", "Evita la derrota si la puntuación es al menos el 25% del objetivo. Luego se destruye.", { mrBones: true }),
  J("acrobat", "Acróbata", "uncommon", 8, "🤸", "x3 Mult en la última mano de la ronda.", {
    apply: (c) => { if (c.state.handsLeft <= 1) c.mult *= 3; },
  }),
  J("troubadour", "Trovador", "rare", 10, "🎻", "+2 cartas en mano, -1 mano.", { passive: { handSize: 2, hands: -1 } }),
  J("certificate", "Certificado", "uncommon", 8, "📜", "Al empezar la ronda, añade una carta con sello.", {
    onBlindStart: (j, state, api) => api.addRandomCardWithSeal(),
  }),
  J("smiley", "Cara Sonriente", "common", 5, "🙂", "+5 Mult por cada figura puntuada.", {
    onCard: (card, c) => { if (isFace(card)) c.mult += 5; },
  }),
  J("baseball", "Carta de Béisbol", "rare", 10, "⚾", "Cada comodín poco común da x1.5 Mult.", {
    apply: (c) => {
      c.jokers.forEach(({ def }) => { if (def.rarity === "uncommon") c.mult *= 1.5; });
    },
  }),
  J("ancient", "Comodín Antiguo", "rare", 10, "🏛️", "x1.5 Mult por cada carta del palo elegido. Cambia cada ronda.", {
    defaultData: { suit: "S" },
    apply: (c) => {
      const suit = c.joker.data.suit;
      c.scoring.forEach((card) => { if (card.suit === suit) c.mult *= 1.5; });
    },
    onBlindStart: (j) => { j.data.suit = SUITS[Math.floor(Math.random() * 4)]; },
  }),
  J("bloodstone", "Hematita", "uncommon", 8, "🩸", "1 de 2 de x1.5 Mult por cada ♥ puntuado.", {
    onCard: (card, c) => { if (card.suit === "H" && chance(c, 1, 2)) c.mult *= 1.5; },
  }),
  J("arrowhead", "Punta de Flecha", "uncommon", 8, "🏹", "+50 Chips por cada ♠ puntuado.", {
    onCard: (card, c) => { if (card.suit === "S") c.chips += 50; },
  }),
  J("onyx", "Ágata Onyx", "uncommon", 8, "⬛", "+7 Mult por cada ♣ puntuado.", {
    onCard: (card, c) => { if (card.suit === "C") c.mult += 7; },
  }),
  J("roughgem", "Gema Bruta", "uncommon", 8, "💎", "+25 Chips por cada ♦ puntuado.", {
    onCard: (card, c) => { if (card.suit === "D") c.chips += 25; },
  }),
  J("cloud9", "Nube 9", "uncommon", 8, "☁️", "Gana $1 por cada 9 en tu mazo completo al final de la ronda.", {
    onRoundEnd: (j, state) => { state.money += state.deck.filter((card) => card.rank === 9).length; },
  }),
  J("rebate", "Reembolso por Correo", "uncommon", 8, "📮", "Gana $5 por cada 5 descartado.", {
    onDiscard: (j, state, cards) => { state.money += 5 * cards.filter((card) => card.rank === 5).length; },
  }),
  J("eightball", "Bola 8", "common", 5, "🎱", "1 de 4 de crear un Tarot por cada 8 puntuado.", {
    onCard: (card, c) => { if (card.rank === 8 && chance(c, 1, 4)) c.createdConsumables.push({ kind: "tarot" }); },
  }),
  J("fortune", "Adivino", "uncommon", 8, "🔯", "Gana +1 Mult por cada Tarot usado.", {
    defaultData: { mult: 0 },
    apply: (c) => { c.mult += c.joker.data.mult; },
    onTarotUsed: (j) => { j.data.mult += 1; },
  }),
  J("drunkard", "Borracho", "common", 4, "🍺", "+1 descarte cada ronda.", { passive: { discards: 1 } }),
  J("juggler", "Malabarista", "common", 4, "🤹‍♂️", "+1 carta en mano.", { passive: { handSize: 1 } }),
  J("stuntman", "Especialista", "rare", 10, "🎬", "+250 Chips, -2 cartas en mano.", { passive: { handSize: -2 }, apply: (c) => { c.chips += 250; } }),
  J("merryandy", "Andy Alegre", "uncommon", 8, "🥳", "+3 descartes, -1 carta en mano.", { passive: { discards: 3, handSize: -1 } }),
  J("turtle", "Judía Tortuga", "uncommon", 8, "🐢", "+5 cartas en mano, -1 por ronda.", {
    defaultData: { handSize: 5 },
    passive: { handSize: 0 },
    onRoundEnd: (j) => { j.data.handSize = Math.max(0, j.data.handSize - 1); },
  }),
  J("erosion", "Erosión", "uncommon", 8, "🌊", "+4 Mult por cada carta por debajo de 52 en tu mazo.", {
    apply: (c) => { c.mult += 4 * Math.max(0, 52 - c.state.deck.length); },
  }),
  J("stonejoker", "Comodín de Piedra", "uncommon", 8, "🪨", "+25 Chips por cada carta de Piedra en tu mazo.", {
    apply: (c) => { c.chips += 25 * c.state.deck.filter((card) => card.enhancement === "stone").length; },
  }),
  J("steeljoker", "Comodín de Acero", "uncommon", 8, "⚙️", "x0.2 Mult por cada carta de Acero en tu mazo.", {
    apply: (c) => {
      const n = c.state.deck.filter((card) => card.enhancement === "steel").length;
      c.mult *= 1 + 0.2 * n;
    },
  }),
  J("glassjoker", "Comodín de Cristal", "uncommon", 8, "🔷", "Gana x0.75 Mult por cada carta de Cristal rota.", {
    defaultData: { xmult: 1 },
    apply: (c) => { c.mult *= c.joker.data.xmult; },
    onGlassBreak: (j) => { j.data.xmult += 0.75; },
  }),
  J("swashbuckler", "Espadachín", "uncommon", 8, "⚔️", "+Mult igual al valor de venta de tus otros comodines.", {
    apply: (c) => {
      c.mult += c.jokers.reduce((sum, { def, inst }) => sum + (inst === c.joker ? 0 : sellValue(def, inst)), 0);
    },
  }),
  J("giftcard", "Tarjeta Regalo", "uncommon", 8, "🎁", "Todos los comodines y consumibles ganan $1 de valor de venta por ronda.", {
    onRoundEnd: (j, state) => {
      state.jokers.forEach((joker) => { joker.data.sellBonus = (joker.data.sellBonus || 0) + 1; });
      state.consumables.forEach((c) => { c.sellBonus = (c.sellBonus || 0) + 1; });
    },
  }),
  J("madness", "Locura", "rare", 10, "🌀", "Gana x0.5 Mult al elegir ciega pequeña o grande. Destruye un comodín al azar.", {
    defaultData: { xmult: 1 },
    apply: (c) => { c.mult *= c.joker.data.xmult; },
    onBlindStart: (j, state, api) => {
      if (state.blindIndex < 2) {
        j.data.xmult += 0.5;
        api.destroyRandomJoker(j);
      }
    },
  }),
  J("obelisk", "Obelisco", "rare", 10, "🗿", "Gana x0.2 Mult por mano consecutiva sin jugar tu tipo de mano más jugado.", {
    defaultData: { xmult: 1, streak: 0 },
    apply: (c) => { c.mult *= c.joker.data.xmult; },
    onHandPlayed: (j, state) => {
      const plays = Object.entries(state.handPlays || {});
      plays.sort((a, b) => b[1] - a[1]);
      const most = plays[0]?.[1] > 0 ? plays[0][0] : null;
      if (state.lastHandType === most) j.data.streak = 0;
      else { j.data.streak += 1; j.data.xmult += 0.2; }
    },
  }),
  J("throwback", "Retroceso", "uncommon", 8, "⏪", "x0.25 Mult por cada ciega saltada.", {
    apply: (c) => { c.mult *= 1 + 0.25 * c.state.blindsSkipped; },
  }),
  J("loyalty", "Carta de Lealtad", "rare", 10, "💳", "x4 Mult cada 6 manos jugadas.", {
    defaultData: { hands: 0 },
    apply: (c) => { if (c.joker.data.hands % 6 === 0 && c.joker.data.hands > 0) c.mult *= 4; },
    onHandPlayed: (j) => { j.data.hands += 1; },
  }),
  J("delayed", "Gratificación Aplazada", "uncommon", 8, "⏳", "Gana $2 por cada descarte sin usar al final de la ronda.", {
    onRoundEnd: (j, state) => { state.money += 2 * state.discardsLeft; },
  }),

  J("canio", "Canio", "legendary", 20, "🎭", "x1 Mult. Gana x1 Mult al destruir una figura.", {
    defaultData: { xmult: 1 },
    apply: (c) => { c.mult *= c.joker.data.xmult; },
    onCardDestroyed: (j, card) => { if (isFace(card)) j.data.xmult += 1; },
  }),
  J("yorick", "Yorick", "legendary", 20, "💀", "x1 Mult. Gana x1 Mult por cada 23 cartas descartadas.", {
    defaultData: { xmult: 1, discarded: 0 },
    apply: (c) => { c.mult *= c.joker.data.xmult; },
    onDiscard: (j, state, cards) => {
      j.data.discarded += cards.length;
      while (j.data.discarded >= 23) { j.data.discarded -= 23; j.data.xmult += 1; }
    },
  }),
  J("chicot", "Chicot", "legendary", 20, "🗡️", "Desactiva el efecto de la ciega jefe.", { chicot: true }),
  J("perkeo", "Perkeo", "legendary", 20, "🔑", "Al entrar en la tienda, crea una copia Negativa de un consumible al azar.", {
    onShopEnter: (j, state, api) => api.negativeCopyConsumable(),
  }),
];

export const JOKER_BY_ID = Object.fromEntries(JOKERS.map((j) => [j.id, j]));

export function sellValue(def, inst) {
  if (!def) return 0;
  let v = Math.floor(def.cost / 2) + (inst?.data?.sellBonus || 0) + (inst?.sellBonus || 0);
  if (def.id === "egg") v += inst?.data?.gained || 0;
  return Math.max(1, v);
}

// ---------------- TAROTS ----------------
const TAROT_ART = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
const T = (id, name, text, target, apply, extra = {}) => ({ id, name, kind: "tarot", text, target, apply, ...extra });

export const TAROTS = [
  T("fool", "El Loco", "Crea una copia del último Tarot o Planeta usado.", 0, (state, cards, api) => api.copyLastConsumable()),
  T("magician", "El Mago", "Mejora 2 cartas seleccionadas a Suerte.", 2, (state, cards) => cards.forEach((c) => { c.enhancement = "lucky"; })),
  T("priestess", "La Sacerdotisa", "Mejora 2 cartas seleccionadas a Mult.", 2, (state, cards) => cards.forEach((c) => { c.enhancement = "mult"; })),
  T("empress", "La Emperatriz", "Mejora 2 cartas seleccionadas a Mult.", 2, (state, cards) => cards.forEach((c) => { c.enhancement = "mult"; })),
  T("emperor", "El Emperador", "Crea 2 Tarots aleatorios.", 0, (state, cards, api) => api.createRandomConsumables(2, "tarot")),
  T("hierophant", "El Hierofante", "Mejora 2 cartas seleccionadas a Bonus.", 2, (state, cards) => cards.forEach((c) => { c.enhancement = "bonus"; })),
  T("lovers", "Los Enamorados", "Mejora 1 carta seleccionada a Comodín.", 1, (state, cards) => cards.forEach((c) => { c.enhancement = "wild"; })),
  T("chariot", "El Carro", "Mejora 1 carta seleccionada a Acero.", 1, (state, cards) => cards.forEach((c) => { c.enhancement = "steel"; })),
  T("justice", "La Justicia", "Mejora 1 carta seleccionada a Cristal.", 1, (state, cards) => cards.forEach((c) => { c.enhancement = "glass"; })),
  T("hermit", "El Ermitaño", "Duplica tu dinero (máx. $20).", 0, (state) => { state.money += Math.min(state.money, 20); }),
  T("wheel", "La Rueda de la Fortuna", "1 de 4 de dar Foil, Holográfica o Policroma a un comodín.", 0, (state, cards, api) => api.wheelOfFortune()),
  T("strength", "La Fuerza", "Aumenta el rango de 2 cartas seleccionadas en 1.", 2, (state, cards) => cards.forEach((c) => { c.rank = c.rank === 14 ? 2 : c.rank + 1; })),
  T("hanged", "El Colgado", "Destruye 2 cartas seleccionadas.", 2, (state, cards, api) => api.destroyCards(cards)),
  T("death", "La Muerte", "La carta seleccionada de la izquierda se convierte en la de la derecha.", 2, (state, cards, api) => api.copyCard(cards[0], cards[1])),
  T("temperance", "La Templanza", "Gana dinero igual al valor de venta total de tus comodines (máx. $50).", 0, (state, cards, api) => api.temperance()),
  T("devil", "El Diablo", "Mejora 1 carta seleccionada a Oro.", 1, (state, cards) => cards.forEach((c) => { c.enhancement = "gold"; })),
  T("tower", "La Torre", "Mejora 1 carta seleccionada a Piedra.", 1, (state, cards) => cards.forEach((c) => { c.enhancement = "stone"; })),
  T("star", "La Estrella", "Convierte hasta 3 cartas seleccionadas en ♦.", 3, (state, cards) => cards.forEach((c) => { if (c.enhancement !== "stone") c.suit = "D"; }), { variable: true }),
  T("moon", "La Luna", "Convierte hasta 3 cartas seleccionadas en ♣.", 3, (state, cards) => cards.forEach((c) => { if (c.enhancement !== "stone") c.suit = "C"; }), { variable: true }),
  T("sun", "El Sol", "Convierte hasta 3 cartas seleccionadas en ♥.", 3, (state, cards) => cards.forEach((c) => { if (c.enhancement !== "stone") c.suit = "H"; }), { variable: true }),
  T("world", "El Mundo", "Convierte hasta 3 cartas seleccionadas en ♠.", 3, (state, cards) => cards.forEach((c) => { if (c.enhancement !== "stone") c.suit = "S"; }), { variable: true }),
  T("judgement", "El Juicio", "Crea un comodín aleatorio.", 0, (state, cards, api) => api.createRandomJoker()),
];
TAROTS.forEach((t, i) => { t.num = TAROT_ART[i]; t.art = "🔮"; });

// ---------------- PLANETS ----------------
const P = (id, name, hand, art) => ({
  id, name, kind: "planet", hand, art, target: 0,
  text: `Sube ${HAND_INFO[hand].name} 1 nivel.`,
  apply: (state) => { state.handLevels[hand] = (state.handLevels[hand] || 1) + 1; },
});
export const PLANETS = [
  P("pluto", "Plutón", "High Card", "🌑"),
  P("mercury", "Mercurio", "Pair", "☿"),
  P("uranus", "Urano", "Two Pair", "🪐"),
  P("venus", "Venus", "Three of a Kind", "♀"),
  P("saturn", "Saturno", "Straight", "🪐"),
  P("jupiter", "Júpiter", "Flush", "♃"),
  P("earth", "Tierra", "Full House", "🌍"),
  P("mars", "Marte", "Four of a Kind", "♂"),
  P("neptune", "Neptuno", "Straight Flush", "♆"),
  P("planetx", "Planeta X", "Five of a Kind", "✴"),
  P("ceres", "Ceres", "Flush House", "⚳"),
  P("eris", "Eris", "Flush Five", "⚴"),
];

// ---------------- SPECTRALS ----------------
const S = (id, name, text, target, apply, extra = {}) => ({ id, name, kind: "spectral", art: "👻", text, target, apply, ...extra });
export const SPECTRALS = [
  S("familiar", "Familiar", "Destruye 1 carta al azar y añade 3 figuras mejoradas al azar.", 0, (s, c, api) => api.spectralFamiliar()),
  S("grim", "Sombrío", "Destruye 1 carta al azar y añade 2 Ases mejorados al azar.", 0, (s, c, api) => api.spectralGrim()),
  S("incantation", "Conjuro", "Destruye 1 carta al azar y añade 4 cartas numeradas mejoradas.", 0, (s, c, api) => api.spectralIncantation()),
  S("talisman", "Talismán", "Añade un sello Dorado a 1 carta seleccionada.", 1, (s, c) => c.forEach((card) => { card.seal = "gold"; })),
  S("aura", "Aura", "Añade Foil, Holográfica o Policroma a 1 carta seleccionada.", 1, (s, c, api) => c.forEach((card) => { card.edition = api.randomEdition(); })),
  S("wraith", "Espectro", "Crea un comodín raro al azar. Tu dinero se vuelve $0.", 0, (s, c, api) => { s.money = 0; api.createRandomJoker("rare"); }),
  S("sigil", "Sigilo", "Convierte todas las cartas de tu mano en ♥.", 0, (s, c, api) => api.handCards().forEach((card) => { if (card.enhancement !== "stone") card.suit = "H"; })),
  S("ouija", "Ouija", "Convierte todas las cartas de tu mano en ♠. -1 carta en mano.", 0, (s, c, api) => { api.handCards().forEach((card) => { if (card.enhancement !== "stone") card.suit = "S"; }); s.handSizePenalty = (s.handSizePenalty || 0) + 1; }),
  S("ectoplasm", "Ectoplasma", "Añade una edición Negativa a un comodín al azar. -1 carta en mano.", 0, (s, c, api) => { api.negativeRandomJoker(); s.handSizePenalty = (s.handSizePenalty || 0) + 1; }),
  S("immolate", "Inmolar", "Destruye 5 cartas al azar y gana $20.", 0, (s, c, api) => { api.destroyRandomCards(5); s.money += 20; }),
  S("ankh", "Ankh", "Copia un comodín al azar y destruye los demás.", 0, (s, c, api) => api.ankh()),
  S("dejavu", "Déjà Vu", "Añade un sello Rojo a 1 carta seleccionada.", 1, (s, c) => c.forEach((card) => { card.seal = "red"; })),
  S("hex", "Hex", "Añade Policroma a un comodín al azar y destruye los demás.", 0, (s, c, api) => api.hex()),
  S("trance", "Trance", "Añade un sello Azul a 1 carta seleccionada.", 1, (s, c) => c.forEach((card) => { card.seal = "blue"; })),
  S("medium", "Médium", "Añade un sello Púrpura a 1 carta seleccionada.", 1, (s, c) => c.forEach((card) => { card.seal = "purple"; })),
  S("cryptid", "Criptido", "Crea 2 copias de 1 carta seleccionada.", 1, (s, c, api) => api.cryptid(c[0])),
  S("soul", "El Alma", "Crea un comodín legendario.", 0, (s, c, api) => api.createRandomJoker("legendary")),
  S("blackhole", "Agujero Negro", "Sube 1 nivel todas las manos de póker.", 0, (s) => { Object.keys(s.handLevels).forEach((h) => { s.handLevels[h] += 1; }); }),
];

export const CONSUMABLE_BY_ID = Object.fromEntries([...TAROTS, ...PLANETS, ...SPECTRALS].map((c) => [c.id, c]));
export const ALL_CONSUMABLES = [...TAROTS, ...PLANETS, ...SPECTRALS];

// ---------------- BLINDS ----------------
export const ANTE_TABLE = [
  { small: 300, big: 450, boss: 600 },
  { small: 800, big: 1200, boss: 1600 },
  { small: 2000, big: 3000, boss: 4000 },
  { small: 5000, big: 7500, boss: 10000 },
  { small: 11000, big: 16500, boss: 22000 },
  { small: 20000, big: 30000, boss: 40000 },
  { small: 35000, big: 52500, boss: 70000 },
  { small: 50000, big: 75000, boss: 100000 },
];

export const BOSSES = [
  { id: "hook", name: "El Gancho", art: "🪝", text: "Tras cada mano, descarta 2 cartas al azar." },
  { id: "ox", name: "El Buey", art: "🐂", text: "Jugar tu mano más repetida pone tu dinero a $0." },
  { id: "house", name: "La Casa", art: "🏚️", text: "La primera mano se reparte boca abajo." },
  { id: "wall", name: "El Muro", art: "🧱", text: "La puntuación objetivo se duplica." },
  { id: "needle", name: "La Aguja", art: "📍", text: "Solo tienes 1 mano." },
  { id: "water", name: "El Agua", art: "💧", text: "Empiezas sin descartes." },
  { id: "club", name: "El Trébol", art: "♣", text: "Todas las cartas de ♣ están debilitadas." },
  { id: "goad", name: "El Aguijón", art: "♠", text: "Todas las cartas de ♠ están debilitadas." },
  { id: "head", name: "La Cabeza", art: "♥", text: "Todas las cartas de ♥ están debilitadas." },
  { id: "window", name: "La Ventana", art: "♦", text: "Todas las cartas de ♦ están debilitadas." },
  { id: "manacle", name: "El Grillete", art: "⛓️", text: "-1 carta en mano." },
  { id: "psychic", name: "La Psíquica", art: "🔮", text: "Debes jugar exactamente 5 cartas." },
  { id: "eye", name: "El Ojo", art: "👁️", text: "No puedes repetir tipos de mano esta ronda." },
  { id: "mouth", name: "La Boca", art: "👄", text: "Solo puedes jugar un tipo de mano esta ronda." },
  { id: "fish", name: "El Pez", art: "🐟", text: "Las cartas robadas tras cada mano van boca abajo." },
  { id: "serpent", name: "La Serpiente", art: "🐍", text: "Tras cada mano o descarte, roba 3 cartas." },
  { id: "arm", name: "El Brazo", art: "💪", text: "Baja 1 nivel la mano jugada." },
  { id: "tooth", name: "El Diente", art: "🦷", text: "Pierdes $1 por cada carta jugada." },
  { id: "flint", name: "El Pedernal", art: "🔥", text: "Los Chips y Mult base de la mano se reducen a la mitad." },
  { id: "mark", name: "La Marca", art: "🖊️", text: "Las figuras se reparten boca abajo." },
  { id: "plant", name: "La Planta", art: "🌿", text: "Todas las figuras están debilitadas." },
  { id: "heart", name: "El Corazón Carmesí", art: "❤️", text: "Cada mano desactiva un comodín al azar." },
  { id: "violet", name: "El Jarrón Violeta", art: "🏺", text: "La puntuación objetivo se multiplica por 6." },
  { id: "acorn", name: "La Bellota Ámbar", art: "🌰", text: "Se barajan tus comodines al empezar la ronda." },
];

export const BOSS_BY_ID = Object.fromEntries(BOSSES.map((b) => [b.id, b]));

// ---------------- VOUCHERS ----------------
export const VOUCHERS = [
  { id: "overstock", name: "Sobreabundancia", art: "📦", cost: 10, text: "+1 espacio de comodín en la tienda." },
  { id: "hone", name: "Afilar", art: "🔪", cost: 10, text: "+1 espacio de consumibles." },
  { id: "grabber", name: "Agarrador", art: "🫳", cost: 10, text: "+1 mano cada ronda." },
  { id: "wasteful", name: "Derrochador", art: "🗑️", cost: 10, text: "+1 descarte cada ronda." },
  { id: "seed", name: "Dinero Semilla", art: "🌱", cost: 10, text: "El límite de interés sube $5." },
  { id: "antimatter", name: "Antimateria", art: "⚛️", cost: 10, text: "+1 espacio de comodín." },
  { id: "brush", name: "Pincel", art: "🖌️", cost: 10, text: "+1 carta en mano." },
  { id: "reroll", name: "Reroll Extra", art: "🔄", cost: 10, text: "Los rerolls cuestan $2 menos." },
  { id: "clearance", name: "Liquidación", art: "🏷️", cost: 10, text: "Todo en la tienda cuesta un 25% menos." },
  { id: "telescope", name: "Telescopio", art: "🔭", cost: 10, text: "Los sobres Celestiales incluyen el Planeta de tu mano más jugada." },
  { id: "observatory", name: "Observatorio", art: "🌌", cost: 10, text: "x1.5 Mult por cada Planeta en tus consumibles." },
  { id: "glow", name: "Brillo", art: "✨", cost: 10, text: "Las ediciones aparecen el doble de a menudo." },
];
export const VOUCHER_BY_ID = Object.fromEntries(VOUCHERS.map((v) => [v.id, v]));

export const TAGS = [
  { id: "economy", name: "Etiqueta Económica", text: "Ganas $6.", apply: (s) => { s.money += 6; } },
  { id: "charm", name: "Etiqueta Encantadora", text: "Abre un sobre Arcano gratis.", apply: (s) => { s.pendingPack = "arcana"; } },
  { id: "meteor", name: "Etiqueta Meteórica", text: "Abre un sobre Celestial gratis.", apply: (s) => { s.pendingPack = "celestial"; } },
  { id: "buffoon", name: "Etiqueta Bufón", text: "Abre un sobre Bufón gratis.", apply: (s) => { s.pendingPack = "buffoon"; } },
  { id: "ethereal", name: "Etiqueta Etérea", text: "Abre un sobre Espectral gratis.", apply: (s) => { s.pendingPack = "spectral"; } },
  { id: "voucher", name: "Etiqueta de Voucher", text: "Ganas un voucher aleatorio.", apply: (s) => { s.pendingVoucher = true; } },
  { id: "handy", name: "Etiqueta Útil", text: "+1 mano en la próxima ciega.", apply: (s) => { s.nextHandBonus = (s.nextHandBonus || 0) + 1; } },
  { id: "waste", name: "Etiqueta de Desecho", text: "+1 descarte en la próxima ciega.", apply: (s) => { s.nextDiscardBonus = (s.nextDiscardBonus || 0) + 1; } },
  { id: "joker", name: "Etiqueta de Comodín", text: "Ganas un comodín común gratis.", apply: (s) => { s.pendingCommonJoker = true; } },
  { id: "investment", name: "Etiqueta de Inversión", text: "Ganas $25 al derrotar al jefe.", apply: (s) => { s.investmentTag = true; } },
];

export const PACK_INFO = {
  arcana: { name: "Sobre Arcano", art: "🔮", color: "arcana", desc: "Elige 1 de 3 Tarots", count: 3, kind: "tarot", cost: 4 },
  celestial: { name: "Sobre Celestial", art: "🪐", color: "celestial", desc: "Elige 1 de 3 Planetas", count: 3, kind: "planet", cost: 4 },
  buffoon: { name: "Sobre Bufón", art: "🃏", color: "buffoon", desc: "Elige 1 de 2 comodines", count: 2, kind: "joker", cost: 4 },
  spectral: { name: "Sobre Espectral", art: "👻", color: "spectral", desc: "Elige 1 de 2 Espectrales", count: 2, kind: "spectral", cost: 4 },
};
