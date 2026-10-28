(function (root) {
  const DT = root.DT;
  const BOARD_W = 5;
  const BOARD_H = 3;
  const EN_REGEN = 15;

  function hashSeed(input) {
    let hash = 2166136261;
    const text = String(input);
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createRng(seed) {
    let value = (typeof seed === 'number' ? seed : hashSeed(seed)) >>> 0;
    return {
      next() {
        value += 0x6D2B79F5;
        let t = value;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      },
      int(max) {
        return Math.floor(this.next() * max);
      },
      pick(list) {
        return list[this.int(list.length)];
      },
      shuffle(list) {
        const copy = list.slice();
        for (let i = copy.length - 1; i > 0; i -= 1) {
          const j = this.int(i + 1);
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      }
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function inBoard(x, y) {
    return x >= 0 && x < BOARD_W && y >= 0 && y < BOARD_H;
  }

  function createFighter(characterId, deck, side, x, y, facing) {
    const data = DT.character(characterId);
    return {
      side,
      characterId,
      name: data.name,
      title: data.title,
      hp: data.hp,
      maxHp: data.hp,
      energy: data.energy,
      maxEnergy: 100,
      x,
      y,
      facing,
      deck: deck.slice(),
      plan: [],
      shield: 0,
      blockAll: false
    };
  }

  function createBattle(config) {
    if (!config || !config.playerCharacter || !config.enemyCharacter) {
      throw new Error('createBattle requires playerCharacter and enemyCharacter');
    }
    const playerData = DT.character(config.playerCharacter);
    const playerDeck = config.playerDeck || playerData.deck;
    const enemyDeck = config.enemyDeck || DT.character(config.enemyCharacter).deck;
    const actions = config.actions || 3;
    const seed = config.seed || 1;
    return {
      board: { w: BOARD_W, h: BOARD_H },
      player: createFighter(config.playerCharacter, playerDeck, 'player', 0, 1, 1),
      enemy: createFighter(config.enemyCharacter, enemyDeck, 'enemy', 4, 1, -1),
      round: 1,
      actions,
      phase: 'planning',
      result: null,
      log: [],
      seed,
      difficulty: config.difficulty || 'normal',
      label: config.label || ''
    };
  }

  function cardOf(fighter, slot) {
    const id = fighter.plan[slot];
    return id ? DT.getCard(id) : null;
  }

  function canUse(fighter, card) {
    return card && (card.cost || 0) <= fighter.energy;
  }

  function payCost(fighter, card) {
    fighter.energy = Math.max(0, fighter.energy - (card.cost || 0));
  }

  function restoreEnergy(fighter, amount) {
    const before = fighter.energy;
    fighter.energy = clamp(fighter.energy + amount, 0, fighter.maxEnergy);
    return fighter.energy - before;
  }

  function healFighter(fighter, amount) {
    const before = fighter.hp;
    fighter.hp = clamp(fighter.hp + amount, 0, fighter.maxHp);
    return fighter.hp - before;
  }

  function moveTarget(fighter, card) {
    if (!card || !card.move) return null;
    const x = fighter.x + card.move.x * fighter.facing;
    const y = fighter.y + card.move.y;
    return { x: clamp(x, 0, BOARD_W - 1), y: clamp(y, 0, BOARD_H - 1) };
  }

  function attackCellsFor(fighter, card) {
    return DT.attackCells(card, fighter.x, fighter.y, fighter.facing);
  }

  function cellKey(x, y) {
    return x + ':' + y;
  }

  function resultOf(state) {
    const playerDead = state.player.hp <= 0;
    const enemyDead = state.enemy.hp <= 0;
    if (playerDead && enemyDead) return 'draw';
    if (enemyDead) return 'win';
    if (playerDead) return 'lose';
    return null;
  }

  function finishIfNeeded(state) {
    const result = resultOf(state);
    if (result) {
      state.result = result;
      state.phase = 'ended';
      return true;
    }
    return false;
  }

  function resolveSlot(state, slot, options) {
    const silent = !!(options && options.silent);
    const events = [];
    const playerCard = cardOf(state.player, slot);
    const enemyCard = cardOf(state.enemy, slot);
    const shieldSnapshot = { player: state.player.shield, enemy: state.enemy.shield };

    if (!playerCard && !enemyCard) return events;

    const pReady = canUse(state.player, playerCard);
    const eReady = canUse(state.enemy, enemyCard);

    if (playerCard && !pReady) events.push({ type: 'fizzle', side: 'player', cardId: playerCard.id, reason: 'energy' });
    if (enemyCard && !eReady) events.push({ type: 'fizzle', side: 'enemy', cardId: enemyCard.id, reason: 'energy' });

    const pCard = pReady ? playerCard : null;
    const eCard = eReady ? enemyCard : null;

    if (pCard) payCost(state.player, pCard);
    if (eCard) payCost(state.enemy, eCard);

    const pMove = pCard && pCard.move ? moveTarget(state.player, pCard) : null;
    const eMove = eCard && eCard.move ? moveTarget(state.enemy, eCard) : null;

    if (pMove || eMove) {
      let pDest = pMove ? { x: pMove.x, y: pMove.y } : { x: state.player.x, y: state.player.y };
      let eDest = eMove ? { x: eMove.x, y: eMove.y } : { x: state.enemy.x, y: state.enemy.y };
      const pOrigin = { x: state.player.x, y: state.player.y };
      const eOrigin = { x: state.enemy.x, y: state.enemy.y };
      let bumped = false;

      if (pDest.x === eDest.x && pDest.y === eDest.y) {
        pDest = pOrigin;
        eDest = eOrigin;
        bumped = true;
      }

      const pMoved = pDest.x !== pOrigin.x || pDest.y !== pOrigin.y;
      const eMoved = eDest.x !== eOrigin.x || eDest.y !== eOrigin.y;

      state.player.x = pDest.x;
      state.player.y = pDest.y;
      state.enemy.x = eDest.x;
      state.enemy.y = eDest.y;

      if (pMoved) events.push({ type: 'move', side: 'player', from: pOrigin, to: pDest });
      if (eMoved) events.push({ type: 'move', side: 'enemy', from: eOrigin, to: eDest });
      if (bumped) events.push({ type: 'bump', round: state.round, slot });
    }

    if (pCard && pCard.guard) {
      if (pCard.guard === 'all') state.player.blockAll = true;
      else state.player.shield += pCard.guard;
      events.push({ type: 'guard', side: 'player', amount: pCard.guard });
    }
    if (eCard && eCard.guard) {
      if (eCard.guard === 'all') state.enemy.blockAll = true;
      else state.enemy.shield += eCard.guard;
      events.push({ type: 'guard', side: 'enemy', amount: eCard.guard });
    }

    if (pCard && pCard.gain) {
      const gained = restoreEnergy(state.player, pCard.gain);
      events.push({ type: 'energy', side: 'player', amount: gained });
    }
    if (eCard && eCard.gain) {
      const gained = restoreEnergy(state.enemy, eCard.gain);
      events.push({ type: 'energy', side: 'enemy', amount: gained });
    }

    if (pCard && pCard.heal) {
      const healed = healFighter(state.player, pCard.heal);
      events.push({ type: 'heal', side: 'player', amount: healed });
    }
    if (eCard && eCard.heal) {
      const healed = healFighter(state.enemy, eCard.heal);
      events.push({ type: 'heal', side: 'enemy', amount: healed });
    }

    const attacks = [];
    if (pCard && pCard.damage) {
      const cells = attackCellsFor(state.player, pCard);
      const hit = cells.some((cell) => cell.x === state.enemy.x && cell.y === state.enemy.y);
      attacks.push({ side: 'player', target: 'enemy', card: pCard, hit });
    }
    if (eCard && eCard.damage) {
      const cells = attackCellsFor(state.enemy, eCard);
      const hit = cells.some((cell) => cell.x === state.player.x && cell.y === state.player.y);
      attacks.push({ side: 'enemy', target: 'player', card: eCard, hit });
    }

    const hits = attacks.map((attack) => {
      const defender = attack.target === 'player' ? state.player : state.enemy;
      let damage = attack.hit ? attack.card.damage : 0;
      let absorbed = 0;
      if (damage > 0) {
        if (defender.blockAll) {
          absorbed = damage;
          damage = 0;
        } else if (defender.shield > 0) {
          absorbed = Math.min(defender.shield, damage);
          defender.shield -= absorbed;
          damage -= absorbed;
        }
      }
      return Object.assign({}, attack, { damage, absorbed });
    });

    for (const hit of hits) {
      const defender = hit.target === 'player' ? state.player : state.enemy;
      const attacker = hit.side === 'player' ? state.player : state.enemy;
      const hpBefore = defender.hp;
      defender.hp = clamp(defender.hp - hit.damage, 0, defender.maxHp);
      let drained = 0;
      if (hit.damage > 0 && hit.card.drain) {
        drained = healFighter(attacker, hit.card.drain);
      }
      const event = {
        type: 'attack',
        side: hit.side,
        target: hit.target,
        cardId: hit.card.id,
        hit: hit.hit,
        damage: hit.damage,
        absorbed: hit.absorbed,
        hpBefore,
        hpAfter: defender.hp,
        drained
      };
      event.cells = attackCellsFor(hit.side === 'player' ? state.player : state.enemy, hit.card);
      events.push(event);
    }

    state.player.shield = 0;
    state.player.blockAll = false;
    state.enemy.shield = 0;
    state.enemy.blockAll = false;

    const ended = finishIfNeeded(state);
    if (ended) {
      events.push({ type: 'end', result: state.result, round: state.round, slot });
    }

    if (!silent) {
      state.lastShields = shieldSnapshot;
    }
    return events;
  }

  function endRound(state) {
    const events = [];
    if (state.result) return events;
    const playerGain = restoreEnergy(state.player, EN_REGEN);
    const enemyGain = restoreEnergy(state.enemy, EN_REGEN);
    events.push({ type: 'regen', side: 'player', amount: playerGain });
    events.push({ type: 'regen', side: 'enemy', amount: enemyGain });
    state.player.plan = [];
    state.enemy.plan = [];
    state.player.shield = 0;
    state.player.blockAll = false;
    state.enemy.shield = 0;
    state.enemy.blockAll = false;
    state.round += 1;
    state.phase = 'planning';
    return events;
  }

  function cloneFighter(fighter) {
    return {
      side: fighter.side,
      characterId: fighter.characterId,
      name: fighter.name,
      hp: fighter.hp,
      maxHp: fighter.maxHp,
      energy: fighter.energy,
      maxEnergy: fighter.maxEnergy,
      x: fighter.x,
      y: fighter.y,
      facing: fighter.facing,
      deck: fighter.deck,
      plan: fighter.plan.slice(),
      shield: 0,
      blockAll: false
    };
  }

  function simulate(state, playerPlan, enemyPlan) {
    const copy = {
      board: state.board,
      player: cloneFighter(state.player),
      enemy: cloneFighter(state.enemy),
      round: state.round,
      actions: state.actions,
      phase: 'resolving',
      result: null,
      seed: state.seed
    };
    copy.player.plan = playerPlan.slice();
    copy.enemy.plan = enemyPlan.slice();
    for (let slot = 0; slot < state.actions; slot += 1) {
      if (copy.result) break;
      resolveSlot(copy, slot, { silent: true });
    }
    return copy;
  }

  function previewPlan(state, plan) {
    const preview = [];
    let x = state.player.x;
    let y = state.player.y;
    for (let i = 0; i < plan.length; i += 1) {
      const card = DT.getCard(plan[i]);
      if (!card) {
        preview.push(null);
        continue;
      }
      const entry = { card, from: { x, y }, moveTo: null, cells: [] };
      if (card.move) {
        const nx = clamp(x + card.move.x, 0, BOARD_W - 1);
        const ny = clamp(y + card.move.y, 0, BOARD_H - 1);
        entry.moveTo = { x: nx, y: ny };
        x = nx;
        y = ny;
      }
      if (card.damage) entry.cells = DT.attackCells(card, x, y, 1);
      preview.push(entry);
    }
    return preview;
  }

  function planCost(plan) {
    return plan.reduce((sum, id) => {
      const card = DT.getCard(id);
      return sum + (card ? card.cost || 0 : 0);
    }, 0);
  }

  function makeOpponentOrder(playerCharacterId, rng, count) {
    const others = DT.CHARACTERS.map((item) => item.id).filter((id) => id !== playerCharacterId);
    const shuffled = rng ? rng.shuffle(others) : others;
    const order = [];
    for (let i = 0; i < (count || 5); i += 1) order.push(shuffled[i % shuffled.length]);
    return order;
  }

  function createCampaign(config) {
    const character = DT.character(config.characterId);
    const seed = config.seed || Math.floor(Math.random() * 1e9);
    const rng = createRng(seed);
    return {
      version: 1,
      characterId: character.id,
      difficulty: config.difficulty || 'normal',
      deck: character.deck.slice(),
      shards: 0,
      stage: 0,
      slots: 3,
      opponentOrder: makeOpponentOrder(character.id, rng, 5),
      completed: false,
      endless: false,
      streak: 0,
      seed,
      pending: null
    };
  }

  function opponentDeck(characterId, extras, rng) {
    const character = DT.character(characterId);
    const deck = character.deck.slice();
    const pool = DT.rewardPool(characterId).filter((id) => deck.indexOf(id) === -1);
    const shuffled = rng.shuffle(pool);
    for (let i = 0; i < extras && i < shuffled.length; i += 1) deck.push(shuffled[i]);
    return deck;
  }

  function campaignOpponent(campaign) {
    const stage = campaign.endless ? campaign.stage + campaign.streak : campaign.stage;
    const seed = (campaign.seed + stage * 7919 + campaign.streak * 131) >>> 0;
    const rng = createRng(seed);
    let characterId;
    if (campaign.endless) {
      const others = DT.CHARACTERS.map((item) => item.id).filter((id) => id !== campaign.characterId);
      characterId = rng.pick(others);
    } else {
      characterId = campaign.opponentOrder[campaign.stage] || campaign.opponentOrder[0];
    }
    const extras = campaign.endless
      ? Math.min(6, 4 + Math.floor(campaign.streak / 2))
      : campaign.stage;
    return {
      characterId,
      deck: opponentDeck(characterId, extras, rng),
      extras,
      seed
    };
  }

  function createCampaignBattle(campaign) {
    const opponent = campaignOpponent(campaign);
    const battle = createBattle({
      playerCharacter: campaign.characterId,
      playerDeck: campaign.deck,
      enemyCharacter: opponent.characterId,
      enemyDeck: opponent.deck,
      actions: campaign.slots,
      seed: opponent.seed,
      difficulty: campaign.difficulty,
      label: campaign.endless ? 'Infinito' : 'Ronda ' + (campaign.stage + 1)
    });
    return { battle, opponent };
  }

  function rewardChoices(characterId, deck, rng, count) {
    const owned = new Set(deck);
    const pool = DT.rewardPool(characterId).filter((id) => !owned.has(id));
    const shuffled = rng.shuffle(pool);
    const choices = shuffled.slice(0, count || 5);
    if (choices.length < (count || 5)) {
      for (const card of DT.CARD_LIST) {
        if (choices.length >= (count || 5)) break;
        if (card.rarity !== 'legend' && !owned.has(card.id) && choices.indexOf(card.id) === -1) {
          choices.push(card.id);
        }
      }
    }
    return choices;
  }

  function cloneBattleForAI(state) {
    return {
      board: state.board,
      player: cloneFighter(state.player),
      enemy: cloneFighter(state.enemy),
      round: state.round,
      actions: state.actions,
      phase: 'resolving',
      result: null,
      seed: state.seed
    };
  }

  root.Engine = {
    BOARD_W,
    BOARD_H,
    EN_REGEN,
    hashSeed,
    createRng,
    clamp,
    inBoard,
    createFighter,
    createBattle,
    resolveSlot,
    endRound,
    canUse,
    attackCellsFor,
    moveTarget,
    simulate,
    cloneBattleForAI,
    previewPlan,
    planCost,
    makeOpponentOrder,
    createCampaign,
    campaignOpponent,
    createCampaignBattle,
    rewardChoices,
    opponentDeck
  };
})(typeof window !== 'undefined' ? window : globalThis);
