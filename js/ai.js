(function (root) {
  const DT = root.DT;
  const Engine = root.Engine;

  function kindsOf(card) {
    if (!card) return 'other';
    if (card.damage) return 'attack';
    if (card.kind === 'move') return 'move';
    if (card.kind === 'guard') return 'guard';
    if (card.kind === 'heal' || card.kind === 'energy') return 'utility';
    return 'other';
  }

  function weightedPick(deck, chosen, rng, weights) {
    const available = deck.filter((id) => chosen.indexOf(id) === -1);
    if (!available.length) return null;
    const weighted = [];
    for (const id of available) {
      const card = DT.getCard(id);
      const kind = kindsOf(card);
      let weight = weights[kind] || 1;
      if (kind === 'attack') weight += Math.min(3, (card.damage || 0) / 20);
      weighted.push({ id, weight });
    }
    const total = weighted.reduce((sum, item) => sum + item.weight, 0);
    let roll = rng.next() * total;
    for (const item of weighted) {
      roll -= item.weight;
      if (roll <= 0) return item.id;
    }
    return weighted[weighted.length - 1].id;
  }

  function samplePlan(deck, actions, rng, weights) {
    const plan = [];
    for (let i = 0; i < actions; i += 1) {
      const id = weightedPick(deck, plan, rng, weights);
      if (!id) break;
      plan.push(id);
    }
    return plan;
  }

  function randomPlan(deck, actions, rng) {
    const shuffled = rng.shuffle(deck);
    return shuffled.slice(0, Math.min(actions, shuffled.length));
  }

  function permutationsCount(n, k) {
    let total = 1;
    for (let i = 0; i < k; i += 1) total *= n - i;
    return total;
  }

  function enumeratePlans(deck, actions, limit, rng) {
    const count = permutationsCount(deck.length, actions);
    if (count <= limit) {
      const output = [];
      const walk = (prefix, remaining) => {
        if (prefix.length === actions) {
          output.push(prefix.slice());
          return;
        }
        for (let i = 0; i < remaining.length; i += 1) {
          const next = remaining.slice();
          const [card] = next.splice(i, 1);
          prefix.push(card);
          walk(prefix, next);
          prefix.pop();
        }
      };
      walk([], deck);
      return output;
    }
    const output = [];
    const seen = new Set();
    let guard = 0;
    const maxGuard = limit * 12;
    while (output.length < limit && guard < maxGuard) {
      guard += 1;
      const plan = randomPlan(deck, actions, rng);
      const key = plan.join('|');
      if (!seen.has(key)) {
        seen.add(key);
        output.push(plan);
      }
    }
    return output;
  }

  function threatCount(state, side) {
    const me = state[side];
    const foe = side === 'player' ? state.enemy : state.player;
    let count = 0;
    for (const id of me.deck) {
      const card = DT.getCard(id);
      if (!card || !card.damage || (card.cost || 0) > me.energy) continue;
      const cells = DT.attackCells(card, me.x, me.y, me.facing);
      if (cells.some((cell) => cell.x === foe.x && cell.y === foe.y)) count += 1;
    }
    return count;
  }

  function scoreResult(initial, sim) {
    if (sim.result === 'win') return 6000 + (sim.enemy.hp - sim.player.hp) * 2 + sim.enemy.energy;
    if (sim.result === 'lose') return -6000 + (sim.player.hp - sim.enemy.hp) * 2;
    if (sim.result === 'draw') return -1800;
    const dealt = initial.player.hp - sim.player.hp;
    const taken = initial.enemy.hp - sim.enemy.hp;
    let score = dealt * 2.1 - taken * 1.55;
    score += (sim.enemy.hp - sim.player.hp) * 0.12;
    score += sim.enemy.energy * 0.13 - sim.player.energy * 0.06;
    score += threatCount(sim, 'enemy') * 6.5 - threatCount(sim, 'player') * 7.5;
    return score;
  }

  function predictivePlans(state, rng, count) {
    if (!count) return [];
    const plans = [];
    const weights = { attack: 48, move: 27, guard: 11, utility: 14, other: 1 };
    plans.push(samplePlan(state.player.deck, state.actions, rng, weights));
    plans.push(samplePlan(state.player.deck, state.actions, rng, { attack: 80, move: 15, guard: 3, utility: 2, other: 1 }));
    plans.push(samplePlan(state.player.deck, state.actions, rng, { attack: 20, move: 38, guard: 22, utility: 20, other: 1 }));
    const reverse = rng.shuffle(state.player.deck);
    plans.push(reverse.slice(0, Math.min(state.actions, reverse.length)));
    while (plans.length < count) {
      plans.push(samplePlan(state.player.deck, state.actions, rng, weights));
    }
    return plans.slice(0, count);
  }

  function plan(state, side, options) {
    const config = options || {};
    const difficulty = config.difficulty || state.difficulty || 'normal';
    const seed = config.seed || (state.seed + state.round * 101 + (side === 'enemy' ? 17 : 3));
    const rng = Engine.createRng(seed);
    const fighter = side === 'player' ? state.player : state.enemy;
    const deck = fighter.deck.filter((id) => !!DT.getCard(id));
    const actions = state.actions;

    if (difficulty === 'easy') {
      const lowEnergy = fighter.energy < 25;
      const energyCard = deck.find((id) => DT.getCard(id).kind === 'energy');
      if (lowEnergy && energyCard && rng.next() < 0.45) {
        const rest = samplePlan(deck.filter((id) => id !== energyCard), actions - 1, rng, { attack: 34, move: 30, guard: 20, utility: 8, other: 1 });
        return [energyCard].concat(rest).slice(0, actions);
      }
      return samplePlan(deck, actions, rng, { attack: 42, move: 28, guard: 13, utility: 16, other: 1 });
    }

    const limit = difficulty === 'hard' ? 620 : 160;
    const candidates = enumeratePlans(deck, actions, limit, rng);
    const sampleCount = difficulty === 'hard' ? 10 : 6;
    const predictions = predictivePlans(state, rng, sampleCount);
    let best = null;
    let bestScore = -Infinity;
    for (const candidate of candidates) {
      let total = 0;
      let worst = Infinity;
      for (const prediction of predictions) {
        const sim = Engine.simulate(state, side === 'enemy' ? prediction : candidate, side === 'enemy' ? candidate : prediction);
        const score = scoreResult(state, sim);
        total += score;
        if (score < worst) worst = score;
      }
      const mean = total / predictions.length;
      const blend = difficulty === 'hard' ? mean * 0.82 + worst * 0.18 : mean;
      const jitter = rng.next() * 0.8;
      const finalScore = blend + jitter;
      if (finalScore > bestScore) {
        bestScore = finalScore;
        best = candidate;
      }
    }
    return best || randomPlan(deck, actions, rng);
  }

  function counterPlan(state, observedPlan, options) {
    const config = options || {};
    const rng = Engine.createRng(config.seed || (state.seed + state.round * 313));
    const deck = state.enemy.deck.filter((id) => !!DT.getCard(id));
    const candidates = enumeratePlans(deck, state.actions, 240, rng);
    let best = null;
    let bestScore = -Infinity;
    for (const candidate of candidates) {
      const sim = Engine.simulate(state, observedPlan, candidate);
      const score = scoreResult(state, sim) + rng.next() * 0.4;
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    return best;
  }

  root.AI = {
    plan,
    counterPlan,
    scoreResult,
    threatCount
  };
})(typeof window !== 'undefined' ? window : globalThis);
