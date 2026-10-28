import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const context = vm.createContext({ console });
for (const file of ['js/data.js', 'js/engine.js', 'js/ai.js']) {
  vm.runInContext(readFileSync(join(root, file), 'utf8'), context, { filename: file });
}
const { DT, Engine, AI } = context;

function makeBattle(options = {}) {
  const player = options.player || 'kurogane';
  const enemy = options.enemy || 'aiko';
  const battle = Engine.createBattle({
    playerCharacter: player,
    enemyCharacter: enemy,
    playerDeck: options.playerDeck || DT.character(player).deck,
    enemyDeck: options.enemyDeck || DT.character(enemy).deck,
    actions: options.actions || 3,
    seed: 7
  });
  if (options.playerState) Object.assign(battle.player, options.playerState);
  if (options.enemyState) Object.assign(battle.enemy, options.enemyState);
  return battle;
}

test('all decks and reward pools reference valid cards', () => {
  for (const character of DT.CHARACTERS) {
    assert.equal(character.deck.length, 10);
    assert.equal(new Set(character.deck).size, 10);
    for (const id of character.deck.concat(character.exclusives)) {
      assert.ok(DT.getCard(id), `missing card ${id}`);
      assert.equal(DT.getCard(id).id, id);
    }
  }
  for (const id of DT.CARD_LIST.map((card) => card.id)) {
    assert.ok(DT.getCard(id), `missing registry entry ${id}`);
  }
});

test('rng is deterministic and shuffle preserves members', () => {
  const source = ['a', 'b', 'c', 'd', 'e'];
  const first = Engine.createRng('seed').shuffle(source);
  const second = Engine.createRng('seed').shuffle(source);
  assert.deepEqual(first, second);
  assert.deepEqual([...first].sort(), [...source].sort());
});

test('battle starts with both fighters on their home rows', () => {
  const battle = makeBattle();
  assert.equal(battle.round, 1);
  assert.equal(battle.phase, 'planning');
  assert.deepEqual([battle.player.x, battle.player.y], [0, 1]);
  assert.deepEqual([battle.enemy.x, battle.enemy.y], [4, 1]);
  assert.equal(battle.player.facing, 1);
  assert.equal(battle.enemy.facing, -1);
});

test('both fighters cannot occupy the same destination tile', () => {
  const battle = makeBattle({
    playerState: { x: 1, y: 1 },
    enemyState: { x: 3, y: 1 }
  });
  battle.player.plan = ['move-fwd'];
  battle.enemy.plan = ['move-fwd'];
  const events = Engine.resolveSlot(battle, 0);
  assert.deepEqual([battle.player.x, battle.player.y], [1, 1]);
  assert.deepEqual([battle.enemy.x, battle.enemy.y], [3, 1]);
  assert.ok(events.some((event) => event.type === 'bump'));
});

test('a move into a stationary opponent is blocked', () => {
  const battle = makeBattle({
    playerState: { x: 2, y: 1 },
    enemyState: { x: 3, y: 1 }
  });
  battle.player.plan = ['move-fwd'];
  battle.enemy.plan = ['guard'];
  const events = Engine.resolveSlot(battle, 0);
  assert.deepEqual([battle.player.x, battle.player.y], [2, 1]);
  assert.deepEqual([battle.enemy.x, battle.enemy.y], [3, 1]);
  assert.ok(events.some((event) => event.type === 'bump'));
});

test('a genuine swap is allowed', () => {
  const battle = makeBattle({
    playerState: { x: 2, y: 1 },
    enemyState: { x: 3, y: 1 }
  });
  battle.player.plan = ['move-fwd'];
  battle.enemy.plan = ['move-fwd'];
  Engine.resolveSlot(battle, 0);
  assert.deepEqual([battle.player.x, battle.player.y], [3, 1]);
  assert.deepEqual([battle.enemy.x, battle.enemy.y], [2, 1]);
});

test('a vacated tile can be entered', () => {
  const battle = makeBattle({
    playerState: { x: 1, y: 1 },
    enemyState: { x: 2, y: 1 }
  });
  battle.player.plan = ['move-fwd'];
  battle.enemy.plan = ['move-up'];
  Engine.resolveSlot(battle, 0);
  assert.deepEqual([battle.player.x, battle.player.y], [2, 1]);
  assert.deepEqual([battle.enemy.x, battle.enemy.y], [2, 0]);
});

test('guard absorbs damage once in its slot', () => {
  const battle = makeBattle({
    playerState: { x: 2, y: 1, hp: 100 },
    enemyState: { x: 3, y: 1 }
  });
  battle.player.plan = ['guard'];
  battle.enemy.plan = ['kuro-claw'];
  const events = Engine.resolveSlot(battle, 0);
  const attack = events.find((event) => event.type === 'attack' && event.target === 'player');
  assert.equal(attack.absorbed, 15);
  assert.equal(attack.damage, 5);
  assert.equal(battle.player.hp, 95);
  assert.equal(battle.player.shield, 0);
});

test('perfect guard blocks all damage from the same slot', () => {
  const battle = makeBattle({
    playerState: { x: 2, y: 1, hp: 95 },
    enemyState: { x: 3, y: 1 }
  });
  battle.player.plan = ['aiko-barrier'];
  battle.enemy.plan = ['kuro-fury'];
  const events = Engine.resolveSlot(battle, 0);
  const attack = events.find((event) => event.type === 'attack' && event.target === 'player');
  assert.equal(attack.damage, 0);
  assert.equal(attack.absorbed, 60);
  assert.equal(battle.player.hp, 95);
});

test('guard does not carry into the next slot', () => {
  const battle = makeBattle({
    playerState: { x: 2, y: 1, hp: 100 },
    enemyState: { x: 3, y: 1 }
  });
  battle.player.plan = ['guard', null];
  battle.enemy.plan = [null, 'kuro-claw'];
  Engine.resolveSlot(battle, 0);
  const events = Engine.resolveSlot(battle, 1);
  const attack = events.find((event) => event.type === 'attack' && event.target === 'player');
  assert.equal(attack.damage, 20);
  assert.equal(battle.player.hp, 80);
});

test('insufficient energy fizzles the action without paying or damaging', () => {
  const battle = makeBattle({
    playerState: { x: 2, y: 1, energy: 0 },
    enemyState: { x: 3, y: 1, hp: 105 }
  });
  battle.player.plan = ['kuro-claw'];
  battle.enemy.plan = [null];
  const events = Engine.resolveSlot(battle, 0);
  assert.ok(events.some((event) => event.type === 'fizzle' && event.side === 'player'));
  assert.equal(battle.player.energy, 0);
  assert.equal(battle.enemy.hp, 105);
});

test('simultaneous lethal attacks produce a draw', () => {
  const battle = makeBattle({
    playerState: { x: 2, y: 1, hp: 10 },
    enemyState: { x: 3, y: 1, hp: 10 },
    enemyDeck: ['ryu-rush']
  });
  battle.player.plan = ['kuro-claw'];
  battle.enemy.plan = ['ryu-rush'];
  Engine.resolveSlot(battle, 0);
  assert.equal(battle.player.hp, 0);
  assert.equal(battle.enemy.hp, 0);
  assert.equal(battle.result, 'draw');
});

test('endRound regenerates energy, clears plans and increments the round', () => {
  const battle = makeBattle({
    playerState: { energy: 50 },
    enemyState: { energy: 90 }
  });
  battle.player.plan = ['guard'];
  battle.enemy.plan = ['focus'];
  const events = Engine.endRound(battle);
  assert.equal(battle.player.energy, 65);
  assert.equal(battle.enemy.energy, 100);
  assert.equal(battle.player.plan.length, 0);
  assert.equal(battle.enemy.plan.length, 0);
  assert.equal(battle.round, 2);
  assert.equal(events.length, 2);
});

test('campaign creates five distinct opponents and camp battles', () => {
  const campaign = Engine.createCampaign({
    characterId: 'kurogane',
    difficulty: 'normal',
    seed: 12345
  });
  assert.equal(campaign.opponentOrder.length, 5);
  assert.equal(new Set(campaign.opponentOrder).size, 5);
  assert.ok(!campaign.opponentOrder.includes('kurogane'));
  const setup = Engine.createCampaignBattle(campaign);
  assert.equal(setup.battle.actions, 3);
  assert.equal(setup.battle.player.characterId, 'kurogane');
  assert.ok(setup.battle.enemy.deck.length >= 10);
});

test('reward choices are unique, unowned and never legendary', () => {
  const rng = Engine.createRng(99);
  const choices = Engine.rewardChoices('aiko', DT.character('aiko').deck, rng, 5);
  assert.equal(choices.length, 5);
  assert.equal(new Set(choices).size, 5);
  for (const id of choices) {
    assert.ok(!DT.character('aiko').deck.includes(id));
    assert.notEqual(DT.getCard(id).rarity, 'legend');
  }
});

test('AI plans are legal for every difficulty', () => {
  for (const difficulty of Object.keys(DT.DIFFICULTIES)) {
    const battle = makeBattle();
    battle.difficulty = difficulty;
    const plan = AI.plan(battle, 'enemy', { difficulty, seed: 42 });
    assert.equal(plan.length, battle.actions);
    assert.equal(new Set(plan).size, plan.length);
    for (const id of plan) assert.ok(battle.enemy.deck.includes(id));
  }
});

test('easy AI still fills its plan when it wants to recover energy', () => {
  for (let seed = 1; seed <= 40; seed += 1) {
    const battle = makeBattle();
    battle.difficulty = 'easy';
    battle.enemy.energy = 0;
    const plan = AI.plan(battle, 'enemy', { difficulty: 'easy', seed });
    assert.equal(plan.length, battle.actions);
    assert.equal(new Set(plan).size, plan.length);
    for (const id of plan) assert.ok(battle.enemy.deck.includes(id));
  }
});

test('four action battles resolve and produce a legal AI plan', () => {
  const battle = makeBattle({ actions: 4 });
  battle.player.plan = ['move-fwd', 'guard', 'focus', 'kuro-claw'];
  battle.enemy.plan = AI.plan(battle, 'enemy', { difficulty: 'normal', seed: 12 });
  assert.equal(battle.enemy.plan.length, 4);
  for (let slot = 0; slot < 4; slot += 1) {
    assert.doesNotThrow(() => Engine.resolveSlot(battle, slot));
  }
  assert.ok(['win', 'lose', 'draw', null].includes(battle.result));
});

test('simulation leaves the real battle untouched', () => {
  const battle = makeBattle();
  const snapshot = JSON.stringify(battle);
  Engine.simulate(battle, ['move-fwd', 'guard', 'kuro-claw'], ['guard', 'move-fwd', 'aiko-rain']);
  assert.equal(JSON.stringify(battle), snapshot);
});
