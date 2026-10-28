export const SAVE_KEY = "balatro-homenaje-save-v1";
export const SOUND_KEY = "balatro-homenaje-sound";
export const MAX_SELECT = 5;

export const store = {
  state: null,
  started: false,
  busy: false,
  modalHtml: null,
  pendingUse: null,
  selected: new Set(),
  displayScore: { chips: 0, mult: 0 },
  soundOn: localStorage.getItem(SOUND_KEY) !== "off",
  audioCtx: null,
  refs: {},
};
