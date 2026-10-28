import { store } from "./store.js";
import {
  RANKS, SUITS, ENHANCEMENTS, SEALS, JOKERS, JOKER_BY_ID, sellValue,
  CONSUMABLE_BY_ID, TAROTS, PLANETS, SPECTRALS,
} from "./content.js";
import { createCard, uid, effectiveJokers, hasFlag } from "./core.js";
import {
  randomFrom, copyData, escapeHtml, jokerCapacity, consumableCapacity, nonNegativeJokers, save,
} from "./helpers.js";
import { canUseConsumable, useSelectionValid, requiredTarget } from "./rules.js";
import { toast, sfx } from "./fx.js";
import { render } from "./ui.js";

// ------------------------------------------------------------------
// card / joker / consumable creation
// ------------------------------------------------------------------
export function pickJokerDef({ rarity = null, allowOwned = false, includeLegendary = false } = {}) {
  let pool = JOKERS.filter((j) => includeLegendary || j.rarity !== "legendary");
  const owned = new Set(store.state.jokers.map((j) => j.id));
  if (!allowOwned) {
    const filtered = pool.filter((j) => !owned.has(j.id));
    if (filtered.length) pool = filtered;
  }
  if (!pool.length) pool = JOKERS.filter((j) => j.rarity !== "legendary");
  if (rarity) {
    const byRarity = pool.filter((j) => j.rarity === rarity);
    if (byRarity.length) return randomFrom(byRarity);
  } else {
    const roll = Math.random();
    const wanted = roll < 0.66 ? "common" : roll < 0.93 ? "uncommon" : "rare";
    const byRarity = pool.filter((j) => j.rarity === wanted);
    if (byRarity.length) return randomFrom(byRarity);
  }
  return randomFrom(pool);
}

export function pickConsumableDef(kind = null) {
  const pool = kind === "tarot" ? TAROTS : kind === "planet" ? PLANETS : kind === "spectral" ? SPECTRALS : [...TAROTS, ...PLANETS];
  return randomFrom(pool);
}

export function addJoker(id, edition = null, opts = {}) {
  const def = JOKER_BY_ID[id];
  if (!def) return null;
  if (edition !== "negative" && nonNegativeJokers() >= jokerCapacity()) {
    if (!opts.silent) toast("No tienes espacio para más comodines.", "warn");
    return null;
  }
  const inst = {
    uid: uid("j"),
    id,
    edition: edition || null,
    data: copyData(def.defaultData),
  };
  store.state.jokers.push(inst);
  if (!opts.silent) toast(`${def.name} añadido.`, "good");
  return inst;
}

export function addConsumable(idOrKind, opts = {}) {
  let def = CONSUMABLE_BY_ID[idOrKind];
  if (!def) def = pickConsumableDef(idOrKind);
  if (!def) return null;
  if (store.state.consumables.length >= consumableCapacity()) {
    if (!opts.silent) toast("No tienes espacio para más consumibles.", "warn");
    return null;
  }
  const inst = { uid: uid("cons"), id: def.id, kind: def.kind, sellBonus: 0 };
  store.state.consumables.push(inst);
  if (!opts.silent) toast(`${def.name} añadido.`, "good");
  return inst;
}

export function createRandomPlayingCard({ rank = null, suit = null, enhancement = null, edition = null, seal = null } = {}) {
  return createCard(
    rank ?? randomFrom(RANKS),
    suit ?? randomFrom(SUITS),
    { enhancement, edition, seal },
  );
}

export function addCardToHand(card, opts = {}) {
  store.state.deck.push(card);
  store.state.hand.push(card);
  for (const ej of effectiveJokers(store.state)) {
    if (ej.inst.disabled) continue;
    if (ej.def?.onCardAdded) ej.def.onCardAdded(ej.dataInst || ej.inst, store.state);
  }
  if (!opts.silent) toast("Carta añadida a tu mano.", "good");
}

export function addCardToDeck(card) {
  store.state.deck.push(card);
  for (const ej of effectiveJokers(store.state)) {
    if (ej.inst.disabled) continue;
    if (ej.def?.onCardAdded) ej.def.onCardAdded(ej.dataInst || ej.inst, store.state);
  }
}

function removeFromArray(arr, card) {
  const i = arr.indexOf(card);
  if (i >= 0) arr.splice(i, 1);
  else {
    const j = arr.findIndex((c) => c.uid === card.uid);
    if (j >= 0) arr.splice(j, 1);
  }
}

export function destroyCard(card, { notify = true } = {}) {
  if (!card) return;
  const s = store.state;
  removeFromArray(s.deck, card);
  removeFromArray(s.hand, card);
  removeFromArray(s.drawPile, card);
  removeFromArray(s.discardPile, card);
  removeFromArray(s.played, card);
  store.selected.delete(card.uid);
  s.stats.cardsDestroyed = (s.stats.cardsDestroyed || 0) + 1;
  if (notify) {
    for (const ej of effectiveJokers(s)) {
      if (ej.inst.disabled) continue;
      if (ej.def?.onCardDestroyed) ej.def.onCardDestroyed(ej.dataInst || ej.inst, card, s);
    }
  }
}

export function randomEdition(includeNegative = false) {
  const pool = includeNegative ? ["foil", "holo", "poly", "negative"] : ["foil", "holo", "poly"];
  return randomFrom(pool);
}

export function snapshotJoker(inst) {
  return { id: inst.id, edition: inst.edition, data: copyData(inst.data) };
}

// ------------------------------------------------------------------
// joker hooks
// ------------------------------------------------------------------
export function runJokerHooks(name, ...args) {
  const s = store.state;
  if (!s) return;
  const withApi = name === "onBlindStart" || name === "onShopEnter";
  for (const ej of effectiveJokers(s)) {
    if (ej.inst.disabled) continue;
    const def = ej.def;
    if (!def || !def[name]) continue;
    if (withApi) def[name](ej.dataInst || ej.inst, s, jokerApi, ...args);
    else def[name](ej.dataInst || ej.inst, s, ...args);
  }
}

export const notifyJokerHook = runJokerHooks;

export const jokerApi = {
  createRandomJokers(n, rarity) {
    let count = 0;
    for (let i = 0; i < n; i++) {
      const def = pickJokerDef({ rarity, includeLegendary: rarity === "legendary" });
      if (addJoker(def.id, null, { silent: true })) count += 1;
    }
    if (count) toast(`${count} comodín(es) creado(s).`, "good");
  },
  createRandomJoker(rarity) {
    const def = pickJokerDef({ rarity, includeLegendary: rarity === "legendary" });
    const edition = Math.random() < 0.1 ? randomEdition() : null;
    addJoker(def.id, edition);
  },
  createRandomConsumables(n, kind) {
    for (let i = 0; i < n; i++) addConsumable(kind, { silent: true });
    toast(`${n} consumible(s) creado(s).`, "good");
  },
  addRandomCardWithSeal() {
    const card = createRandomPlayingCard({ seal: randomFrom(Object.keys(SEALS)) });
    addCardToHand(card, { silent: true });
    toast("Certificado: carta con sello añadida.", "good");
  },
  destroyRandomJoker(protect) {
    const pool = store.state.jokers.filter((j) => j !== protect);
    if (!pool.length) return;
    const victim = randomFrom(pool);
    store.state.jokers = store.state.jokers.filter((j) => j !== victim);
    toast(`${JOKER_BY_ID[victim.id]?.name || "Comodín"} destruido.`, "warn");
  },
  negativeCopyConsumable() {
    if (!store.state.consumables.length) return;
    const src = randomFrom(store.state.consumables);
    addConsumable(src.id, { silent: true });
    toast("Perkeo creó una copia Negativa de un consumible.", "good");
  },
};

// ------------------------------------------------------------------
// consumable use API
// ------------------------------------------------------------------
export const useApi = {
  copyLastConsumable() {
    const id = store.state.lastConsumableId;
    if (!id) return toast("No hay un Tarot o Planeta previo que copiar.", "warn");
    addConsumable(id);
  },
  createRandomConsumables(n, kind) {
    for (let i = 0; i < n; i++) addConsumable(kind, { silent: true });
    toast(`${n} consumible(s) creado(s).`, "good");
  },
  createRandomJoker(rarity) {
    const def = pickJokerDef({ rarity, includeLegendary: rarity === "legendary" });
    const edition = Math.random() < 0.1 ? randomEdition() : null;
    addJoker(def.id, edition);
  },
  wheelOfFortune() {
    const s = store.state;
    if (!s.jokers.length) return toast("No tienes comodines para mejorar.", "warn");
    const chance = hasFlag(s, "oops") ? 0.5 : 0.25;
    if (Math.random() < chance) {
      const inst = randomFrom(s.jokers);
      inst.edition = randomEdition();
      toast(`La Rueda mejoró a ${JOKER_BY_ID[inst.id]?.name || "un comodín"}: ${inst.edition}.`, "good");
    } else {
      toast("La Rueda no ha tenido suerte… esta vez.", "warn");
    }
  },
  destroyCards(cards) {
    for (const card of [...cards]) destroyCard(card, { notify: true });
  },
  copyCard(left, right) {
    if (!left || !right) return;
    left.rank = right.rank;
    left.suit = right.suit;
    left.enhancement = right.enhancement;
    left.edition = right.edition;
    left.seal = right.seal;
    left.bonusChips = right.bonusChips || 0;
    left.faceDown = false;
  },
  temperance() {
    const s = store.state;
    const total = s.jokers.reduce((sum, j) => sum + sellValue(JOKER_BY_ID[j.id], j), 0);
    const gain = Math.min(50, total);
    s.money += gain;
    toast(`La Templanza te da ${gain} $.`, "good");
  },
  handCards() {
    return store.state.hand;
  },
  randomEdition() {
    return randomEdition();
  },
  addCardToHand,
  destroyRandomCards(n) {
    for (let i = 0; i < n; i++) {
      if (!store.state.deck.length) break;
      destroyCard(randomFrom(store.state.deck), { notify: true });
    }
  },
  spectralFamiliar() {
    const s = store.state;
    if (s.hand.length) destroyCard(randomFrom(s.hand), { notify: true });
    for (let i = 0; i < 3; i++) {
      const card = createRandomPlayingCard({ rank: randomFrom([11, 12, 13]), enhancement: randomFrom(Object.keys(ENHANCEMENTS)) });
      addCardToHand(card, { silent: true });
    }
    toast("Familiar: 3 figuras mejoradas añadidas.", "good");
  },
  spectralGrim() {
    const s = store.state;
    if (s.hand.length) destroyCard(randomFrom(s.hand), { notify: true });
    for (let i = 0; i < 2; i++) {
      const card = createRandomPlayingCard({ rank: 14, enhancement: randomFrom(Object.keys(ENHANCEMENTS)) });
      addCardToHand(card, { silent: true });
    }
    toast("Sombrío: 2 Ases mejorados añadidos.", "good");
  },
  spectralIncantation() {
    const s = store.state;
    if (s.hand.length) destroyCard(randomFrom(s.hand), { notify: true });
    for (let i = 0; i < 4; i++) {
      const card = createRandomPlayingCard({ rank: randomFrom([2, 3, 4, 5, 6, 7, 8, 9, 10]), enhancement: randomFrom(Object.keys(ENHANCEMENTS)) });
      addCardToHand(card, { silent: true });
    }
    toast("Conjuro: 4 cartas numeradas mejoradas añadidas.", "good");
  },
  negativeRandomJoker() {
    const s = store.state;
    if (!s.jokers.length) return toast("No tienes comodines que volver negativos.", "warn");
    const inst = randomFrom(s.jokers);
    inst.edition = "negative";
    toast(`${JOKER_BY_ID[inst.id]?.name || "Comodín"} ahora es Negativo.`, "good");
  },
  ankh() {
    const s = store.state;
    if (!s.jokers.length) return toast("No tienes comodines que copiar.", "warn");
    const src = randomFrom(s.jokers);
    const clone = { ...snapshotJoker(src), uid: uid("j") };
    s.jokers = [src, clone];
    toast(`Ankh copió a ${JOKER_BY_ID[src.id]?.name || "un comodín"}.`, "good");
  },
  hex() {
    const s = store.state;
    if (!s.jokers.length) return toast("No tienes comodines que mejorar.", "warn");
    const keep = randomFrom(s.jokers);
    keep.edition = "poly";
    s.jokers = [keep];
    toast(`Hex mejoró a ${JOKER_BY_ID[keep.id]?.name || "un comodín"} y destruyó el resto.`, "good");
  },
  cryptid(card) {
    if (!card) return;
    for (let i = 0; i < 2; i++) addCardToHand({ ...card, uid: uid("c"), faceDown: false }, { silent: true });
    toast("Criptido: 2 copias creadas.", "good");
  },
};

export function beginUseConsumable(instUid) {
  if (store.busy) return;
  const s = store.state;
  const inst = s.consumables.find((c) => c.uid === instUid);
  if (!inst) return;
  const def = CONSUMABLE_BY_ID[inst.id];
  if (!def) return;
  if (!canUseConsumable(def)) {
    toast(def.target > 0 ? "Solo puedes usar esta carta durante una ronda." : "No puedes usarla ahora.", "warn");
    return;
  }
  store.modalHtml = null;
  if (def.target > 0) {
    if (!s.hand.length) return toast("No hay cartas en tu mano para seleccionar.", "warn");
    store.pendingUse = inst.uid;
    store.selected.clear();
    render();
    toast(`Selecciona ${def.variable ? `hasta ${def.target}` : def.target} carta(s) para ${def.name}.`);
    sfx("select");
  } else {
    applyConsumable(inst, []);
  }
}

export function applyConsumable(inst, cards) {
  const s = store.state;
  const def = CONSUMABLE_BY_ID[inst.id];
  if (!def) return;
  const targetCards = [...cards];
  if (!useSelectionValid(def, targetCards)) {
    toast(`Necesitas seleccionar ${def.variable ? "al menos 1 y hasta " : ""}${requiredTarget(def)} carta(s).`, "warn");
    return;
  }
  def.apply(s, targetCards, useApi);
  s.consumables = s.consumables.filter((c) => c !== inst);
  if (def.kind === "planet") notifyJokerHook("onPlanetUsed");
  if (def.kind === "tarot") notifyJokerHook("onTarotUsed");
  if (def.kind === "tarot" || def.kind === "planet") s.lastConsumableId = def.id;
  store.pendingUse = null;
  store.selected.clear();
  sfx("score");
  toast(`${def.name}: ${def.text}`, "good");
  save();
  render();
}

export function cancelUse() {
  store.pendingUse = null;
  store.selected.clear();
  render();
}

// ------------------------------------------------------------------
// selling
// ------------------------------------------------------------------
export function sellJoker(instUid) {
  const s = store.state;
  const inst = s.jokers.find((j) => j.uid === instUid);
  if (!inst) return;
  const def = JOKER_BY_ID[inst.id];
  const value = sellValue(def, inst);
  s.money += value;
  for (const ej of effectiveJokers(s)) {
    if (ej.inst.disabled) continue;
    if (ej.def?.onSell) ej.def.onSell(ej.dataInst || ej.inst, s, "joker");
  }
  s.jokers = s.jokers.filter((j) => j !== inst);
  store.modalHtml = null;
  sfx("buy");
  toast(`${def?.name || "Comodín"} vendido por ${value} $.`, "good");
  save();
  render();
}

export function sellConsumable(instUid) {
  const s = store.state;
  const inst = s.consumables.find((c) => c.uid === instUid);
  if (!inst) return;
  const def = CONSUMABLE_BY_ID[inst.id];
  const value = Math.max(1, Math.floor((def?.cost || 3) / 2) + (inst.sellBonus || 0));
  s.money += value;
  for (const ej of effectiveJokers(s)) {
    if (ej.inst.disabled) continue;
    if (ej.def?.onSell) ej.def.onSell(ej.dataInst || ej.inst, s, "consumable");
  }
  s.consumables = s.consumables.filter((c) => c !== inst);
  store.pendingUse = null;
  store.modalHtml = null;
  sfx("buy");
  toast(`${def?.name || "Consumible"} vendido por ${value} $.`, "good");
  save();
  render();
}

export function consumableSummary(inst) {
  const def = CONSUMABLE_BY_ID[inst.id];
  return def ? escapeHtml(`${def.name}: ${def.text}`) : "";
}
