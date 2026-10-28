import { store } from "./store.js";
import {
  HAND_INFO, handStats, CONSUMABLE_BY_ID,
} from "./content.js";
import { evaluateHand, scoreHand, bossActive, bossEffectEnabled } from "./core.js";
import {
  selectedCards, canPlaySelection, canDiscardSelection, previewHand,
} from "./rules.js";
import {
  sleep, maxHandSize, interestCap, save, mostPlayedType, randomFrom,
} from "./helpers.js";
import {
  runJokerHooks, addConsumable, destroyCard,
} from "./items.js";
import { drawCards } from "./setup.js";
import { loseRun } from "./endings.js";
import { toast, sfx } from "./fx.js";
import { render } from "./ui.js";

function returnAllCardsToDeck() {
  const s = store.state;
  const all = [...s.deck, ...s.drawPile, ...s.hand, ...s.discardPile, ...s.played];
  const seen = new Set();
  const unique = [];
  for (const card of all) {
    if (seen.has(card.uid)) continue;
    seen.add(card.uid);
    card.debuffed = false;
    card.faceDown = false;
    unique.push(card);
  }
  s.deck = unique;
  s.drawPile = [];
  s.hand = [];
  s.discardPile = [];
  s.played = [];
}

function enterCashout() {
  const s = store.state;
  s.stats.roundsWon = (s.stats.roundsWon || 0) + 1;
  s.jokers.forEach((j) => { j.disabled = false; });
  s.disabledJokerUid = null;
  runJokerHooks("onRoundEnd");
  const beforeJokers = s.jokers.length;
  s.jokers = s.jokers.filter((j) => !j.destroyed);
  if (s.jokers.length < beforeJokers) toast("Un comodín se ha destruido al final de la ronda.", "warn");
  for (const j of s.jokers) {
    if (j.id === "campfire" && s.blindIndex === 2) j.data.xmult = 1;
  }
  for (const card of s.hand) {
    if (card.enhancement === "gold") s.money += 3;
    if (card.seal === "blue") addConsumable("planet", { silent: true });
  }
  const reward = s.blind?.reward || 0;
  const handsBonus = Math.max(0, s.handsLeft || 0);
  const discardBonus = Math.max(0, s.discardsLeft || 0);
  const interest = Math.min(interestCap(), Math.floor(Math.max(0, s.money) / 5));
  const rows = [
    { label: `Recompensa de ${s.blind?.name || "la ciega"}`, value: reward },
    { label: "Manos sobrantes", value: handsBonus },
    { label: "Descartes sobrantes", value: discardBonus },
    { label: "Intereses", value: interest },
  ];
  const total = reward + handsBonus + discardBonus + interest;
  s.cashout = { rows, total };
  s.phase = "cashout";
  returnAllCardsToDeck();
  store.displayScore = { chips: 0, mult: 0 };
  if (total > 0) sfx("cash");
  save();
  render();
}

function scoreSnapshot(ev) {
  const s = store.state;
  const base = handStats(ev.type, s.handLevels[ev.type] || 1);
  return { chips: base.chips, mult: base.mult };
}

async function animateScore(from, result) {
  const steps = 7;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const eased = 1 - Math.pow(1 - t, 2);
    store.displayScore = {
      chips: Math.round(from.chips + (result.chips - from.chips) * eased),
      mult: +(from.mult + (result.mult - from.mult) * eased).toFixed(2),
    };
    render();
    await sleep(45);
  }
}

function markDestroyed(cards) {
  for (const card of cards || []) destroyCard(card, { notify: false });
}

function collectionStats(result) {
  const s = store.state;
  if (result.total > (s.stats.bestScore || 0)) {
    s.stats.bestScore = result.total;
    s.stats.bestHand = result.type;
    s.stats.bestHandCount = result.scoring?.length || 0;
  }
}

export async function playSelectedHand() {
  if (!canPlaySelection() || store.busy) return;
  const s = store.state;
  const cards = selectedCards();
  if (!cards.length) return;
  store.busy = true;
  store.pendingUse = null;
  store.modalHtml = null;

  const ev = evaluateHand(cards, s);
  const mostBefore = mostPlayedType();
  const from = scoreSnapshot(ev);
  store.displayScore = { ...from };
  s.played = [...cards];
  s.hand = s.hand.filter((c) => !store.selected.has(c.uid));
  store.selected.clear();
  s.handsLeft = Math.max(0, s.handsLeft - 1);
  s.stats.handsPlayed = (s.stats.handsPlayed || 0) + 1;
  sfx("play");
  render();
  await sleep(220);

  const result = scoreHand(s, ev);
  await animateScore(from, result);

  s.roundScore += result.total;
  s.money += result.moneyGain || 0;
  s.handPlays[ev.type] = (s.handPlays[ev.type] || 0) + 1;
  s.playedTypesThisRound.push(ev.type);
  s.handsPlayedThisRound = (s.handsPlayedThisRound || 0) + 1;
  s.lastHandType = ev.type;
  s.lastPlayed = cards;
  if (bossEffectEnabled(s) && s.blind?.bossId === "mouth" && !s.chosenType) s.chosenType = ev.type;
  if (bossEffectEnabled(s) && s.blind?.bossId === "arm") {
    s.handLevels[ev.type] = Math.max(1, (s.handLevels[ev.type] || 1) - 1);
  }
  if (bossEffectEnabled(s) && s.blind?.bossId === "tooth") {
    s.money = Math.max(0, s.money - cards.length);
  }
  if (bossEffectEnabled(s) && s.blind?.bossId === "ox" && mostBefore && ev.type === mostBefore) {
    s.money = 0;
    toast("El Buey te ha dejado sin dinero.", "warn");
  }
  if (bossEffectEnabled(s) && s.blind?.bossId === "heart" && s.jokers.length) {
    const victim = randomFrom(s.jokers);
    victim.disabled = true;
    s.disabledJokerUid = victim.uid;
    toast(`El Corazón Carmesí desactivó a ${victim.id}.`, "warn");
  }
  collectionStats(result);

  if (result.moneyGain) toast(`+${result.moneyGain} $ de tus comodines y cartas.`, "good");
  for (const item of result.createdConsumables || []) addConsumable(item.kind, { silent: true });
  markDestroyed(result.destroy);
  runJokerHooks("onHandPlayed");
  store.displayScore = { chips: result.chips, mult: result.mult };
  sfx("score");
  render();
  await sleep(420);

  s.played.forEach((card) => {
    if (!s.deck.some((c) => c.uid === card.uid)) return;
    s.discardPile.push(card);
  });
  s.played = [];
  if (bossEffectEnabled(s) && s.blind?.bossId === "hook") {
    for (let i = 0; i < 2 && s.hand.length; i++) {
      const card = randomFrom(s.hand);
      s.hand = s.hand.filter((c) => c !== card);
      s.discardPile.push(card);
      store.selected.delete(card.uid);
    }
  }
  store.displayScore = { chips: 0, mult: 0 };

  if (s.roundScore >= s.target) {
    store.busy = false;
    enterCashout();
    return;
  }
  if (s.handsLeft <= 0) {
    store.busy = false;
    loseRun();
    return;
  }

  if (bossEffectEnabled(s) && s.blind?.bossId === "fish") s.faceDownDraw = true;
  drawCards(Math.max(0, maxHandSize() - s.hand.length));
  if (bossEffectEnabled(s) && s.blind?.bossId === "serpent") drawCards(3);
  store.busy = false;
  save();
  render();
}

export async function discardSelected() {
  if (!canDiscardSelection() || store.busy) return;
  const s = store.state;
  const cards = selectedCards();
  if (!cards.length) return;
  store.busy = true;
  store.pendingUse = null;
  store.modalHtml = null;
  const uids = new Set(cards.map((c) => c.uid));
  s.hand = s.hand.filter((c) => !uids.has(c.uid));
  s.discardPile.push(...cards);
  store.selected.clear();
  s.discardsLeft = Math.max(0, s.discardsLeft - 1);
  for (const card of cards) {
    if (card.seal === "purple") addConsumable("tarot", { silent: true });
  }
  runJokerHooks("onDiscard", cards);
  sfx("discard");
  if (bossEffectEnabled(s) && s.blind?.bossId === "fish") s.faceDownDraw = true;
  drawCards(Math.max(0, maxHandSize() - s.hand.length));
  if (bossEffectEnabled(s) && s.blind?.bossId === "serpent") drawCards(3);
  store.busy = false;
  save();
  render();
}

export function runInfo() {
  const s = store.state;
  if (!s) return null;
  return {
    hand: s.hand.length,
    maxHand: maxHandSize(),
    bestType: mostPlayedType(),
    preview: previewHand(),
    handName: previewHand() ? HAND_INFO[previewHand().type].name : null,
    planets: s.consumables.filter((c) => c.kind === "planet").map((c) => CONSUMABLE_BY_ID[c.id]?.name).filter(Boolean),
    bossActive: !!s.blind?.bossId && bossActive(s, s.blind.bossId),
  };
}
