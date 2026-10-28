import { store } from "./store.js";
import { ANTE_TABLE, BOSSES, BOSS_BY_ID, TAGS, VOUCHERS, HAND_ORDER } from "./content.js";
import { createStandardDeck, shuffle, passiveStats, hasJoker, bossEffectEnabled } from "./core.js";
import { randomFrom, maxHandSize, voucherCount, makeSeed, save } from "./helpers.js";
import { addJoker, addConsumable, pickJokerDef, runJokerHooks } from "./items.js";
import { toast } from "./fx.js";
import { render } from "./ui.js";

export function createRun() {
  const handLevels = {};
  const handPlays = {};
  for (const type of HAND_ORDER) { handLevels[type] = 1; handPlays[type] = 0; }
  return {
    version: 1,
    seed: makeSeed(),
    ante: 1,
    blindIndex: 0,
    blind: null,
    money: 4,
    handSizePenalty: 0,
    blindHandPenalty: 0,
    nextHandBonus: 0,
    nextDiscardBonus: 0,
    handLevels,
    handPlays,
    jokers: [],
    consumables: [],
    vouchers: [],
    tags: [],
    deck: createStandardDeck(),
    drawPile: [],
    hand: [],
    discardPile: [],
    played: [],
    roundScore: 0,
    target: 0,
    handsLeft: 0,
    discardsLeft: 0,
    phase: "blind",
    playedTypesThisRound: [],
    handsPlayedThisRound: 0,
    chosenType: null,
    faceDownInitial: false,
    faceDownDraw: false,
    blindsSkipped: 0,
    shop: null,
    pack: null,
    cashout: null,
    lastConsumableId: null,
    sortMode: "rank",
    investmentTag: false,
    seenBosses: [],
    pendingPack: null,
    pendingVoucher: false,
    pendingCommonJoker: false,
    disabledJokerUid: null,
    stats: { handsPlayed: 0, roundsWon: 0, bestScore: 0, bestHand: null, bestHandCount: 0, cardsDestroyed: 0 },
  };
}

export function makeBlind(ante, index) {
  const s = store.state;
  const row = ANTE_TABLE[Math.min(ante, 8) - 1];
  const type = index === 0 ? "small" : index === 1 ? "big" : "boss";
  const base = row[type];
  let boss = null;
  if (type === "boss") {
    if (ante >= 8) {
      boss = BOSS_BY_ID.violet;
    } else {
      const pool = BOSSES.filter((b) => b.id !== "violet" && !s.seenBosses.includes(b.id));
      const fallback = BOSSES.filter((b) => b.id !== "violet");
      boss = randomFrom(pool.length ? pool : fallback);
      s.seenBosses.push(boss.id);
    }
  }
  let mult = 1;
  if (boss && !hasJoker(s, "chicot")) {
    if (boss.id === "wall") mult = 2;
    if (boss.id === "violet") mult = 6;
  }
  return {
    type,
    index,
    ante,
    requirement: Math.round(base * mult),
    reward: type === "small" ? 3 : type === "big" ? 4 : 5,
    name: type === "small" ? "Ciega Pequeña" : type === "big" ? "Ciega Grande" : boss.name,
    art: type === "small" ? "🔹" : type === "big" ? "🔷" : boss.art,
    bossId: boss ? boss.id : null,
    text: boss ? boss.text : null,
    mult,
  };
}

export function drawCards(n, opts = {}) {
  const s = store.state;
  for (let i = 0; i < n; i++) {
    if (!s.drawPile.length) {
      if (!s.discardPile.length) break;
      s.drawPile = shuffle(s.discardPile);
      s.discardPile = [];
    }
    const card = s.drawPile.pop();
    card.faceDown = false;
    if (opts.faceDownAll) card.faceDown = true;
    else if (s.faceDownDraw) card.faceDown = true;
    else if (hasJoker(s, "chicot") ? false : s.blind?.bossId === "mark" && card.rank >= 11 && card.rank <= 13) card.faceDown = true;
    s.hand.push(card);
  }
}

export function applyBossStart() {
  const s = store.state;
  if (!bossEffectEnabled(s) || !s.blind?.bossId) return;
  const id = s.blind.bossId;
  if (id === "club") s.deck.forEach((c) => { if (c.suit === "C") c.debuffed = true; });
  else if (id === "goad") s.deck.forEach((c) => { if (c.suit === "S") c.debuffed = true; });
  else if (id === "head") s.deck.forEach((c) => { if (c.suit === "H") c.debuffed = true; });
  else if (id === "window") s.deck.forEach((c) => { if (c.suit === "D") c.debuffed = true; });
  else if (id === "plant") s.deck.forEach((c) => { if (c.rank >= 11 && c.rank <= 13) c.debuffed = true; });
  else if (id === "needle") s.handsLeft = 1;
  else if (id === "water") s.discardsLeft = 0;
  else if (id === "manacle") s.blindHandPenalty = 1;
  else if (id === "house") s.faceDownInitial = true;
  else if (id === "acorn") s.jokers = shuffle(s.jokers);
}

export function selectBlind() {
  const s = store.state;
  if (!s || s.phase !== "blind" || !s.blind) return;
  s.phase = "round";
  s.roundScore = 0;
  s.target = s.blind.requirement;
  s.playedTypesThisRound = [];
  s.handsPlayedThisRound = 0;
  s.chosenType = null;
  s.played = [];
  s.hand = [];
  s.discardPile = [];
  s.blindHandPenalty = 0;
  s.faceDownInitial = false;
  s.faceDownDraw = false;
  s.disabledJokerUid = null;
  store.displayScore = { chips: 0, mult: 0 };
  s.deck.forEach((c) => { c.debuffed = false; c.faceDown = false; });
  s.jokers.forEach((j) => { j.disabled = false; });
  s.disabledJokerUid = null;
  s.drawPile = shuffle(s.deck);

  const passive = passiveStats(s);
  const hands = 4 + voucherCount("grabber") + passive.hands + (s.nextHandBonus || 0);
  const discards = 3 + voucherCount("wasteful") + passive.discards + (s.nextDiscardBonus || 0);
  s.nextHandBonus = 0;
  s.nextDiscardBonus = 0;
  s.handsLeft = Math.max(1, hands);
  s.discardsLeft = Math.max(0, discards);

  applyBossStart();
  drawCards(maxHandSize(), { faceDownAll: s.faceDownInitial });
  runJokerHooks("onBlindStart");
  save();
  render();
}

export function advanceBlind(index) {
  const s = store.state;
  s.blindIndex = index;
  s.blind = makeBlind(s.ante, s.blindIndex);
  s.phase = "blind";
}

export function skipBlind() {
  const s = store.state;
  if (!s || s.phase !== "blind" || s.blindIndex >= 2) return;
  s.blindsSkipped += 1;
  const tag = randomFrom(TAGS);
  s.tags.push(tag.id);
  tag.apply(s);
  if (s.pendingCommonJoker) {
    s.pendingCommonJoker = false;
    const inst = addJoker(pickJokerDef({ rarity: "common", allowOwned: true }).id);
    if (inst) toast("Etiqueta: comodín común añadido.");
  }
  if (s.pendingVoucher) {
    s.pendingVoucher = false;
    const v = randomFrom(VOUCHERS.filter((x) => !s.vouchers.includes(x.id)));
    if (v) { s.vouchers.push(v.id); toast(`Etiqueta: voucher ${v.name} obtenido.`); }
  }
  advanceBlind(s.blindIndex + 1);
  const freePack = s.pendingPack;
  s.pendingPack = null;
  save();
  render();
  toast(`Etiqueta obtenida: ${tag.name}. ${tag.text}`);
  return freePack;
}

export function startNewRun() {
  store.state = createRun();
  store.state.blind = makeBlind(1, 0);
  store.started = true;
  store.modalHtml = null;
  store.pendingUse = null;
  store.selected = new Set();
  save();
  render();
  toast("Elige la Ciega Pequeña para empezar.", "good");
}
