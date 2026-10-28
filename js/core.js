import {
  JOKER_BY_ID, HAND_INFO, handStats, SUITS, rankChips, isFace,
  ENHANCEMENTS, SEALS,
} from "./content.js";

let cardSeq = 0;
export function uid(prefix = "id") {
  cardSeq += 1;
  return `${prefix}${Date.now().toString(36)}${cardSeq.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function createCard(rank, suit, opts = {}) {
  return {
    uid: uid("c"),
    rank,
    suit,
    enhancement: null,
    edition: null,
    seal: null,
    bonusChips: 0,
    faceDown: false,
    debuffed: false,
    ...opts,
  };
}

export function createStandardDeck() {
  const deck = [];
  for (const suit of SUITS) for (let rank = 2; rank <= 14; rank++) deck.push(createCard(rank, suit));
  return deck;
}

export function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function jokerDef(inst) {
  return inst ? JOKER_BY_ID[inst.id] : null;
}

export function effectiveJokers(state) {
  const list = state.jokers.map((inst, index) => ({
    inst, def: JOKER_BY_ID[inst.id], index, dataInst: inst, sourceIndex: index, copying: false,
  }));
  const resolve = (start) => {
    let i = start;
    for (let depth = 0; depth < 8; depth++) {
      const def = list[i]?.def;
      if (!def) return start;
      if (def.copy === "right") i += 1;
      else if (def.copy === "left") i = 0;
      else return i;
      if (i < 0 || i >= list.length) return start;
    }
    return start;
  };
  return list.map((entry, index) => {
    if (!entry.def?.copy) return entry;
    const src = resolve(index);
    const source = list[src];
    if (!source || src === index) return entry;
    return {
      ...entry,
      def: source.def,
      dataInst: source.inst,
      sourceIndex: src,
      copying: true,
    };
  });
}

export function hasJoker(state, id) {
  return effectiveJokers(state).some((e) => e.def?.id === id && !e.inst.disabled);
}

export function hasFlag(state, flag) {
  return effectiveJokers(state).some((e) => e.def?.[flag] && !e.inst.disabled);
}

export function bossActive(state, id) {
  if (hasJoker(state, "chicot")) return false;
  return state.blind?.bossId === id;
}

export function bossEffectEnabled(state) {
  return !!state.blind?.bossId && !hasJoker(state, "chicot");
}

export function passiveStats(state) {
  let handSize = 0;
  let hands = 0;
  let discards = 0;
  for (const ej of effectiveJokers(state)) {
    const def = ej.def;
    if (!def || ej.inst.disabled) continue;
    if (def.id === "turtle") {
      handSize += ej.dataInst?.data?.handSize ?? 0;
      continue;
    }
    if (def.passive) {
      handSize += def.passive.handSize || 0;
      hands += def.passive.hands || 0;
      discards += def.passive.discards || 0;
    }
  }
  return { handSize, hands, discards };
}

function suitKey(card, smeared) {
  if (card.enhancement === "stone") return null;
  if (card.enhancement === "wild") return "*";
  if (!smeared) return card.suit;
  return card.suit === "H" || card.suit === "D" ? "red" : "black";
}

function detectFlush(cards, fourFingers, smeared) {
  const need = fourFingers ? 4 : 5;
  const usable = cards.filter((c) => c.enhancement !== "stone");
  if (!usable.length) return { flush: false, cards: [] };
  const wilds = usable.filter((c) => c.enhancement === "wild").length;
  const counts = {};
  for (const card of usable) {
    const key = suitKey(card, smeared);
    if (key && key !== "*") counts[key] = (counts[key] || 0) + 1;
  }
  let bestKey = null;
  let best = 0;
  for (const [key, n] of Object.entries(counts)) if (n > best) { best = n; bestKey = key; }
  const total = best + wilds;
  const allWild = usable.every((c) => c.enhancement === "wild");
  if (total >= need || (allWild && usable.length >= need)) {
    const subset = usable.filter((c) => {
      const key = suitKey(c, smeared);
      return key === "*" || key === bestKey || (allWild && c.enhancement === "wild");
    });
    return { flush: true, cards: subset, key: bestKey || "*" };
  }
  return { flush: false, cards: [] };
}

function findStraight(cards, fourFingers, shortcut) {
  const need = fourFingers ? 4 : 5;
  const usable = cards.filter((c) => c.enhancement !== "stone");
  if (usable.length < need) return { straight: false, cards: [] };
  let ranks = [...new Set(usable.map((c) => c.rank))];
  if (ranks.includes(14)) ranks.push(1);
  ranks = [...new Set(ranks)].sort((a, b) => a - b);
  if (ranks.length < need) return { straight: false, cards: [] };
  const maxGap = shortcut ? 2 : 1;

  const dfs = (start, picked) => {
    if (picked.length === need) return picked;
    for (let i = start; i < ranks.length; i++) {
      const r = ranks[i];
      if (r - picked[picked.length - 1] <= maxGap) {
        const res = dfs(i + 1, [...picked, r]);
        if (res) return res;
      }
    }
    return null;
  };

  for (let i = 0; i < ranks.length; i++) {
    const found = dfs(i + 1, [ranks[i]]);
    if (found) {
      const used = [...found];
      const subset = [];
      for (const r of used) {
        const actualRank = r === 1 ? 14 : r;
        const card = usable.find((c) => c.rank === actualRank && !subset.includes(c));
        if (card) subset.push(card);
      }
      if (subset.length === need) return { straight: true, cards: subset, ranks: found };
    }
  }
  return { straight: false, cards: [] };
}

export function evaluateHand(played, state) {
  const fourFingers = hasFlag(state, "fourfingers");
  const shortcut = hasFlag(state, "shortcut");
  const smeared = hasFlag(state, "smeared");
  const usable = played.filter((c) => c.enhancement !== "stone");
  const rankCounts = {};
  for (const card of usable) rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  const groups = Object.entries(rankCounts)
    .map(([rank, count]) => ({ rank: Number(rank), count }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);

  const flushInfo = detectFlush(played, fourFingers, smeared);
  const straightInfo = findStraight(played, fourFingers, shortcut);
  const isFlush = flushInfo.flush;
  const isStraight = straightInfo.straight;
  const five = groups.find((g) => g.count >= 5);
  const four = groups.find((g) => g.count >= 4);
  const three = groups.find((g) => g.count >= 3);
  const pairs = groups.filter((g) => g.count >= 2);
  const fullHouse = !!three && pairs.some((p) => p.rank !== three.rank && p.count >= 2);

  let type = "High Card";
  if (five) type = isFlush ? "Flush Five" : "Five of a Kind";
  else if (fullHouse) type = isFlush ? "Flush House" : "Full House";
  else if (four) type = "Four of a Kind";
  else if (isStraight && isFlush) type = "Straight Flush";
  else if (isFlush) type = "Flush";
  else if (isStraight) type = "Straight";
  else if (three) type = "Three of a Kind";
  else if (pairs.length >= 2) type = "Two Pair";
  else if (pairs.length >= 1) type = "Pair";
  else type = "High Card";

  const byRank = (rank, n = 99) => usable.filter((c) => c.rank === rank).slice(0, n);
  let scoring = [];
  switch (type) {
    case "Flush Five":
      scoring = byRank(five.rank);
      break;
    case "Five of a Kind":
      scoring = byRank(five.rank);
      break;
    case "Flush House":
    case "Full House": {
      const pair = pairs.find((p) => p.rank !== three.rank) || three;
      scoring = [...byRank(three.rank), ...byRank(pair.rank)];
      break;
    }
    case "Four of a Kind":
      scoring = byRank(four.rank, 4);
      break;
    case "Straight Flush":
      scoring = straightInfo.cards;
      break;
    case "Flush":
      scoring = flushInfo.cards;
      break;
    case "Straight":
      scoring = straightInfo.cards;
      break;
    case "Three of a Kind":
      scoring = byRank(three.rank, 3);
      break;
    case "Two Pair": {
      const [a, b] = pairs.slice(0, 2);
      scoring = [...byRank(a.rank), ...byRank(b.rank)];
      break;
    }
    case "Pair":
      scoring = byRank(pairs[0].rank, 2);
      break;
    default: {
      const ranked = usable.filter((c) => c.rank).sort((a, b) => b.rank - a.rank);
      scoring = ranked.length ? [ranked[0]] : played.slice(0, 1);
    }
  }

  const stones = played.filter((c) => c.enhancement === "stone");
  for (const stone of stones) if (!scoring.includes(stone)) scoring.push(stone);

  return { type, scoring, played, flushInfo, straightInfo, groups };
}

function addEdition(card, ctx) {
  if (!card.edition) return;
  if (card.edition === "foil") ctx.chips += 50;
  else if (card.edition === "holo") ctx.mult += 10;
  else if (card.edition === "poly") ctx.mult *= 1.5;
}

function triggerJokerEdition(inst, ctx) {
  if (!inst?.edition) return;
  if (inst.edition === "foil") ctx.chips += 50;
  else if (inst.edition === "holo") ctx.mult += 10;
  else if (inst.edition === "poly") ctx.mult *= 1.5;
}

export function scoreHand(state, evaluation) {
  const type = evaluation.type;
  const level = state.handLevels[type] || 1;
  const base = handStats(type, level);
  const held = state.hand.filter((c) => !evaluation.played.includes(c));
  const effective = effectiveJokers(state);
  const flint = bossActive(state, "flint");
  state.oops = hasFlag(state, "oops");

  const ctx = {
    state,
    type,
    level,
    chips: flint ? Math.max(1, Math.floor(base.chips / 2)) : base.chips,
    mult: flint ? Math.max(1, +(base.mult / 2).toFixed(2)) : base.mult,
    scoring: evaluation.scoring,
    played: evaluation.played,
    held,
    jokers: effective,
    joker: null,
    flags: {},
    moneyGain: 0,
    destroy: [],
    createdCards: [],
    createdConsumables: [],
    triggered: [],
    luckyTriggers: 0,
    glassBreaks: 0,
  };

  const splash = hasFlag(state, "splash");
  if (splash) {
    for (const card of evaluation.played) if (!ctx.scoring.includes(card)) ctx.scoring.push(card);
  }

  const isActive = (ej) => ej.def && !ej.inst.disabled;

  for (const card of ctx.scoring) {
    if (card.debuffed) continue;
    let triggers = 1;
    if (card.seal === "red") triggers += 1;
    for (const ej of effective) {
      if (!isActive(ej)) continue;
      if (ej.def.retrigger && ej.def.retrigger(card, ctx) > 0) triggers += ej.def.retrigger(card, ctx);
      if (ej.def.retriggerAll && ej.def.retriggerAll(ctx)) triggers += 1;
    }

    for (let t = 0; t < triggers; t++) {
      let chips = card.enhancement === "stone" ? 50 : rankChips(card.rank);
      chips += card.bonusChips || 0;
      if (card.enhancement === "bonus") chips += 30;
      ctx.chips += chips;

      if (card.enhancement === "mult") ctx.mult += 4;
      if (card.enhancement === "glass") ctx.mult *= 2;
      if (card.enhancement === "lucky") {
        if (Math.random() < (state.oops ? 0.4 : 0.2)) { ctx.mult += 20; ctx.luckyTriggers += 1; }
        if (Math.random() < (state.oops ? 2 / 15 : 1 / 15)) { ctx.moneyGain += 20; ctx.luckyTriggers += 1; }
      }
      if (card.seal === "gold") ctx.moneyGain += 3;
      addEdition(card, ctx);

      for (const ej of effective) {
        if (!isActive(ej) || !ej.def.onCard) continue;
        const inst = ej.dataInst || ej.inst;
        const prev = ctx.joker;
        ctx.joker = inst;
        const before = `${ctx.chips}|${ctx.mult}`;
        ej.def.onCard(card, ctx);
        if (`${ctx.chips}|${ctx.mult}` !== before) ctx.triggered.push(ej.inst.uid);
        ctx.joker = prev;
      }
    }
  }

  for (const ej of effective) {
    if (!isActive(ej)) continue;
    const inst = ej.dataInst || ej.inst;
    ctx.joker = inst;
    triggerJokerEdition(ej.inst, ctx);
    if (ej.def.apply) {
      const before = `${ctx.chips}|${ctx.mult}`;
      ej.def.apply(ctx);
      if (`${ctx.chips}|${ctx.mult}` !== before) ctx.triggered.push(ej.inst.uid);
    }
  }
  ctx.joker = null;

  for (const card of held) {
    if (card.debuffed) continue;
    let triggers = 1;
    for (const ej of effective) {
      if (!isActive(ej)) continue;
      if (ej.def.heldRetrigger) triggers += ej.def.heldRetrigger(card, ctx);
    }
    for (let t = 0; t < triggers; t++) {
      if (card.enhancement === "steel") ctx.mult *= 1.5;
      for (const ej of effective) {
        if (!isActive(ej) || !ej.def.onHeld) continue;
        const inst = ej.dataInst || ej.inst;
        ctx.joker = inst;
        ej.def.onHeld(card, ctx);
      }
    }
  }

  if (hasJoker(state, "observatory")) {
    const planets = state.consumables.filter((c) => c.kind === "planet").length;
    if (planets > 0) ctx.mult *= Math.pow(1.5, planets);
  }

  if (ctx.glassBreaks === 0) {
    for (const card of ctx.scoring) {
      if (card.enhancement === "glass" && !card.debuffed && Math.random() < 0.25) {
        ctx.glassBreaks += 1;
        ctx.destroy.push(card);
      }
    }
  }
  if (ctx.glassBreaks > 0) {
    for (const ej of effective) {
      if (isActive(ej) && ej.def.onGlassBreak) ej.def.onGlassBreak(ej.dataInst || ej.inst, state);
      if (isActive(ej) && ej.def.onCardDestroyed) {
        ctx.destroy.forEach((card) => ej.def.onCardDestroyed(ej.dataInst || ej.inst, card, state));
      }
    }
  }
  if (ctx.luckyTriggers > 0) {
    for (const ej of effective) {
      if (isActive(ej) && ej.def.onLucky) ej.def.onLucky(ej.dataInst || ej.inst, state);
    }
  }

  ctx.chips = Math.max(0, Math.round(ctx.chips));
  ctx.mult = Math.max(0, +ctx.mult.toFixed(2));
  const total = Math.floor(ctx.chips * ctx.mult);
  return {
    ...ctx,
    total,
    handName: HAND_INFO[type].name,
    level,
  };
}
