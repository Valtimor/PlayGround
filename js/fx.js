import { store } from "./store.js";

export function initFx(refs) {
  store.refs = refs;
}

export function ensureAudio() {
  if (!store.soundOn) return null;
  if (!store.audioCtx) {
    try { store.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (store.audioCtx.state === "suspended") store.audioCtx.resume();
  return store.audioCtx;
}

export function sfx(kind = "click") {
  const ctx = ensureAudio();
  if (!ctx) return;
  const map = {
    click: [520, 0.05, "square", 0.025],
    select: [700, 0.06, "square", 0.028],
    score: [420, 0.12, "sawtooth", 0.03],
    buy: [820, 0.09, "square", 0.028],
    error: [160, 0.16, "sawtooth", 0.04],
    win: [660, 0.18, "triangle", 0.045],
  };
  const [freq, dur, type, vol] = map[kind] || map.click;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur + 0.02);
}

export function toast(text, kind = "") {
  const root = store.refs.toast;
  if (!root) return;
  const el = document.createElement("div");
  el.className = `toast ${kind}`.trim();
  el.textContent = text;
  root.appendChild(el);
  while (root.children.length > 4) root.firstChild.remove();
  setTimeout(() => el.remove(), 2900);
}

export function floatPop(target, text, cls = "chips") {
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = `float-pop ${cls}`;
  el.textContent = text;
  el.style.left = `${rect.left + rect.width / 2}px`;
  el.style.top = `${rect.top}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
