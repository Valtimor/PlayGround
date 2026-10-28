import { store, MAX_SELECT, SAVE_KEY } from "./store.js";
import {
  SUIT_INFO, rankLabel, HAND_INFO, HAND_ORDER, handStats, ENHANCEMENTS, EDITIONS, SEALS,
  JOKER_BY_ID, sellValue, CONSUMABLE_BY_ID, BOSS_BY_ID, VOUCHER_BY_ID, TAGS, PACK_INFO,
} from "./content.js";
import { bossEffectEnabled, hasJoker } from "./core.js";
import {
  money, mostPlayedType, jokerCapacity, consumableCapacity, nonNegativeJokers,
  interestCap, rerollPrice, escapeHtml,
} from "./helpers.js";
import {
  selectedCards, previewHand, restrictionWarning, canPlaySelection, canDiscardSelection,
  requiredTarget, useSelectionValid,
} from "./rules.js";

// ------------------------------------------------------------------
// card markup
// ------------------------------------------------------------------
export function cardHtml(card, { inHand = false, index = 0 } = {}) {
  const info = SUIT_INFO[card.suit] || { symbol: "?", color: "black" };
  const stone = card.enhancement === "stone";
  const cls = [
    "card",
    stone ? "black" : info.color,
    inHand ? "in-hand" : "",
    store.selected.has(card.uid) ? "selected" : "",
    card.debuffed ? "debuffed" : "",
    card.faceDown ? "face-down" : "",
    card.enhancement ? `enh-${card.enhancement}` : "",
  ].filter(Boolean).join(" ");
  const enh = card.enhancement ? ENHANCEMENTS[card.enhancement] : null;
  const seal = card.seal ? SEALS[card.seal] : null;
  const ed = card.edition ? EDITIONS[card.edition] : null;
  const tip = card.faceDown
    ? "Carta boca abajo"
    : stone
      ? "Carta de Piedra: +50 Chips, sin rango ni palo."
      : `${rankLabel(card.rank)}${info.symbol} · ${info.name}${enh ? ` · ${enh.name}: ${enh.desc}` : ""}${seal ? ` · Sello ${seal.name}: ${seal.desc}` : ""}${ed ? ` · ${ed.name}: ${ed.desc}` : ""}`;
  return `
    <div class="${cls}" ${inHand ? `data-hand-uid="${card.uid}"` : ""} data-tip="${escapeHtml(tip)}" style="animation-delay:${Math.min(index * 24, 220)}ms">
      ${card.faceDown ? "" : `
        <div class="corner"><span class="r">${stone ? "" : rankLabel(card.rank)}</span><span class="s">${stone ? "" : info.symbol}</span></div>
        <div class="suit-big">${stone ? "🪨" : info.symbol}</div>
        <div class="corner bottom"><span class="r">${stone ? "" : rankLabel(card.rank)}</span><span class="s">${stone ? "" : info.symbol}</span></div>
        ${enh ? `<div class="enh-flag">${enh.short}</div>` : ""}
        ${ed ? `<div class="edition-mark ${ed.mark}"></div>` : ""}
        ${seal ? `<div class="seal-mark ${seal.cls}"></div>` : ""}
      `}
    </div>`;
}

export function jokerCardHtml(inst, { preview = false } = {}) {
  const def = JOKER_BY_ID[inst.id];
  if (!def) return "";
  const cls = [
    "joker",
    `rarity-${def.rarity}`,
    inst.edition ? EDITIONS[inst.edition]?.cls : "",
    inst.edition === "negative" ? "negative-slot" : "",
    store.state?.disabledJokerUid === inst.uid ? "disabled" : "",
  ].filter(Boolean).join(" ");
  return `
    <div class="${cls}" ${preview ? "" : `data-joker-uid="${inst.uid}"`} data-tip="${escapeHtml(`${def.name}: ${def.text}`)}">
      ${inst.edition ? `<span class="j-cost">${EDITIONS[inst.edition].name.slice(0, 3).toUpperCase()}</span>` : ""}
      <div class="j-art">${def.art}</div>
      <div class="j-name">${escapeHtml(def.name)}</div>
    </div>`;
}

export function consumableCardHtml(inst, { preview = false } = {}) {
  const def = CONSUMABLE_BY_ID[inst.id];
  if (!def) return "";
  const cls = ["consumable", def.kind, store.pendingUse === inst.uid ? "selected-use" : ""].filter(Boolean).join(" ");
  return `
    <div class="${cls}" ${preview ? "" : `data-consumable-uid="${inst.uid}"`} data-tip="${escapeHtml(`${def.name}: ${def.text}`)}">
      <span class="c-num">${def.num || ""}</span>
      <div class="c-art">${def.art}</div>
      <div class="c-name">${escapeHtml(def.name)}</div>
    </div>`;
}

const emptyJokerHtml = () => `<div class="joker joker-empty" aria-hidden="true"></div>`;
const emptyConsumableHtml = () => `<div class="slot-empty" aria-hidden="true"></div>`;

// ------------------------------------------------------------------
// board rendering
// ------------------------------------------------------------------
function renderTopbar() {
  const s = store.state;
  if (!s) { store.refs.topbar.innerHTML = ""; return; }
  const blindName = s.blind?.name || "—";
  const pill = (cls, ico, lbl, val) => `<div class="stat-pill ${cls}"><span class="ico">${ico}</span><div><span class="lbl">${lbl}</span><span class="val">${val}</span></div></div>`;
  store.refs.topbar.innerHTML = [
    pill("ante", "🏆", "ANTE", `${s.ante}/8`),
    pill("money", "💰", "DINERO", money(s.money)),
    pill("hands", "🖐️", "MANOS", s.phase === "round" ? s.handsLeft : "—"),
    pill("discards", "🗑️", "DESCARTES", s.phase === "round" ? s.discardsLeft : "—"),
    pill("score", "⭐", "RÉCORD", (s.stats.bestScore || 0).toLocaleString("es-ES")),
    pill("", "🎴", "CIEGA", blindName),
  ].join("");
}

function renderBlindPanel() {
  const s = store.state;
  if (!s?.blind) { store.refs.blindPanel.innerHTML = ""; return; }
  const b = s.blind;
  const boss = b.bossId ? BOSS_BY_ID[b.bossId] : null;
  const bannerCls = b.type === "boss" ? "boss" : b.type === "big" ? "big" : "";
  const typeLabel = b.type === "small" ? "CIEGA PEQUEÑA" : b.type === "big" ? "CIEGA GRANDE" : "CIEGA JEFE";
  const silenced = boss && !bossEffectEnabled(s);
  const progress = s.phase === "round" ? Math.min(100, Math.round((s.roundScore / Math.max(1, s.target)) * 100)) : 0;
  const inRound = s.phase === "round";
  const canSkip = s.phase === "blind" && b.type !== "boss";
  const actions = s.phase === "blind"
    ? `<div class="blind-actions">
        <button class="btn btn-orange btn-small" data-action="select-blind">JUGAR CIEGA</button>
        ${canSkip ? `<button class="btn btn-ghost btn-small" data-action="skip-blind">SALTAR</button>` : ""}
      </div>`
    : "";
  store.refs.blindPanel.innerHTML = `
    <div class="blind-banner ${bannerCls}">
      <span class="b-name">${escapeHtml(b.name)}</span>
      <span class="b-type">${typeLabel}</span>
    </div>
    <div class="blind-body">
      <div class="blind-icon-row">
        <div class="blind-icon">${b.art}</div>
        <div class="blind-target">
          <div class="lbl">PUNTUACIÓN OBJETIVO</div>
          <div class="req">${b.requirement.toLocaleString("es-ES")}</div>
          <div class="reward">Recompensa ${money(b.reward)}</div>
        </div>
      </div>
      ${boss ? `<div class="blind-effect"><strong>${escapeHtml(boss.name)}:</strong> ${escapeHtml(boss.text)}${silenced ? " <em>(anulado por Chicot)</em>" : ""}</div>` : ""}
      ${inRound ? `<div class="progress-track"><span style="width:${progress}%"></span></div><div class="progress-label">${s.roundScore.toLocaleString("es-ES")} / ${s.target.toLocaleString("es-ES")}</div>` : ""}
      ${actions}
    </div>`;
}

function renderRunPanel() {
  const s = store.state;
  if (!s) return;
  const tags = (s.tags || []).slice(-4).map((id) => {
    const tag = TAGS.find((t) => t.id === id);
    return tag ? `<span class="tag-badge" data-tip="${escapeHtml(`${tag.name}: ${tag.text}`)}">${escapeHtml(tag.name.replace("Etiqueta ", ""))}</span>` : "";
  }).join("");
  const vouchers = s.vouchers.map((id) => {
    const v = VOUCHER_BY_ID[id];
    return v ? `<span class="voucher-badge" data-tip="${escapeHtml(`${v.name}: ${v.text}`)}">${v.art}</span>` : "";
  }).join("");
  store.refs.runPanel.innerHTML = `
    <div class="run-title">PARTIDA</div>
    <div class="run-line"><span>Semilla</span><b>${s.seed}</b></div>
    <div class="run-line"><span>Comodines</span><b>${s.jokers.length}/${jokerCapacity()}</b></div>
    <div class="run-line"><span>Consumibles</span><b>${s.consumables.length}/${consumableCapacity()}</b></div>
    <div class="run-line"><span>Cartas en mazo</span><b>${s.deck.length}</b></div>
    <div class="run-line"><span>Mano más jugada</span><b>${HAND_INFO[mostPlayedType()]?.name || "—"}</b></div>
    <div class="run-sep"></div>
    <div class="run-line"><span>Interés máx.</span><b>${money(interestCap())}</b></div>
    <div class="run-line"><span>Manos jugadas</span><b>${s.stats.handsPlayed}</b></div>
    ${tags ? `<div class="run-sep"></div><div class="run-title">ETIQUETAS</div><div>${tags}</div>` : ""}
    ${vouchers ? `<div class="run-sep"></div><div class="run-title">VOUCHERS</div><div>${vouchers}</div>` : ""}
  `;
}

function renderJokers() {
  const s = store.state;
  if (!s) return;
  const capacity = jokerCapacity();
  const cards = s.jokers.map((j) => jokerCardHtml(j)).join("");
  const emptyCount = Math.max(0, capacity - nonNegativeJokers());
  store.refs.jokerRow.innerHTML = cards + Array.from({ length: emptyCount }, emptyJokerHtml).join("");
  store.refs.jokerMeta.textContent = `${s.jokers.length}/${capacity}`;
}

function renderConsumables() {
  const s = store.state;
  if (!s) return;
  const cards = s.consumables.map((c) => consumableCardHtml(c)).join("");
  const emptyCount = Math.max(0, consumableCapacity() - s.consumables.length);
  store.refs.consumableRow.innerHTML = cards + Array.from({ length: emptyCount }, emptyConsumableHtml).join("");
  store.refs.consumableMeta.textContent = `${s.consumables.length}/${consumableCapacity()}`;
}

function orderedHand() {
  const s = store.state;
  const hand = [...s.hand];
  const suitOrder = { S: 0, H: 1, C: 2, D: 3 };
  if (s.sortMode === "suit") hand.sort((a, b) => (suitOrder[a.suit] - suitOrder[b.suit]) || (b.rank - a.rank));
  else hand.sort((a, b) => (b.rank - a.rank) || (suitOrder[a.suit] - suitOrder[b.suit]));
  return hand;
}

function renderHand() {
  const s = store.state;
  if (!s) return;
  store.refs.handRow.innerHTML = orderedHand().map((c, i) => cardHtml(c, { inHand: true, index: i })).join("");
}

function renderPlayArea() {
  const s = store.state;
  if (!s) return;
  if (s.played.length) {
    store.refs.playArea.innerHTML = s.played.map((c, i) => cardHtml(c, { index: i })).join("");
    return;
  }
  let msg = "";
  if (store.pendingUse) msg = "Selecciona cartas para el consumible";
  else if (s.phase === "round") msg = "Selecciona hasta 5 cartas";
  else if (s.phase === "blind") msg = "Elige una ciega";
  store.refs.playArea.innerHTML = `<div class="play-hint">${msg}</div>`;
}

function renderScoreboard() {
  const s = store.state;
  if (!s) return;
  const preview = !store.busy ? previewHand() : null;
  const chips = preview ? preview.base.chips : store.displayScore.chips;
  const mult = preview ? preview.base.mult : store.displayScore.mult;
  store.refs.roundScore.textContent = (s.roundScore || 0).toLocaleString("es-ES");
  store.refs.roundTarget.textContent = `/ ${(s.target || 0).toLocaleString("es-ES")}`;
  store.refs.chipTotal.textContent = Math.round(chips).toLocaleString("es-ES");
  store.refs.multTotal.textContent = Number(mult).toFixed(Number(mult) % 1 ? 2 : 0);
}

function renderHandInfo() {
  const s = store.state;
  if (!s) return;
  if (store.pendingUse) {
    const inst = s.consumables.find((c) => c.uid === store.pendingUse);
    const def = inst ? CONSUMABLE_BY_ID[inst.id] : null;
    const n = selectedCards().length;
    store.refs.handInfo.innerHTML = def
      ? `<span class="hi-type">${escapeHtml(def.name)}</span><span class="hi-lv">${n}/${def.target}</span><span class="hi-score">${escapeHtml(def.text)}</span>`
      : "";
    return;
  }
  const preview = previewHand();
  if (!preview) {
    const text = s.phase === "round"
      ? `Selecciona cartas · Mano más jugada: ${HAND_INFO[mostPlayedType()]?.name || "—"}`
      : s.phase === "cashout" ? "Ronda superada"
      : s.phase === "shop" ? "Tienda abierta"
      : s.phase === "blind" ? "Elige tu próxima ciega"
      : "";
    store.refs.handInfo.innerHTML = `<span class="hi-score">${text}</span>`;
    return;
  }
  const warn = restrictionWarning(preview);
  store.refs.handInfo.innerHTML = `
    <span class="hi-type">${HAND_INFO[preview.type].name}</span>
    <span class="hi-lv">Nv.${preview.level}</span>
    <span class="hi-score">${preview.base.chips} Chips × ${preview.base.mult} Mult</span>
    ${warn ? `<span class="hi-warn">${escapeHtml(warn)}</span>` : ""}
  `;
}

function renderButtons() {
  const s = store.state;
  if (!s) return;
  store.refs.playBtn.disabled = !canPlaySelection();
  store.refs.discardBtn.disabled = !canDiscardSelection();
  store.refs.discardBtn.textContent = s.phase === "round" && s.discardsLeft === 0 ? "SIN DESCARTES" : "DESCARTAR";
}

function renderUseBar() {
  const bar = document.getElementById("use-bar");
  const s = store.state;
  if (!bar) return;
  if (!store.pendingUse || !s) { bar.classList.add("hidden"); bar.innerHTML = ""; return; }
  const inst = s.consumables.find((c) => c.uid === store.pendingUse);
  const def = inst ? CONSUMABLE_BY_ID[inst.id] : null;
  if (!def) { bar.classList.add("hidden"); return; }
  const cards = selectedCards();
  const valid = useSelectionValid(def, cards);
  bar.classList.remove("hidden");
  bar.innerHTML = `
    <div class="use-bar-info">
      <b>${escapeHtml(def.name)}</b>
      <span>${escapeHtml(def.text)}</span>
      <em>${cards.length}/${def.variable ? `≤${Math.min(def.target, s.hand.length)}` : requiredTarget(def)} cartas</em>
    </div>
    <button class="btn btn-gold btn-small" data-action="use-confirm" ${valid ? "" : "disabled"}>USAR</button>
    <button class="btn btn-ghost btn-small" data-action="use-cancel">CANCELAR</button>
  `;
}

export function render() {
  const s = store.state;
  if (!s) { renderOverlay(); return; }
  renderTopbar();
  renderBlindPanel();
  renderRunPanel();
  renderJokers();
  renderConsumables();
  renderHand();
  renderPlayArea();
  renderScoreboard();
  renderHandInfo();
  renderButtons();
  renderUseBar();
  store.refs.deckCount.textContent = s.phase === "round" ? s.drawPile.length : s.deck.length;
  store.refs.discardCount.textContent = s.discardPile.length;
  renderOverlay();
}

// ------------------------------------------------------------------
// overlays
// ------------------------------------------------------------------
function wrapModal(content, extraClass = "") {
  return `<div class="overlay"><div class="modal ${extraClass}"><button class="modal-close" data-action="close-modal" aria-label="Cerrar">✕</button>${content}</div></div>`;
}

export function titleHtml() {
  const hasSave = !!localStorage.getItem(SAVE_KEY);
  return `
    <div class="overlay">
      <div class="modal title-screen" style="background:transparent;border:none;box-shadow:none;max-height:none;overflow:visible;">
        <div class="title-logo">BALA<span>TRO</span></div>
        <div class="title-tagline">PÓKER · ROGUELIKE · COMODINES · CONSUMIBLES</div>
        <div class="title-actions">
          <button class="btn btn-red" data-action="${hasSave ? "continue-run" : "start-run"}" aria-label="Play">${hasSave ? "CONTINUAR" : "JUGAR"}</button>
          ${hasSave ? `<button class="btn btn-ghost" data-action="start-run" aria-label="New Run">NUEVA PARTIDA</button>` : ""}
          <button class="btn btn-ghost" data-action="help">CÓMO JUGAR</button>
        </div>
        <div class="title-note">Homenaje jugable · 112 comodines · 52 consumibles · 24 ciegas jefe</div>
      </div>
    </div>`;
}

export function helpHtml() {
  return wrapModal(`
    <div class="modal-head"><h2>CÓMO JUGAR</h2><div class="sub">LLEGA A LA CIEGA JEFE DEL ANTE 8</div></div>
    <div class="help-cols">
      <div class="help-card">
        <h3>OBJETIVO</h3>
        <p>Juega manos de póker para superar la puntuación de cada ciega. La puntuación es <b>Chips × Mult</b>.</p>
        <p>Cada ronda tienes 4 manos y 3 descartes. Al superar la ciega ganas dinero según las manos y descartes que te sobren, más intereses.</p>
        <p>Derrota las ciegas Pequeña, Grande y Jefe de cada Ante. Hay 8 antes.</p>
      </div>
      <div class="help-card">
        <h3>CONTROLES</h3>
        <ul>
          <li>Haz clic en las cartas para seleccionarlas (máx. 5).</li>
          <li><kbd>Espacio</kbd> juega la mano · <kbd>D</kbd> descarta.</li>
          <li>Haz clic en un <b>comodín</b> para verlo o venderlo.</li>
          <li>Haz clic en un <b>consumible</b> para usarlo o venderlo.</li>
        </ul>
      </div>
      <div class="help-card">
        <h3>COMODINES</h3>
        <p>Los comodines modifican tus manos: suman Chips o Mult, multiplican, repiten cartas o generan dinero. Tienes 5 espacios (ampliables).</p>
        <p>Los comodines <b>Negativos</b> no ocupan espacio.</p>
      </div>
      <div class="help-card">
        <h3>CONSUMIBLES</h3>
        <p><b>Tarots</b> mejoran o transforman cartas. <b>Planetas</b> suben el nivel de una mano de póker. <b>Espectrales</b> son raros y muy poderosos.</p>
        <p>Mejoras: Bonus (+30 Chips), Mult (+4 Mult), Cristal (x2 Mult), Acero (x1.5 en mano), Oro ($3), Suerte, Comodín y Piedra.</p>
      </div>
    </div>
    <div class="modal-actions"><button class="btn btn-orange" data-action="close-modal">ENTENDIDO</button></div>
  `);
}

export function infoHtml() {
  const s = store.state;
  const me = previewHand()?.type;
  const rows = HAND_ORDER.map((type) => {
    const lv = s.handLevels[type] || 1;
    const st = handStats(type, lv);
    const count = s.handPlays[type] || 0;
    return `<tr class="${me === type ? "me" : ""}"><td>${HAND_INFO[type].name}</td><td class="num">Nv.${lv}</td><td class="num chips-cell">${st.chips}</td><td class="num mult-cell">${st.mult}</td><td class="num">${count}</td></tr>`;
  }).join("");
  return wrapModal(`
    <div class="modal-head"><h2>INFO DE LA PARTIDA</h2><div class="sub">SEMILLA ${s.seed} · ANTE ${s.ante}</div></div>
    <table class="hand-table">
      <thead><tr><th>MANO</th><th>NIVEL</th><th>CHIPS</th><th>MULT</th><th>JUGADA</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-action="help">CÓMO JUGAR</button>
      <button class="btn btn-ghost" data-action="close-modal">CERRAR</button>
    </div>
  `);
}

export function menuHtml() {
  const s = store.state;
  return wrapModal(`
    <div class="modal-head"><h2>MENÚ</h2><div class="sub">BALATRO · HOMENAJE JUGABLE</div></div>
    <div class="modal-actions" style="justify-content:flex-start;flex-direction:column;align-items:stretch;gap:10px">
      <button class="btn btn-orange" data-action="close-modal">CONTINUAR PARTIDA</button>
      <button class="btn btn-ghost" data-action="help">CÓMO JUGAR</button>
      <button class="btn btn-danger" data-action="restart-run">NUEVA PARTIDA</button>
    </div>
    <div style="margin-top:16px;font-size:10px;color:var(--ink-dim);line-height:1.5">
      Progreso guardado automáticamente en este navegador.<br>
      Semilla: <b>${s?.seed || "—"}</b> · Comodines: <b>${s?.jokers.length || 0}</b> · Mazo: <b>${s?.deck.length || 0}</b> cartas
    </div>
  `);
}

export function jokerDetailHtml(inst) {
  const def = JOKER_BY_ID[inst.id];
  if (!def) return "";
  const value = sellValue(def, inst);
  const rarity = { common: "Común", uncommon: "Poco común", rare: "Raro", legendary: "Legendario" }[def.rarity] || def.rarity;
  const edition = inst.edition ? EDITIONS[inst.edition] : null;
  const canSell = store.state.phase !== "lost" && store.state.phase !== "won" && !store.busy;
  return wrapModal(`
    <div class="modal-head"><h2>${escapeHtml(def.name)}</h2><div class="sub">COMODÍN · ${rarity.toUpperCase()}</div></div>
    <div class="detail-row">
      <div class="detail-art">${jokerCardHtml(inst, { preview: true })}</div>
      <div class="detail-body">
        <div class="detail-text">${escapeHtml(def.text)}</div>
        <div class="detail-meta">
          <span>Valor de venta: <b>${money(value)}</b></span>
          <span>Coste: <b>${money(def.cost)}</b></span>
          ${edition ? `<span>Edición: <b>${edition.name}</b></span>` : ""}
        </div>
      </div>
    </div>
    <div class="modal-actions">
      ${canSell ? `<button class="btn btn-danger" data-action="sell-joker" data-uid="${inst.uid}">VENDER ${money(value)}</button>` : ""}
      <button class="btn btn-ghost" data-action="close-modal">CERRAR</button>
    </div>
  `);
}

export function consumableDetailHtml(inst) {
  const def = CONSUMABLE_BY_ID[inst.id];
  if (!def) return "";
  const value = Math.max(1, Math.floor((def.cost || 3) / 2) + (inst.sellBonus || 0));
  const kindName = def.kind === "tarot" ? "TAROT" : def.kind === "planet" ? "PLANETA" : "ESPECTRAL";
  const canUse = store.state.phase !== "lost" && store.state.phase !== "won" && !(def.target > 0 && store.state.phase !== "round");
  return wrapModal(`
    <div class="modal-head"><h2>${escapeHtml(def.name)}</h2><div class="sub">${kindName}${def.kind === "planet" ? ` · ${HAND_INFO[def.hand].name} Nv.${store.state.handLevels[def.hand] || 1}` : ""}</div></div>
    <div class="detail-row">
      <div class="detail-art">${consumableCardHtml(inst, { preview: true })}</div>
      <div class="detail-body">
        <div class="detail-text">${escapeHtml(def.text)}</div>
        <div class="detail-meta">
          <span>Valor de venta: <b>${money(value)}</b></span>
          <span>Coste: <b>${money(def.cost || 3)}</b></span>
          ${def.target ? `<span>Objetivo: <b>${def.variable ? `hasta ${def.target}` : def.target} carta(s)</b></span>` : ""}
        </div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-purple" data-action="use-consumable" data-uid="${inst.uid}" ${canUse ? "" : "disabled"}>USAR</button>
      <button class="btn btn-danger" data-action="sell-consumable" data-uid="${inst.uid}">VENDER ${money(value)}</button>
      <button class="btn btn-ghost" data-action="close-modal">CERRAR</button>
    </div>
  `);
}

function shopItemHtml(item, kind, index) {
  if (!item) return "";
  let preview = "";
  let name = "";
  let desc = "";
  if (kind === "joker") {
    const def = JOKER_BY_ID[item.id];
    if (!def) return "";
    preview = `<div class="slot-preview">${jokerCardHtml({ uid: `shop-${index}`, id: item.id, edition: item.edition, data: {} }, { preview: true })}</div>`;
    name = def.name;
    desc = def.text;
  } else if (kind === "consumable") {
    const def = CONSUMABLE_BY_ID[item.id];
    if (!def) return "";
    preview = `<div class="slot-preview">${consumableCardHtml({ uid: `shop-c-${index}`, id: item.id }, { preview: true })}</div>`;
    name = def.name;
    desc = def.text;
  } else if (kind === "pack") {
    const info = PACK_INFO[item.type];
    preview = `<div class="pack-art ${info.color}">${info.art}</div>`;
    name = info.name;
    desc = info.desc;
  } else if (kind === "voucher") {
    const def = VOUCHER_BY_ID[item.id];
    if (!def) return "";
    preview = `<div class="voucher-art">${def.art}</div>`;
    name = def.name;
    desc = def.text;
  }
  return `
    <div class="shop-slot ${kind === "pack" ? "pack" : ""} ${kind === "voucher" ? "voucher-slot" : ""} ${item.sold ? "sold" : ""}"
         data-action="shop-buy" data-kind="${kind}" data-index="${index}">
      ${preview}
      <div class="slot-name">${escapeHtml(name)}</div>
      <div class="slot-desc">${escapeHtml(desc)}</div>
      <div class="price">${money(item.cost)}</div>
    </div>`;
}

function shopHtml() {
  const s = store.state;
  const shop = s.shop;
  const free = shop.freeRerolls > 0;
  return `
    <div class="overlay"><div class="modal">
      <div class="shop-head">
        <div><h2>TIENDA</h2><div class="sub">ANTE ${s.ante} · DESPUÉS DE ${escapeHtml(s.blind?.name || "")}</div></div>
        <div class="shop-wallet">${money(s.money)}</div>
      </div>
      <div class="shop-section">
        <div class="shop-section-title"><span>COMODINES</span><span>${nonNegativeJokers()}/${jokerCapacity()} espacios</span></div>
        <div class="shop-grid">${shop.jokers.map((item, i) => shopItemHtml(item, "joker", i)).join("")}</div>
      </div>
      <div class="shop-section">
        <div class="shop-section-title"><span>CONSUMIBLES</span><span>${s.consumables.length}/${consumableCapacity()} espacios</span></div>
        <div class="shop-grid">${shop.consumables.map((item, i) => shopItemHtml(item, "consumable", i)).join("")}</div>
      </div>
      <div class="shop-section">
        <div class="shop-section-title"><span>SOBRES</span><span>ELIGE 1 CARTA</span></div>
        <div class="shop-grid">${shop.packs.map((item, i) => shopItemHtml(item, "pack", i)).join("")}</div>
      </div>
      ${shop.voucher ? `
      <div class="shop-section">
        <div class="shop-section-title"><span>VOUCHER</span><span>MEJORA PERMANENTE</span></div>
        <div class="shop-grid">${shopItemHtml(shop.voucher, "voucher", 0)}</div>
      </div>` : ""}
      <div class="shop-actions">
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-purple" data-action="shop-reroll">
            ${free ? "REROLL GRATIS" : `REROLL ${money(rerollPrice())}`}
          </button>
          <button class="btn btn-ghost" data-action="shop-sell-help">?</button>
        </div>
        <button class="btn btn-orange" data-action="shop-exit">SALIR DE LA TIENDA</button>
      </div>
      <div class="title-note" style="margin-top:12px">Haz clic en un objeto para comprarlo. Puedes vender comodines y consumibles desde sus fichas.</div>
    </div></div>`;
}

function packHtml() {
  const pack = store.state.pack;
  const info = PACK_INFO[pack.type];
  const items = pack.items.map((item, i) => {
    let preview = "";
    let name = "";
    let desc = "";
    if (item.kind === "joker") {
      const def = JOKER_BY_ID[item.id];
      preview = jokerCardHtml({ uid: `pack-${i}`, id: item.id, edition: item.edition, data: {} }, { preview: true });
      name = def.name;
      desc = def.text;
    } else {
      const def = CONSUMABLE_BY_ID[item.id];
      preview = consumableCardHtml({ uid: `pack-c-${i}`, id: item.id }, { preview: true });
      name = def.name;
      desc = def.text;
    }
    return `
      <div class="pack-pick" data-action="pack-pick" data-index="${i}">
        ${preview}
        <div class="slot-name">${escapeHtml(name)}</div>
        <div class="slot-desc">${escapeHtml(desc)}</div>
      </div>`;
  }).join("");
  return `
    <div class="overlay"><div class="modal pack-modal">
      <div class="modal-head">
        <h2>${escapeHtml(info.name)}</h2>
        <div class="sub">${pack.free ? "GRATIS POR ETIQUETA" : "SOBRE COMPRADO"} · ELIGE 1 DE ${pack.items.length}</div>
      </div>
      <div class="pack-cards">${items}</div>
      <div class="modal-actions">
        <button class="btn btn-ghost" data-action="pack-skip">SALTAR SOBRE</button>
      </div>
    </div></div>`;
}

function cashoutHtml() {
  const s = store.state;
  const c = s.cashout;
  return `
    <div class="overlay"><div class="modal">
      <div class="modal-head">
        <h2>¡RONDA SUPERADA!</h2>
        <div class="sub">${escapeHtml(s.blind.name)} · ANTES ${s.ante} · PUNTUACIÓN ${s.roundScore.toLocaleString("es-ES")}</div>
      </div>
      <div class="cashout-grid">
        ${c.rows.map((r) => `<div class="cashout-row"><span>${escapeHtml(r.label)}</span><b>${r.value >= 0 ? "+" : ""}${money(r.value)}</b></div>`).join("")}
      </div>
      <div class="cashout-total"><span>TOTAL</span><span>${money(c.total)}</span></div>
      <div class="modal-actions">
        <button class="btn btn-gold" data-action="claim-cashout">COBRAR ${money(c.total)}</button>
      </div>
    </div></div>`;
}

function lostHtml() {
  const s = store.state;
  return `
    <div class="overlay"><div class="modal">
      <div class="modal-head">
        <h2 style="color:#ff7d7d">DERROTA</h2>
        <div class="sub">LA CIEGA TE HA SUPERADO</div>
      </div>
      <div class="cashout-grid">
        <div class="cashout-row"><span>Ante alcanzado</span><b>${s.ante}</b></div>
        <div class="cashout-row"><span>Mejor puntuación</span><b>${(s.stats.bestScore || 0).toLocaleString("es-ES")}</b></div>
        <div class="cashout-row"><span>Mejor mano</span><b>${s.stats.bestHand ? HAND_INFO[s.stats.bestHand].name : "—"}</b></div>
        <div class="cashout-row"><span>Cartas en el mazo</span><b>${s.deck.length}</b></div>
        <div class="cashout-row"><span>Semilla</span><b>${s.seed}</b></div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost" data-action="show-title">MENÚ</button>
        <button class="btn btn-red" data-action="start-run">NUEVA PARTIDA</button>
      </div>
    </div></div>`;
}

function wonHtml() {
  const s = store.state;
  return `
    <div class="overlay"><div class="modal">
      <div class="modal-head">
        <h2 style="color:var(--gold)">¡VICTORIA!</h2>
        <div class="sub">HAS DERROTADO LA CIEGA JEFE DEL ANTE 8</div>
      </div>
      <div class="cashout-grid">
        <div class="cashout-row"><span>Comodines equipados</span><b>${s.jokers.length}</b></div>
        <div class="cashout-row"><span>Cartas en el mazo</span><b>${s.deck.length}</b></div>
        <div class="cashout-row"><span>Manos jugadas</span><b>${s.stats.handsPlayed}</b></div>
        <div class="cashout-row"><span>Mejor puntuación</span><b>${(s.stats.bestScore || 0).toLocaleString("es-ES")}</b></div>
        <div class="cashout-row"><span>Semilla</span><b>${s.seed}</b></div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost" data-action="show-title">MENÚ</button>
        <button class="btn btn-gold" data-action="start-run">NUEVA PARTIDA</button>
      </div>
    </div></div>`;
}

export function renderOverlay() {
  const root = store.refs.overlay;
  if (!root) return;
  if (store.modalHtml) { root.innerHTML = store.modalHtml; return; }
  if (!store.started) { root.innerHTML = titleHtml(); return; }
  const s = store.state;
  if (s?.pack) { root.innerHTML = packHtml(); return; }
  if (!s) { root.innerHTML = titleHtml(); return; }
  if (s.phase === "shop" && s.shop) { root.innerHTML = shopHtml(); return; }
  if (s.phase === "cashout" && s.cashout) { root.innerHTML = cashoutHtml(); return; }
  if (s.phase === "lost") { root.innerHTML = lostHtml(); return; }
  if (s.phase === "won") { root.innerHTML = wonHtml(); return; }
  root.innerHTML = "";
}
