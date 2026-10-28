import { store, MAX_SELECT, SOUND_KEY } from "./store.js";
import { CONSUMABLE_BY_ID } from "./content.js";
import { selectedCards } from "./rules.js";
import { loadSave, save } from "./helpers.js";
import {
  render, helpHtml, infoHtml, menuHtml, jokerDetailHtml, consumableDetailHtml,
} from "./ui.js";
import { initFx, toast, sfx } from "./fx.js";
import { playSelectedHand, discardSelected } from "./flow.js";
import { selectBlind, skipBlind, startNewRun, drawCards } from "./setup.js";
import {
  beginUseConsumable, applyConsumable, cancelUse, sellJoker, sellConsumable,
} from "./items.js";
import {
  buyShop, rerollShop, leaveShop, pickPackItem, closePack, claimCashout, openPack,
} from "./shop.js";

function collectRefs() {
  const ids = {
    topbar: "stat-strip",
    blindPanel: "blind-panel",
    runPanel: "run-panel",
    jokerRow: "joker-row",
    jokerMeta: "joker-meta",
    consumableRow: "consumable-row",
    consumableMeta: "consumable-meta",
    playArea: "play-area",
    handInfo: "hand-info",
    handRow: "hand-row",
    roundScore: "round-score",
    roundTarget: "round-target",
    chipTotal: "chip-total",
    multTotal: "mult-total",
    playBtn: "play-btn",
    discardBtn: "discard-btn",
    deckCount: "deck-count",
    discardCount: "discard-count",
    overlay: "overlay-root",
    toast: "toast-root",
    tooltip: "tooltip-root",
  };
  const refs = {};
  for (const [key, id] of Object.entries(ids)) refs[key] = document.getElementById(id);
  return refs;
}

function createUseBar() {
  let bar = document.getElementById("use-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "use-bar";
    bar.className = "use-bar hidden";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Usar consumible");
    document.body.appendChild(bar);
  }
  return bar;
}

function updateSoundButton() {
  const btn = document.getElementById("sound-btn");
  if (!btn) return;
  btn.classList.toggle("off", !store.soundOn);
  btn.setAttribute("aria-pressed", String(store.soundOn));
  btn.title = store.soundOn ? "Silenciar sonido" : "Activar sonido";
}

function resumeRun() {
  const saved = loadSave();
  if (!saved) {
    startNewRun();
    return;
  }
  store.state = saved;
  store.started = true;
  store.modalHtml = null;
  store.pendingUse = null;
  store.selected.clear();
  store.displayScore = { chips: 0, mult: 0 };
  if (saved.phase === "round" && !saved.hand.length && saved.drawPile.length) {
    drawCards(Math.min(8, saved.drawPile.length));
  }
  save();
  toast("Partida recuperada.", "good");
  render();
}

function openModal(html) {
  store.modalHtml = html;
  render();
}

function closeModal() {
  store.modalHtml = null;
  render();
}

function toggleSound() {
  store.soundOn = !store.soundOn;
  localStorage.setItem(SOUND_KEY, store.soundOn ? "on" : "off");
  updateSoundButton();
  if (store.soundOn) sfx("select");
}

function findJoker(uid) {
  return store.state?.jokers.find((j) => j.uid === uid);
}

function findConsumable(uid) {
  return store.state?.consumables.find((c) => c.uid === uid);
}

function selectCard(uid) {
  const s = store.state;
  if (!s || store.busy || s.phase !== "round") return;
  const card = s.hand.find((c) => c.uid === uid);
  if (!card) return;
  if (store.selected.has(uid)) {
    store.selected.delete(uid);
  } else {
    let max = MAX_SELECT;
    if (store.pendingUse) {
      const inst = findConsumable(store.pendingUse);
      const def = inst ? CONSUMABLE_BY_ID[inst.id] : null;
      if (def) max = Math.min(max, def.target || max);
    }
    if (store.selected.size >= max) {
      toast(max === 1 ? "Este consumible solo usa 1 carta." : `Puedes seleccionar hasta ${max} cartas.`, "warn");
      return;
    }
    store.selected.add(uid);
  }
  sfx("select");
  render();
}

function handleAction(action, el) {
  switch (action) {
    case "start-run":
      startNewRun();
      break;
    case "continue-run":
      resumeRun();
      break;
    case "restart-run":
      startNewRun();
      break;
    case "help":
      openModal(helpHtml());
      break;
    case "info":
      if (store.state) openModal(infoHtml());
      break;
    case "menu":
      if (store.state) openModal(menuHtml());
      break;
    case "close-modal":
      closeModal();
      break;
    case "show-title":
      store.started = false;
      store.modalHtml = null;
      store.pendingUse = null;
      store.selected.clear();
      render();
      break;
    case "select-blind":
      selectBlind();
      break;
    case "skip-blind": {
      const freePack = skipBlind();
      if (freePack) openPack(freePack, { free: true });
      break;
    }
    case "use-confirm": {
      const inst = findConsumable(store.pendingUse);
      if (!inst) return;
      applyConsumable(inst, selectedCards());
      break;
    }
    case "use-cancel":
      cancelUse();
      break;
    case "use-consumable": {
      const inst = findConsumable(el.dataset.uid);
      if (inst) beginUseConsumable(inst.uid);
      break;
    }
    case "sell-joker":
      sellJoker(el.dataset.uid);
      break;
    case "sell-consumable":
      sellConsumable(el.dataset.uid);
      break;
    case "shop-buy":
      buyShop(el.dataset.kind, Number(el.dataset.index));
      break;
    case "shop-reroll":
      rerollShop();
      break;
    case "shop-exit":
      leaveShop();
      break;
    case "shop-sell-help":
      toast("Puedes vender comodines y consumibles haciendo clic en sus fichas.", "good");
      break;
    case "pack-pick":
      pickPackItem(Number(el.dataset.index));
      break;
    case "pack-skip":
      closePack();
      break;
    case "claim-cashout":
      claimCashout();
      break;
    default:
      break;
  }
}

function onDocumentClick(e) {
  const actionEl = e.target.closest("[data-action]");
  if (actionEl) {
    e.preventDefault();
    handleAction(actionEl.dataset.action, actionEl);
    return;
  }
  const cardEl = e.target.closest("[data-hand-uid]");
  if (cardEl) {
    selectCard(cardEl.dataset.handUid);
    return;
  }
  const jokerEl = e.target.closest("[data-joker-uid]");
  if (jokerEl) {
    const inst = findJoker(jokerEl.dataset.jokerUid);
    if (inst) {
      store.pendingUse = null;
      openModal(jokerDetailHtml(inst));
    }
    return;
  }
  const consEl = e.target.closest("[data-consumable-uid]");
  if (consEl) {
    const inst = findConsumable(consEl.dataset.consumableUid);
    if (inst) openModal(consumableDetailHtml(inst));
    return;
  }
  const tipEl = e.target.closest("[data-tip]");
  if (tipEl) hideTooltip();
}

function onDocumentOver(e) {
  const el = e.target.closest("[data-tip]");
  if (!el || !store.refs.tooltip) return;
  const tip = store.refs.tooltip;
  tip.textContent = el.dataset.tip;
  tip.classList.add("show");
  const pad = 14;
  const x = Math.min(window.innerWidth - 280, e.clientX + pad);
  const y = Math.max(8, e.clientY - 40);
  tip.style.left = `${Math.max(8, x)}px`;
  tip.style.top = `${y}px`;
}

function hideTooltip() {
  if (store.refs.tooltip) store.refs.tooltip.classList.remove("show");
}

function onKeyDown(e) {
  const tag = (e.target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return;
  if (e.key === "Escape") {
    if (store.pendingUse) { cancelUse(); return; }
    if (store.modalHtml) { closeModal(); return; }
    return;
  }
  if (!store.started || !store.state) return;
  if (e.key === " " || e.code === "Space") {
    if (store.state.phase === "round" && !store.modalHtml && !store.pendingUse) {
      e.preventDefault();
      playSelectedHand();
    }
    return;
  }
  if (e.key === "d" || e.key === "D") {
    if (store.state.phase === "round" && !store.modalHtml && !store.pendingUse) {
      e.preventDefault();
      discardSelected();
    }
  }
}

function boot() {
  const refs = collectRefs();
  store.refs = refs;
  initFx(refs);
  createUseBar();
  updateSoundButton();

  document.getElementById("help-btn")?.addEventListener("click", () => {
    if (store.state) openModal(helpHtml());
  });
  document.getElementById("sound-btn")?.addEventListener("click", toggleSound);
  document.getElementById("menu-btn")?.addEventListener("click", () => {
    if (store.state) openModal(menuHtml());
  });
  document.getElementById("info-btn")?.addEventListener("click", () => {
    if (store.state) openModal(infoHtml());
  });
  document.getElementById("play-btn")?.addEventListener("click", () => playSelectedHand());
  document.getElementById("discard-btn")?.addEventListener("click", () => discardSelected());
  document.getElementById("sort-rank-btn")?.addEventListener("click", () => {
    if (!store.state) return;
    store.state.sortMode = "rank";
    save();
    render();
  });
  document.getElementById("sort-suit-btn")?.addEventListener("click", () => {
    if (!store.state) return;
    store.state.sortMode = "suit";
    save();
    render();
  });

  document.addEventListener("click", onDocumentClick);
  document.addEventListener("pointerover", onDocumentOver);
  document.addEventListener("pointerout", (e) => {
    if (e.target.closest("[data-tip]")) hideTooltip();
  });
  document.addEventListener("keydown", onKeyDown);
  window.addEventListener("beforeunload", () => save());

  render();
}

window.__BALATRO__ = {
  store,
  render,
  get state() { return store.state; },
};

boot();
