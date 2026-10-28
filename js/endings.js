import { store, SAVE_KEY } from "./store.js";
import { save } from "./helpers.js";
import { sfx } from "./fx.js";
import { render } from "./ui.js";

export function winRun() {
  const s = store.state;
  if (!s) return;
  s.phase = "won";
  store.busy = false;
  store.modalHtml = null;
  store.pendingUse = null;
  store.selected.clear();
  save();
  sfx("win");
  render();
}

export function loseRun() {
  const s = store.state;
  if (!s) return;
  s.phase = "lost";
  store.busy = false;
  store.modalHtml = null;
  store.pendingUse = null;
  store.selected.clear();
  localStorage.removeItem(SAVE_KEY);
  sfx("lose");
  render();
}
