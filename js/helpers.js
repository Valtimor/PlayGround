import { store, SAVE_KEY } from "./store.js";
import { HAND_ORDER } from "./content.js";
import { passiveStats, hasJoker } from "./core.js";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
export const money = (n) => `$${Math.max(0, Math.round(n))}`;
export const copyData = (data) => JSON.parse(JSON.stringify(data || {}));

export const hasVoucher = (id) => (store.state?.vouchers || []).includes(id);
export const voucherCount = (id) => (store.state?.vouchers || []).filter((v) => v === id).length;

export function mostPlayedType(s = store.state) {
  let best = "High Card";
  let n = -1;
  for (const [type, count] of Object.entries(s?.handPlays || {})) {
    if (count > n) { n = count; best = type; }
  }
  return n > 0 ? best : null;
}

export function jokerCapacity() { return 5 + voucherCount("antimatter"); }
export function consumableCapacity() { return 2 + voucherCount("hone"); }
export function nonNegativeJokers() { return store.state.jokers.filter((j) => j.edition !== "negative").length; }

export function maxHandSize() {
  const passive = passiveStats(store.state);
  return Math.max(1, 8 + voucherCount("brush") + passive.handSize - (store.state.handSizePenalty || 0) - (store.state.blindHandPenalty || 0));
}

export function interestCap() {
  return 5 + 5 * voucherCount("seed") + (hasJoker(store.state, "moon") ? 5 : 0);
}

export function shopJokerSlots() { return 2 + voucherCount("overstock"); }
export function priceMultiplier() { return hasVoucher("clearance") ? 0.75 : 1; }
export function priceOf(base) { return Math.max(1, Math.round(base * priceMultiplier())); }

export function rerollPrice() {
  const base = (store.state?.shop?.rerolls || 0) + 4 - 2 * voucherCount("reroll");
  return Math.max(1, Math.round(base * priceMultiplier()));
}

export function editionChance() { return hasVoucher("glow") ? 2 / 15 : 1 / 15; }

export function makeSeed() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function serializeState() {
  const s = store.state;
  if (!s) return null;
  const copy = {};
  for (const [key, value] of Object.entries(s)) {
    if (["drawPile", "hand", "discardPile", "played"].includes(key)) continue;
    copy[key] = value;
  }
  copy.drawPile = s.drawPile.map((c) => c.uid);
  copy.hand = s.hand.map((c) => c.uid);
  copy.discardPile = s.discardPile.map((c) => c.uid);
  copy.played = s.played.map((c) => c.uid);
  return copy;
}

export function save() {
  const s = store.state;
  if (!s || s.phase === "lost") return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(serializeState())); } catch { /* storage full */ }
}

export function hydrateState(s) {
  const byUid = new Map(s.deck.map((c) => [c.uid, c]));
  for (const key of ["drawPile", "hand", "discardPile", "played"]) {
    s[key] = (s[key] || []).map((u) => byUid.get(u)).filter(Boolean);
  }
  s.deck.forEach((c) => {
    c.enhancement = c.enhancement || null;
    c.edition = c.edition || null;
    c.seal = c.seal || null;
    c.bonusChips = c.bonusChips || 0;
    c.faceDown = !!c.faceDown;
    c.debuffed = !!c.debuffed;
  });
  s.jokers = (s.jokers || []).map((j) => ({ ...j, data: j.data || {} }));
  s.consumables = (s.consumables || []).map((c) => ({ ...c, sellBonus: c.sellBonus || 0 }));
  s.vouchers = s.vouchers || [];
  s.tags = s.tags || [];
  s.stats = s.stats || { handsPlayed: 0, roundsWon: 0, bestScore: 0, bestHand: null, cardsDestroyed: 0 };
  s.seenBosses = s.seenBosses || [];
  s.handLevels = s.handLevels || {};
  s.handPlays = s.handPlays || {};
  for (const type of HAND_ORDER) {
    if (!s.handLevels[type]) s.handLevels[type] = 1;
    if (!s.handPlays[type]) s.handPlays[type] = 0;
  }
  s.playedTypesThisRound = s.playedTypesThisRound || [];
  s.sortMode = s.sortMode || "rank";
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || !Array.isArray(data.deck)) return null;
    hydrateState(data);
    return data;
  } catch { return null; }
}
