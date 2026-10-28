import { store, MAX_SELECT } from "./store.js";
import { HAND_INFO, handStats } from "./content.js";
import { evaluateHand, bossActive } from "./core.js";

export function selectedCards() {
  const s = store.state;
  if (!s) return [];
  const cards = s.hand.filter((c) => store.selected.has(c.uid));
  const suitOrder = { S: 0, H: 1, C: 2, D: 3 };
  if (s.sortMode === "suit") cards.sort((a, b) => (suitOrder[a.suit] - suitOrder[b.suit]) || (b.rank - a.rank));
  else cards.sort((a, b) => (b.rank - a.rank) || (suitOrder[a.suit] - suitOrder[b.suit]));
  return cards;
}

export function previewHand() {
  const s = store.state;
  if (!s || s.phase !== "round") return null;
  const cards = selectedCards();
  if (!cards.length) return null;
  const ev = evaluateHand(cards, s);
  const base = handStats(ev.type, s.handLevels[ev.type] || 1);
  return { ...ev, base, level: s.handLevels[ev.type] || 1 };
}

export function restrictionWarning(ev) {
  const s = store.state;
  if (!ev || !s) return "";
  if (bossActive(s, "psychic") && ev.played.length !== 5) return "La Psíquica exige exactamente 5 cartas.";
  if (bossActive(s, "eye") && s.playedTypesThisRound.includes(ev.type)) return `El Ojo prohíbe repetir ${HAND_INFO[ev.type].name}.`;
  if (bossActive(s, "mouth") && s.chosenType && ev.type !== s.chosenType) return `La Boca solo permite ${HAND_INFO[s.chosenType].name}.`;
  return "";
}

export function phaseBlocksInput() {
  return store.busy || store.state?.phase !== "round";
}

export function canPlaySelection() {
  const s = store.state;
  if (!s || phaseBlocksInput() || s.phase !== "round" || store.pendingUse) return false;
  const cards = selectedCards();
  if (!cards.length || cards.length > MAX_SELECT) return false;
  const ev = evaluateHand(cards, s);
  if (bossActive(s, "psychic") && cards.length !== 5) return false;
  if (bossActive(s, "eye") && s.playedTypesThisRound.includes(ev.type)) return false;
  if (bossActive(s, "mouth") && s.chosenType && ev.type !== s.chosenType) return false;
  return true;
}

export function canDiscardSelection() {
  const s = store.state;
  return !!s && !phaseBlocksInput() && !store.pendingUse && s.phase === "round" && s.discardsLeft > 0 && selectedCards().length > 0;
}

export function canUseConsumable(def) {
  const s = store.state;
  if (!s || s.phase === "lost" || s.phase === "won") return false;
  if (def.target > 0 && s.phase !== "round") return false;
  return true;
}

export function requiredTarget(def) {
  if (!def.target) return 0;
  return Math.min(def.target, store.state.hand.length);
}

export function useSelectionValid(def, cards) {
  if (!def.target) return true;
  if (def.variable) return cards.length >= 1 && cards.length <= def.target;
  return cards.length === requiredTarget(def);
}
