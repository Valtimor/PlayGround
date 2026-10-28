import { store } from "./store.js";
import {
  JOKER_BY_ID, CONSUMABLE_BY_ID, VOUCHERS, PACK_INFO, PLANETS,
} from "./content.js";
import { randomFrom, shopJokerSlots, priceOf, rerollPrice, mostPlayedType, save } from "./helpers.js";
import {
  addJoker, addConsumable, pickJokerDef, pickConsumableDef, runJokerHooks,
} from "./items.js";
import { advanceBlind } from "./setup.js";
import { winRun } from "./endings.js";
import { toast, sfx } from "./fx.js";
import { render } from "./ui.js";

function makeShopJoker(exclude) {
  let def = pickJokerDef({ allowOwned: false });
  for (let tries = 0; tries < 8 && exclude.has(def.id); tries++) def = pickJokerDef({ allowOwned: false });
  exclude.add(def.id);
  const roll = Math.random();
  const edition = roll < 1 / 15 ? randomFrom(["foil", "holo", "poly"]) : null;
  let cost = priceOf(def.cost);
  if (edition === "foil") cost += 2;
  if (edition === "holo") cost += 3;
  if (edition === "poly") cost += 4;
  return { id: def.id, edition, cost, sold: false };
}

function makeShopConsumable() {
  const def = pickConsumableDef(Math.random() < 0.6 ? "tarot" : "planet");
  return { id: def.id, cost: priceOf(def.cost || 3), sold: false };
}

function fillShopItems(shop) {
  const exclude = new Set();
  shop.jokers = Array.from({ length: shopJokerSlots() }, () => makeShopJoker(exclude));
  shop.consumables = Array.from({ length: 2 }, makeShopConsumable);
  const packTypes = ["arcana", "celestial", "buffoon", "spectral"];
  shop.packs = Array.from({ length: 2 }, () => {
    const type = randomFrom(packTypes);
    return { type, cost: priceOf(PACK_INFO[type].cost), sold: false };
  });
}

function makeShopVoucher() {
  const s = store.state;
  const pool = VOUCHERS.filter((v) => !s.vouchers.includes(v.id));
  if (!pool.length) return null;
  const v = randomFrom(pool);
  return { id: v.id, cost: priceOf(v.cost), sold: false };
}

export function generateShop() {
  const s = store.state;
  s.shop = { jokers: [], consumables: [], packs: [], voucher: makeShopVoucher(), rerolls: 0, freeRerolls: 0 };
  fillShopItems(s.shop);
  s.phase = "shop";
  store.modalHtml = null;
  runJokerHooks("onShopEnter");
  save();
  render();
}

function spend(amount) {
  const s = store.state;
  if (s.money < amount) {
    toast(`Necesitas ${amount} $ y solo tienes ${s.money} $.`, "warn");
    return false;
  }
  s.money -= amount;
  return true;
}

export function buyShop(kind, index) {
  const s = store.state;
  if (!s || s.phase !== "shop" || !s.shop || store.busy) return;
  const shop = s.shop;
  if (kind === "joker") {
    const item = shop.jokers[index];
    if (!item || item.sold) return;
    if (s.money < item.cost) return toast("No tienes suficiente dinero.", "warn");
    const inst = addJoker(item.id, item.edition, { silent: true });
    if (!inst) return;
    s.money -= item.cost;
    item.sold = true;
    sfx("buy");
    toast(`${JOKER_BY_ID[item.id]?.name || "Comodín"} comprado por ${item.cost} $.`, "good");
  } else if (kind === "consumable") {
    const item = shop.consumables[index];
    if (!item || item.sold) return;
    if (s.money < item.cost) return toast("No tienes suficiente dinero.", "warn");
    const inst = addConsumable(item.id, { silent: true });
    if (!inst) return;
    s.money -= item.cost;
    item.sold = true;
    sfx("buy");
    toast(`${CONSUMABLE_BY_ID[item.id]?.name || "Consumible"} comprado por ${item.cost} $.`, "good");
  } else if (kind === "pack") {
    const item = shop.packs[index];
    if (!item || item.sold) return;
    if (!spend(item.cost)) return;
    item.sold = true;
    sfx("buy");
    openPack(item.type);
    return;
  } else if (kind === "voucher") {
    const item = shop.voucher;
    if (!item || item.sold) return;
    if (!spend(item.cost)) return;
    item.sold = true;
    s.vouchers.push(item.id);
    sfx("buy");
    toast("Voucher obtenido: mejora permanente de la partida.", "good");
  }
  save();
  render();
}

export function rerollShop() {
  const s = store.state;
  if (!s || s.phase !== "shop" || !s.shop || store.busy) return;
  const shop = s.shop;
  if (shop.freeRerolls > 0) {
    shop.freeRerolls -= 1;
  } else {
    const price = rerollPrice();
    if (!spend(price)) return;
    shop.rerolls = (shop.rerolls || 0) + 1;
  }
  const voucher = shop.voucher;
  fillShopItems(shop);
  shop.voucher = voucher;
  runJokerHooks("onReroll");
  sfx("select");
  save();
  render();
}

export function leaveShop() {
  const s = store.state;
  if (!s || s.phase !== "shop") return;
  s.shop = null;
  store.modalHtml = null;
  if (s.blindIndex === 2) {
    if (s.investmentTag) {
      s.money += 25;
      s.investmentTag = false;
      toast("Etiqueta de Inversión: +25 $.", "good");
    }
    s.ante += 1;
    if (s.ante > 8) { winRun(); return; }
    advanceBlind(0);
  } else {
    advanceBlind(s.blindIndex + 1);
  }
  save();
  render();
}

export function openPack(type, { free = false } = {}) {
  const s = store.state;
  if (!s || !PACK_INFO[type]) return;
  const info = PACK_INFO[type];
  const items = [];
  if (info.kind === "joker") {
    const exclude = new Set();
    for (let i = 0; i < info.count; i++) {
      const def = pickJokerDef({ allowOwned: false });
      const edition = Math.random() < 1 / 15 ? randomFrom(["foil", "holo", "poly"]) : null;
      items.push({ kind: "joker", id: def.id, edition });
    }
  } else {
    for (let i = 0; i < info.count; i++) {
      if (type === "celestial" && i === 0 && s.vouchers.includes("telescope")) {
        const type2 = mostPlayedType();
        const planet = PLANETS.find((p) => p.hand === type2);
        if (planet) { items.push({ kind: "planet", id: planet.id }); continue; }
      }
      const def = pickConsumableDef(info.kind);
      items.push({ kind: def.kind, id: def.id });
    }
  }
  s.pack = { type, items, free };
  store.modalHtml = null;
  sfx("select");
  save();
  render();
}

export function closePack() {
  if (!store.state?.pack) return;
  store.state.pack = null;
  save();
  render();
}

export function pickPackItem(index) {
  const s = store.state;
  if (!s?.pack || store.busy) return;
  const item = s.pack.items[index];
  if (!item) return;
  if (item.kind === "joker") {
    const inst = addJoker(item.id, item.edition, { silent: true });
    if (!inst) return;
    toast(`${JOKER_BY_ID[item.id]?.name || "Comodín"} añadido desde el sobre.`, "good");
  } else {
    const inst = addConsumable(item.id, { silent: true });
    if (!inst) return;
    toast(`${CONSUMABLE_BY_ID[item.id]?.name || "Consumible"} añadido desde el sobre.`, "good");
  }
  s.pack = null;
  sfx("buy");
  save();
  render();
}

export function claimCashout() {
  const s = store.state;
  if (!s || s.phase !== "cashout" || !s.cashout) return;
  const total = s.cashout.total;
  s.money += total;
  s.cashout = null;
  if (s.blindIndex === 2 && s.investmentTag) {
    s.money += 25;
    s.investmentTag = false;
    toast("Etiqueta de Inversión: +25 $.", "good");
  }
  sfx("cash");
  if (s.ante >= 8 && s.blindIndex === 2) {
    winRun();
    return;
  }
  generateShop();
}
