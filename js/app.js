(function () {
  const DT = window.DT;
  const Engine = window.Engine;
  const AI = window.AI;
  const UI = window.UI;
  const Sound = window.Sound;

  const SAVE_KEY = 'demonTorneo.save.v1';
  const SETTINGS_KEY = 'demonTorneo.settings.v1';

  const App = {
    screen: 'title',
    settings: { sound: true, speed: 1, difficulty: 'normal' },
    campaign: null,
    battle: null,
    opponent: null,
    selectedCharId: null,
    busy: false,
    speed: 1,
    currentSlot: -1,
    log: [],
    modalSeq: 0,
    modalOpen: false,
    modalDismissible: true,
    rewardSelected: null
  };

  const $ = (selector, scope) => (scope || document).querySelector(selector);
  const $$ = (selector, scope) => Array.prototype.slice.call((scope || document).querySelectorAll(selector));

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(40, Math.round(ms / App.speed))));
  }

  function safeParse(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function loadSettings() {
    try {
      const saved = safeParse(localStorage.getItem(SETTINGS_KEY));
      if (saved && typeof saved === 'object') {
        App.settings = {
          sound: saved.sound !== false,
          speed: saved.speed === 2 ? 2 : 1,
          difficulty: DT.DIFFICULTIES[saved.difficulty] ? saved.difficulty : 'normal'
        };
      }
    } catch (error) {
      App.settings = { sound: true, speed: 1, difficulty: 'normal' };
    }
    App.speed = App.settings.speed;
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(App.settings));
    } catch (error) {
      return;
    }
  }

  function loadSave() {
    try {
      const saved = safeParse(localStorage.getItem(SAVE_KEY));
      if (!saved || saved.version !== 1) return null;
      if (!DT.character(saved.characterId)) return null;
      if (!Array.isArray(saved.deck) || !saved.deck.length) return null;
      const character = DT.character(saved.characterId);
      const allowed = new Set(DT.CARD_LIST.map((card) => card.id));
      saved.deck = saved.deck.filter((id) => allowed.has(id));
      if (!saved.deck.length) saved.deck = character.deck.slice();
      saved.shards = Math.max(0, Math.min(5, Number(saved.shards) || 0));
      saved.stage = Math.max(0, Math.min(5, Number(saved.stage) || 0));
      saved.slots = saved.slots === 4 ? 4 : 3;
      saved.streak = Number(saved.streak) || 0;
      saved.bestStreak = Number(saved.bestStreak) || 0;
      saved.endless = !!saved.endless;
      saved.completed = !!saved.completed;
      if (!Array.isArray(saved.opponentOrder) || saved.opponentOrder.length < 5) {
        const rng = Engine.createRng(saved.seed || 1);
        saved.opponentOrder = Engine.makeOpponentOrder(saved.characterId, rng, 5);
      }
      return saved;
    } catch (error) {
      return null;
    }
  }

  function saveCampaign() {
    if (!App.campaign) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(App.campaign));
    } catch (error) {
      return;
    }
    updateContinueButton();
  }

  function clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (error) {
      return;
    }
    updateContinueButton();
  }

  function showScreen(name) {
    App.screen = name;
    $$('.screen').forEach((screen) => screen.classList.add('hidden'));
    const target = $('#screen-' + name);
    if (target) {
      target.classList.remove('hidden');
      target.classList.remove('screen-enter');
      void target.offsetWidth;
      target.classList.add('screen-enter');
    }
    document.body.dataset.screen = name;
    $('#topbar').classList.toggle('on-title', name === 'title');
    updateTopbar();
    window.scrollTo(0, 0);
  }

  function updateTopbar() {
    const shards = $('#top-shards');
    const progress = $('#top-progress');
    if (App.campaign) {
      shards.innerHTML = UI.shardTrack(App.campaign.shards, 5);
      if (App.campaign.endless) {
        progress.textContent = 'INFINITO · RACHA ' + App.campaign.streak +
          (App.campaign.bestStreak ? ' · RÉCORD ' + App.campaign.bestStreak : '');
      } else if (App.campaign.completed) {
        progress.textContent = 'JADE COMPLETO';
      } else {
        const difficulty = DT.DIFFICULTIES[App.campaign.difficulty] || DT.DIFFICULTIES.normal;
        progress.textContent = 'RONDA ' + Math.min(App.campaign.stage + 1, 5) + ' / 5 · ' + difficulty.name.toUpperCase();
      }
    } else {
      shards.innerHTML = '';
      progress.textContent = App.screen === 'select' ? 'ELIGE CAMPEÓN' : 'DUELO TÁCTICO DE CARTAS';
    }
  }

  function updateContinueButton() {
    const button = $('#btn-continue');
    if (!button) return;
    const save = loadSave();
    button.classList.toggle('hidden', !save);
    if (save) {
      const character = DT.character(save.characterId);
      button.querySelector('span:last-child').textContent = 'Continuar · ' + character.name;
    }
  }

  function updateSoundButton() {
    const button = $('#btn-sound');
    if (!button) return;
    button.setAttribute('aria-pressed', String(App.settings.sound));
    button.classList.toggle('muted', !App.settings.sound);
    button.querySelector('[data-sound-glyph]').textContent = App.settings.sound ? '♪' : '♪';
    button.querySelector('.icon-btn-label').textContent = App.settings.sound ? 'Sonido' : 'Silencio';
    button.title = App.settings.sound ? 'Silenciar sonido' : 'Activar sonido';
  }

  function showToast(message, type) {
    const root = $('#toast-root');
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type || '');
    toast.textContent = message;
    root.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 260);
    }, 2600);
  }

  function openModal(html, options) {
    const opts = options || {};
    const root = $('#modal-root');
    App.modalSeq += 1;
    App.modalOpen = true;
    App.modalDismissible = opts.dismissible !== false;
    root.classList.remove('hidden');
    root.classList.remove('closing');
    root.innerHTML = '<div class="modal-backdrop"><div class="modal ' + (opts.className || '') + '" role="dialog" aria-modal="true">' + html + '</div></div>';
    root.onclick = (event) => {
      if (event.target.classList.contains('modal-backdrop') && App.modalDismissible) closeModal();
    };
    if (opts.focus) {
      setTimeout(() => {
        const target = $(opts.focus);
        if (target) target.focus();
      }, 30);
    }
    return root;
  }

  function closeModal() {
    const root = $('#modal-root');
    if (!App.modalOpen || root.classList.contains('hidden')) return;
    const seq = ++App.modalSeq;
    App.modalOpen = false;
    root.classList.add('closing');
    setTimeout(() => {
      if (seq !== App.modalSeq) return;
      root.classList.add('hidden');
      root.classList.remove('closing');
      root.innerHTML = '';
      root.onclick = null;
    }, 180);
  }

  function renderTitleShowcase() {
    const host = $('#title-showcase');
    if (!host || host.dataset.ready === 'true') return;
    const ids = ['kuro-fury', 'aiko-dawn', 'sei-dragon'];
    host.innerHTML = ids.map((id, index) => {
      const card = DT.getCard(id);
      return '<div class="showcase-card showcase-' + (index + 1) + '">' + UI.cardHTML(card, { asDiv: true }) + '</div>';
    }).join('');
    host.dataset.ready = 'true';
  }

  function difficulties() {
    return [DT.DIFFICULTIES.easy, DT.DIFFICULTIES.normal, DT.DIFFICULTIES.hard];
  }

  function renderDifficulty() {
    const picker = $('#difficulty-picker');
    picker.innerHTML = difficulties().map((difficulty) => {
      return '<button type="button" class="seg-btn ' + (App.settings.difficulty === difficulty.id ? 'active' : '') + '" data-difficulty="' + difficulty.id + '">' + difficulty.name + '</button>';
    }).join('');
    const current = DT.DIFFICULTIES[App.settings.difficulty] || DT.DIFFICULTIES.normal;
    $('#difficulty-blurb').textContent = current.blurb;
  }

  function showSelect() {
    showScreen('select');
    if (!App.selectedCharId) App.selectedCharId = DT.CHARACTERS[0].id;
    renderDifficulty();
    renderCharGrid();
    renderCharDetail();
  }

  function renderCharGrid() {
    const grid = $('#char-grid');
    grid.innerHTML = DT.CHARACTERS.map((character) => UI.characterCard(character, character.id === App.selectedCharId)).join('');
  }

  function renderCharDetail() {
    const character = DT.character(App.selectedCharId) || DT.CHARACTERS[0];
    const host = $('#char-detail');
    const baseCount = character.deck.filter((id) => DT.getCard(id).rarity === 'base').length;
    const attacks = character.deck.filter((id) => DT.getCard(id).damage > 0).length;
    host.innerHTML = `
      <div class="detail-portrait-wrap">
        <div class="detail-portrait">${UI.portrait(character.id)}</div>
        <div class="detail-sigil">${character.name.charAt(0)}</div>
      </div>
      <div class="detail-copy">
        <p class="eyebrow"><span></span> ${character.style} <span></span></p>
        <h2>${character.name}</h2>
        <h3>${character.title}</h3>
        <p class="detail-bio">${character.bio}</p>
        <blockquote>“${character.taunt}”</blockquote>
        <div class="detail-stats">
          <div><span>VIDA</span><b>${character.hp}</b></div>
          <div><span>ENERGÍA</span><b>${character.energy}</b></div>
          <div><span>ATAQUES</span><b>${attacks}</b></div>
          <div><span>BASE</span><b>${baseCount}</b></div>
        </div>
        <div class="detail-deck">
          <span class="deck-label">MAZO INICIAL · ${character.deck.length} CARTAS</span>
          <div class="deck-chips">
            ${character.deck.map((id) => {
              const card = DT.getCard(id);
              return '<span class="deck-chip tone-' + card.tone + '"><i>' + card.name.charAt(0) + '</i>' + card.name + '</span>';
            }).join('')}
          </div>
          <span class="deck-label secondary">EXCLUSIVAS DESBLOQUEABLES</span>
          <div class="deck-chips">
            ${character.exclusives.map((id) => {
              const card = DT.getCard(id);
              return '<span class="deck-chip rare tone-' + card.tone + '"><i>' + card.name.charAt(0) + '</i>' + card.name + '</span>';
            }).join('')}
          </div>
        </div>
        <button type="button" class="btn btn-primary btn-large btn-start" id="btn-start-campaign">
          <span class="btn-glyph">⚔</span>
          <span>Comenzar torneo</span>
        </button>
      </div>
    `;
    $('#btn-start-campaign').onclick = () => {
      Sound.play('select');
      startCampaign();
    };
  }

  function startCampaign() {
    const character = DT.character(App.selectedCharId) || DT.CHARACTERS[0];
    App.campaign = Engine.createCampaign({
      characterId: character.id,
      difficulty: App.settings.difficulty,
      seed: Date.now() % 2147483647
    });
    saveCampaign();
    startBattle({ intro: true });
  }

  function startBattle(options) {
    const opts = options || {};
    if (!App.campaign) return;
    const setup = Engine.createCampaignBattle(App.campaign);
    App.battle = setup.battle;
    App.opponent = setup.opponent;
    App.battle.player.plan = [];
    App.battle.enemy.plan = AI.plan(App.battle, 'enemy', {
      difficulty: App.campaign.difficulty,
      seed: App.battle.seed + 23
    });
    App.log = [];
    App.currentSlot = -1;
    App.busy = false;
    App.rewardSelected = null;
    renderBattle();
    showScreen('battle');
    updateTopbar();
    const player = DT.character(App.campaign.characterId);
    const enemy = DT.character(App.opponent.characterId);
    if (App.campaign.endless) {
      addLog('Modo infinito · racha ' + App.campaign.streak + ' — ' + player.name + ' vs ' + enemy.name, 'round');
    } else {
      addLog('Ronda ' + (App.campaign.stage + 1) + ' de 5 — ' + player.name + ' vs ' + enemy.name, 'round');
    }
    addLog('Elige ' + App.battle.actions + ' acciones y pulsa Ejecutar.', 'system');
    if (opts.intro === false) {
      updateControls();
      showRoundFlash('RONDA ' + App.battle.round);
      Sound.play('round');
    } else {
      openIntro();
    }
  }

  function openIntro() {
    if (!App.battle || !App.opponent) return;
    App.busy = true;
    updateControls();
    const player = DT.character(App.campaign.characterId);
    const enemy = DT.character(App.opponent.characterId);
    const stageLabel = App.campaign.endless ? 'MODO INFINITO' : 'RONDA ' + (App.campaign.stage + 1) + ' DE 5';
    const extras = App.opponent.extras || 0;
    openModal(`
      <div class="intro-inner tone-${enemy.tone}">
        <div class="intro-topline">
          <span></span><b>${stageLabel}</b><span></span>
        </div>
        <div class="intro-duel">
          <div class="intro-fighter">
            <div class="intro-portrait">${UI.portrait(player.id)}</div>
            <h3>${player.name}</h3>
            <p>${player.title}</p>
          </div>
          <div class="intro-vs">
            <span>対</span>
            <b>VS</b>
          </div>
          <div class="intro-fighter enemy">
            <div class="intro-portrait">${UI.portrait(enemy.id)}</div>
            <h3>${enemy.name}</h3>
            <p>${enemy.title}</p>
          </div>
        </div>
        <p class="intro-taunt">“${enemy.taunt}”</p>
        <div class="intro-meta">
          <span>Dificultad: <b>${(DT.DIFFICULTIES[App.campaign.difficulty] || DT.DIFFICULTIES.normal).name}</b></span>
          <span>Cartas extra del rival: <b>+${extras}</b></span>
          <span>Acciones por ronda: <b>${App.battle.actions}</b></span>
        </div>
        <button type="button" class="btn btn-primary btn-large" id="intro-start">
          <span class="btn-glyph">⚔</span><span>Comenzar combate</span>
        </button>
      </div>
    `, { className: 'intro-modal', dismissible: false, focus: '#intro-start' });
    $('#intro-start').onclick = () => {
      closeModal();
      App.busy = false;
      updateControls();
      Sound.play('round');
      showRoundFlash('RONDA ' + App.battle.round);
    };
  }

  function renderBattle() {
    if (!App.battle) return;
    const battle = App.battle;
    const enemyBadge = App.campaign.endless ? 'INFINITO' : 'RIVAL';
    $('#enemy-hud').innerHTML = UI.fighterHUD(battle.enemy, 'enemy', { badge: enemyBadge });
    $('#player-hud').innerHTML = UI.fighterHUD(battle.player, 'player', { badge: 'TÚ' });
    $('#round-shards').innerHTML = UI.shardTrack(App.campaign.shards, 5);
    $('#board-host').innerHTML = UI.boardHTML();
    $('#token-player-portrait').innerHTML = UI.portrait(battle.player.characterId);
    $('#token-enemy-portrait').innerHTML = UI.portrait(battle.enemy.characterId);
    $('#battle-log').innerHTML = '';
    renderLog();
    renderSlots(null);
    renderHand();
    renderPlanSummary();
    renderInspect(null);
    updateHUD();
    updateControls();
    positionTokens(false);
    updateRoundHeader();
    $('#hand').scrollLeft = 0;
  }

  function updateRoundHeader() {
    if (!App.battle) return;
    const battle = App.battle;
    $('#round-number').textContent = battle.round;
    $('#round-kicker').textContent = App.campaign.endless ? 'INFINITO' : 'RONDA';
    let state = 'Planifica tu ronda';
    if (battle.result === 'win') state = 'Victoria';
    else if (battle.result === 'lose') state = 'Derrota';
    else if (battle.result === 'draw') state = 'Empate';
    else if (battle.phase === 'resolving') state = 'Resolviendo acciones';
    else if (battle.player.plan.length >= battle.actions) state = 'Listo para ejecutar';
    $('#round-state').textContent = state;
  }

  function fighterNode(side) {
    return $('.fighter-hud[data-side="' + side + '"]');
  }

  function updateHUD() {
    if (!App.battle) return;
    const battle = App.battle;
    for (const side of ['player', 'enemy']) {
      const fighter = battle[side];
      const node = fighterNode(side);
      if (!node) continue;
      const hpPct = Math.max(0, (fighter.hp / fighter.maxHp) * 100);
      const enPct = Math.max(0, (fighter.energy / fighter.maxEnergy) * 100);
      const hpFill = $('.bar.hp .fill', node);
      const enFill = $('.bar.en .fill', node);
      const hpText = $('.bar.hp b', node);
      const enText = $('.bar.en b', node);
      if (hpFill) hpFill.style.width = hpPct + '%';
      if (enFill) enFill.style.width = enPct + '%';
      if (hpText) hpText.textContent = Math.ceil(Math.max(0, fighter.hp)) + ' / ' + fighter.maxHp;
      if (enText) enText.textContent = Math.ceil(fighter.energy) + ' / ' + fighter.maxEnergy;
      node.classList.toggle('low-hp', fighter.hp <= fighter.maxHp * 0.3);
      node.classList.toggle('defeated', fighter.hp <= 0);
    }
    updateTokenPositions();
    updateRoundHeader();
  }

  function positionTokens(animate) {
    if (!App.battle) return;
    for (const side of ['player', 'enemy']) {
      const fighter = App.battle[side];
      const token = document.getElementById('token-' + side);
      if (!token) continue;
      if (!animate) token.classList.add('no-anim');
      token.style.left = ((fighter.x + 0.5) / Engine.BOARD_W * 100) + '%';
      token.style.top = ((fighter.y + 0.5) / Engine.BOARD_H * 100) + '%';
      token.dataset.x = fighter.x;
      token.dataset.y = fighter.y;
      if (!animate) {
        void token.offsetWidth;
        token.classList.remove('no-anim');
      }
    }
  }

  function updateTokenPositions() {
    positionTokens(true);
  }

  function renderSlots(revealedUpTo) {
    if (!App.battle) return;
    const battle = App.battle;
    const playerPlan = battle.player.plan;
    const enemyPlan = battle.enemy.plan;
    let html = '';
    for (let i = 0; i < battle.actions; i += 1) {
      const enemyReveal = revealedUpTo !== null && revealedUpTo >= i ? enemyPlan[i] : null;
      const active = App.currentSlot === i && battle.phase === 'resolving';
      const resolved = revealedUpTo !== null && i < App.currentSlot;
      html += '<div class="slot-wrap ' + (active ? 'active' : '') + ' ' + (resolved ? 'resolved' : '') + '">' +
        UI.actionSlotHTML(i, playerPlan[i], enemyReveal) + '</div>';
    }
    $('#action-slots').innerHTML = html;
  }

  function renderHand() {
    if (!App.battle || !App.campaign) return;
    const battle = App.battle;
    const plan = battle.player.plan;
    const deck = App.campaign.deck;
    $('#hand').innerHTML = deck.map((id, index) => {
      const card = DT.getCard(id);
      if (!card) return '';
      const order = plan.indexOf(id);
      return UI.cardHTML(card, {
        cardId: id,
        selected: order >= 0,
        order: order >= 0 ? order + 1 : 0,
        disabled: App.busy
      });
    }).join('');
    $('#deck-note').textContent = deck.length + ' cartas · ' + battle.actions + ' acciones por ronda';
    $('#deck-title').textContent = 'Técnicas de ' + DT.character(App.campaign.characterId).name;
  }

  function renderPlanSummary() {
    if (!App.battle) return;
    const plan = App.battle.player.plan;
    const node = $('#plan-summary');
    if (!plan.length) {
      node.innerHTML = '<p class="plan-empty">Aún no has elegido acciones.<br>Haz clic en una carta para añadirla al plan.</p>';
      return;
    }
    node.innerHTML = plan.map((id, index) => {
      const card = DT.getCard(id);
      return '<div class="plan-step tone-' + card.tone + '">' +
        '<span class="step-num">' + (index + 1) + '</span>' +
        '<span class="step-art">' + '<svg viewBox="0 0 48 48" aria-hidden="true">' + UI.icon(card.icon) + '</svg>' + '</span>' +
        '<span class="step-copy"><b>' + card.name + '</b><small>' + card.label + '</small></span>' +
        '<span class="step-cost">' + (card.cost || 0) + '</span>' +
        '</div>';
    }).join('');
  }

  function renderEnergyReadout() {
    if (!App.battle) return;
    const plan = App.battle.player.plan;
    const cost = Engine.planCost(plan);
    const energy = App.battle.player.energy;
    const deficit = cost > energy;
    $('#energy-readout').innerHTML = '<span class="en-chip ' + (deficit ? 'danger' : '') + '">' + cost + ' EN</span>' +
      '<span class="en-arrow">→</span>' +
      '<span class="en-left ' + (deficit ? 'danger' : '') + '">' + (deficit ? 'falta energía' : (energy - cost) + ' restante') + '</span>';
  }

  function renderInspect(card) {
    const node = $('#inspect-panel');
    if (!card) {
      node.innerHTML = `
        <div class="panel-head"><h3>Inspección</h3></div>
        <div class="inspect-empty">
          <div class="inspect-orb">?</div>
          <p>Pasa el cursor sobre una carta para ver su alcance y su efecto.</p>
          <ul class="inspect-tips">
            <li><b>Movimiento</b> se resuelve antes que la guardia y el ataque.</li>
            <li>La cuadrícula de la carta mira siempre hacia el rival.</li>
            <li>El centro marca tu posición actual.</li>
          </ul>
        </div>
      `;
      return;
    }
    const stats = [];
    if (card.damage) stats.push('<span class="stat-pill dmg">' + card.damage + ' daño</span>');
    if (card.guard) stats.push('<span class="stat-pill guard">' + (card.guard === 'all' ? 'bloqueo total' : 'bloqueo ' + card.guard) + '</span>');
    if (card.heal) stats.push('<span class="stat-pill heal">+' + card.heal + ' vida</span>');
    if (card.gain) stats.push('<span class="stat-pill energy">+' + card.gain + ' energía</span>');
    if (card.drain) stats.push('<span class="stat-pill drain">drena ' + card.drain + '</span>');
    if (card.kind === 'move') stats.push('<span class="stat-pill move">' + (Math.abs(card.move.x) > 1 || Math.abs(card.move.y) > 1 ? 'movimiento doble' : 'movimiento') + '</span>');
    node.innerHTML = `
      <div class="panel-head"><h3>Inspección</h3><span class="inspect-cost">${card.cost || 0} EN</span></div>
      <div class="inspect-card-head tone-${card.tone}">
        <div class="inspect-icon"><svg viewBox="0 0 48 48" aria-hidden="true">${UI.icon(card.icon)}</svg></div>
        <div><span class="inspect-label">${card.label}</span><h3>${card.name}</h3></div>
      </div>
      <div class="inspect-stats">${stats.join('')}</div>
      <p class="inspect-desc">${card.desc}</p>
      <p class="inspect-flavor">“${card.flavor}”</p>
      <div class="inspect-pattern">
        <span>ALCANCE</span>
        ${UI.patternGrid(card)}
      </div>
    `;
  }

  function updateControls() {
    if (!App.battle) return;
    const battle = App.battle;
    const plan = battle.player.plan;
    const canExecute = !App.busy && battle.phase === 'planning' && plan.length === battle.actions && !battle.result;
    $('#btn-execute').disabled = !canExecute;
    $('#btn-clear').disabled = App.busy || plan.length === 0 || battle.phase !== 'planning';
    $('#hand').classList.toggle('locked', App.busy || battle.phase !== 'planning');
    $('#action-slots').classList.toggle('locked', App.busy || battle.phase !== 'planning');
    $('#board-frame').classList.toggle('resolving', battle.phase === 'resolving');
    $('#btn-speed').textContent = App.speed + '×';
    let hint = 'Elige tus acciones en orden';
    if (battle.result) hint = 'Combate terminado';
    else if (App.busy && battle.phase === 'resolving') hint = 'Resolviendo la ronda…';
    else if (plan.length >= battle.actions) hint = 'Todo listo. Pulsa Ejecutar ronda.';
    else hint = 'Elige ' + (battle.actions - plan.length) + ' acción' + (battle.actions - plan.length === 1 ? ' más' : 'es más');
    $('#arena-hint').textContent = hint;
    renderEnergyReadout();
    renderPlanSummary();
    updateRoundHeader();
  }

  function addLog(text, type) {
    App.log.push({ text, type: type || 'system', round: App.battle ? App.battle.round : 0 });
    if (App.log.length > 140) App.log.shift();
    renderLog();
  }

  function renderLog() {
    const node = $('#battle-log');
    if (!node) return;
    node.innerHTML = App.log.map((entry) => {
      return '<div class="log-entry type-' + entry.type + '">' +
        '<span class="log-round">R' + entry.round + '</span>' +
        '<span class="log-text">' + entry.text + '</span>' +
        '</div>';
    }).join('');
    node.scrollTop = node.scrollHeight;
  }

  function sideName(side) {
    return side === 'player'
      ? DT.character(App.campaign.characterId).name
      : App.battle.enemy.name;
  }

  function toggleCard(cardId) {
    if (!App.battle || App.busy || App.battle.phase !== 'planning' || App.battle.result) return;
    const plan = App.battle.player.plan;
    const index = plan.indexOf(cardId);
    if (index >= 0) {
      plan.splice(index, 1);
      Sound.play('click');
    } else {
      if (plan.length >= App.battle.actions) {
        showToast('Ya tienes ' + App.battle.actions + ' acciones. Quita una para cambiarla.');
        return;
      }
      plan.push(cardId);
      Sound.play('select');
    }
    clearPreviews();
    renderSlots(null);
    renderHand();
    renderPlanSummary();
    renderInspect(null);
    updateControls();
  }

  function clearPlan() {
    if (!App.battle || App.busy) return;
    App.battle.player.plan = [];
    clearPreviews();
    renderSlots(null);
    renderHand();
    renderPlanSummary();
    renderInspect(null);
    updateControls();
    Sound.play('click');
  }

  function clearPreviews() {
    $$('.tile').forEach((tile) => tile.classList.remove('preview-attack', 'preview-move', 'preview-self'));
    $$('.token').forEach((token) => token.classList.remove('preview-target'));
    renderInspect(null);
  }

  function previewCard(cardId) {
    if (!App.battle || App.busy || App.battle.phase !== 'planning') return;
    const card = DT.getCard(cardId);
    if (!card) return;
    clearPreviews();
    const plan = App.battle.player.plan;
    const index = plan.indexOf(cardId);
    let entry;
    if (index >= 0) {
      const preview = Engine.previewPlan(App.battle, plan.slice(0, index + 1));
      entry = preview[preview.length - 1];
      if (preview.length > 1) {
        const previous = preview[preview.length - 2];
        if (previous && previous.moveTo) entry.from = previous.moveTo;
      }
    } else {
      entry = Engine.previewPlan(App.battle, [cardId])[0];
    }
    if (!entry) return;
    if (entry.moveTo) {
      const tile = document.querySelector('.tile[data-x="' + entry.moveTo.x + '"][data-y="' + entry.moveTo.y + '"]');
      if (tile) tile.classList.add('preview-move');
    }
    if (entry.cells && entry.cells.length) {
      entry.cells.forEach((cell) => {
        const tile = document.querySelector('.tile[data-x="' + cell.x + '"][data-y="' + cell.y + '"]');
        if (tile) tile.classList.add('preview-attack');
      });
    }
    if (card.guard || card.gain || card.heal) {
      const tile = document.querySelector('.tile[data-x="' + App.battle.player.x + '"][data-y="' + App.battle.player.y + '"]');
      if (tile) tile.classList.add('preview-self');
    }
    renderInspect(card);
  }

  function showRoundFlash(text) {
    const host = $('#board-host');
    if (!host) return;
    const flash = document.createElement('div');
    flash.className = 'round-flash';
    flash.innerHTML = '<span>' + text + '</span>';
    host.appendChild(flash);
    setTimeout(() => flash.remove(), 1400);
  }

  function shakeBoard() {
    const frame = $('#board-frame');
    if (!frame) return;
    frame.classList.remove('shake');
    void frame.offsetWidth;
    frame.classList.add('shake');
    setTimeout(() => frame.classList.remove('shake'), 430);
  }

  function pulseToken(side, className, duration) {
    const token = document.getElementById('token-' + side);
    if (!token) return;
    token.classList.add(className);
    setTimeout(() => token.classList.remove(className), duration || 500);
  }

  function floatAt(side, text, className) {
    const fighter = App.battle[side];
    floatAtCell(fighter.x, fighter.y, text, className);
  }

  function floatAtCell(x, y, text, className) {
    const fx = $('#board-fx');
    if (!fx) return;
    const item = document.createElement('span');
    item.className = 'float-text ' + (className || '');
    item.textContent = text;
    item.style.left = ((x + 0.5) / Engine.BOARD_W * 100) + '%';
    item.style.top = ((y + 0.5) / Engine.BOARD_H * 100) + '%';
    item.style.setProperty('--drift', (Math.random() * 24 - 12).toFixed(1) + 'px');
    fx.appendChild(item);
    setTimeout(() => item.remove(), 1000);
  }

  function burst(side) {
    const fighter = App.battle[side];
    const fx = $('#board-fx');
    if (!fx) return;
    for (let i = 0; i < 10; i += 1) {
      const spark = document.createElement('span');
      spark.className = 'spark';
      spark.style.left = ((fighter.x + 0.5) / Engine.BOARD_W * 100) + '%';
      spark.style.top = ((fighter.y + 0.5) / Engine.BOARD_H * 100) + '%';
      const angle = (Math.PI * 2 * i) / 10;
      const distance = 24 + Math.random() * 34;
      spark.style.setProperty('--sx', (Math.cos(angle) * distance).toFixed(1) + 'px');
      spark.style.setProperty('--sy', (Math.sin(angle) * distance).toFixed(1) + 'px');
      fx.appendChild(spark);
      setTimeout(() => spark.remove(), 700);
    }
  }

  function highlightCells(cells, className, duration) {
    if (!cells || !cells.length) return;
    const tiles = [];
    cells.forEach((cell) => {
      const tile = document.querySelector('.tile[data-x="' + cell.x + '"][data-y="' + cell.y + '"]');
      if (tile) {
        tile.classList.add(className);
        tiles.push(tile);
      }
    });
    setTimeout(() => tiles.forEach((tile) => tile.classList.remove(className)), duration || 520);
  }

  function animateEvents(events) {
    return events.reduce((chain, event) => chain.then(() => animateEvent(event)), Promise.resolve());
  }

  function animateEvent(event) {
    const battle = App.battle;
    if (!battle) return Promise.resolve();
    if (event.type === 'move') {
      Sound.play('move');
      positionTokens(true);
      addLog(sideName(event.side) + ' se reposiciona.', 'move');
      return delay(380);
    }
    if (event.type === 'bump') {
      Sound.play('block');
      floatAtCell(2, 1, '¡CHOQUE!', 'block');
      addLog('Ambos intentan ocupar la misma casilla: choque.', 'block');
      return delay(340);
    }
    if (event.type === 'guard') {
      Sound.play('guard');
      pulseToken(event.side, 'guarded', 620);
      floatAt(event.side, event.amount === 'all' ? 'BLOQUEO' : 'GUARDIA ' + event.amount, 'block');
      addLog(sideName(event.side) + ' se protege (' + (event.amount === 'all' ? 'bloqueo total' : event.amount) + ').', 'block');
      updateHUD();
      return delay(360);
    }
    if (event.type === 'energy') {
      Sound.play('energy');
      floatAt(event.side, '+' + event.amount + ' EN', 'energy');
      addLog(sideName(event.side) + ' recupera ' + event.amount + ' EN.', 'energy');
      updateHUD();
      return delay(300);
    }
    if (event.type === 'heal') {
      Sound.play('heal');
      floatAt(event.side, '+' + event.amount + ' VIDA', 'heal');
      addLog(sideName(event.side) + ' recupera ' + event.amount + ' de vida.', 'heal');
      updateHUD();
      return delay(400);
    }
    if (event.type === 'fizzle') {
      const card = DT.getCard(event.cardId);
      Sound.play('fizzle');
      floatAt(event.side, 'SIN ENERGÍA', 'fizzle');
      addLog(sideName(event.side) + ' no puede usar ' + card.name + ': energía insuficiente.', 'fizzle');
      return delay(340);
    }
    if (event.type === 'attack') {
      const card = DT.getCard(event.cardId);
      highlightCells(event.cells, 'impact-zone', 560);
      if (event.hit) {
        if (event.damage > 0) {
          Sound.play('hit');
          shakeBoard();
          burst(event.target);
          pulseToken(event.target, 'struck', 560);
          floatAt(event.target, '-' + event.damage, 'damage');
          let text = sideName(event.side) + ' usa ' + card.name + ': ' + event.damage + ' de daño.';
          if (event.absorbed > 0) text += ' La guardia absorbe ' + event.absorbed + '.';
          if (event.drained > 0) text += ' Drena ' + event.drained + ' de vida.';
          addLog(text, event.side === 'player' ? 'player-hit' : 'enemy-hit');
        } else {
          Sound.play('block');
          pulseToken(event.target, 'guarded', 520);
          floatAt(event.target, 'BLOQUEADO', 'block');
          addLog(sideName(event.side) + ' usa ' + card.name + ': la guardia lo detiene por completo.', 'block');
        }
        if (event.drained > 0) {
          floatAt(event.side, '+' + event.drained + ' VIDA', 'heal');
        }
      } else {
        Sound.play('move');
        floatAt(event.target, 'FALLO', 'miss');
        addLog(sideName(event.side) + ' usa ' + card.name + ': falla.', 'miss');
      }
      updateHUD();
      return delay(event.hit ? 640 : 460);
    }
    if (event.type === 'regen') {
      floatAt(event.side, '+' + event.amount + ' EN', 'energy');
      updateHUD();
      return delay(220);
    }
    if (event.type === 'end') {
      return Promise.resolve();
    }
    return Promise.resolve();
  }

  async function executeRound() {
    if (!App.battle || App.busy) return;
    const battle = App.battle;
    if (battle.phase !== 'planning' || battle.player.plan.length !== battle.actions || battle.result) return;
    App.busy = true;
    App.currentSlot = -1;
    battle.phase = 'resolving';
    clearPreviews();
    renderSlots(null);
    updateControls();
    Sound.play('execute');
    addLog('Ronda ' + battle.round + ' — se revelan las acciones.', 'round');
    await delay(420);

    for (let slot = 0; slot < battle.actions; slot += 1) {
      if (battle.result) break;
      App.currentSlot = slot;
      renderSlots(slot);
      updateControls();
      const playerCard = DT.getCard(battle.player.plan[slot]);
      const enemyCard = DT.getCard(battle.enemy.plan[slot]);
      Sound.play('flip');
      addLog('Acción ' + (slot + 1) + ': ' + playerCard.name + ' vs ' + enemyCard.name + '.', 'reveal');
      await delay(680);
      const events = Engine.resolveSlot(battle, slot);
      await animateEvents(events);
      if (battle.result) break;
      await delay(240);
    }

    if (battle.result) {
      await concludeBattle();
      return;
    }

    const regen = Engine.endRound(battle);
    await animateEvents(regen);
    addLog('Fin de ronda: +' + Engine.EN_REGEN + ' EN para ambos.', 'energy');
    battle.enemy.plan = AI.plan(battle, 'enemy', {
      difficulty: App.campaign.difficulty,
      seed: battle.seed + battle.round * 131
    });
    battle.phase = 'planning';
    App.currentSlot = -1;
    App.busy = false;
    renderSlots(null);
    renderHand();
    renderPlanSummary();
    renderInspect(null);
    updateHUD();
    updateControls();
    showRoundFlash('RONDA ' + battle.round);
    Sound.play('round');
  }

  async function concludeBattle() {
    if (!App.battle) return;
    const result = App.battle.result;
    App.busy = true;
    updateControls();
    await delay(480);
    if (result === 'win') {
      Sound.play('win');
      if (App.campaign.endless) handleEndlessWin();
      else handleCampaignWin();
    } else if (result === 'lose') {
      Sound.play('lose');
      handleLoss();
    } else {
      Sound.play('lose');
      handleDraw();
    }
  }

  function handleCampaignWin() {
    const campaign = App.campaign;
    const enemy = DT.character(App.opponent.characterId);
    campaign.shards = Math.min(5, campaign.shards + 1);
    campaign.stage += 1;
    const rng = Engine.createRng(campaign.seed + campaign.stage * 997 + 31);
    const options = Engine.rewardChoices(campaign.characterId, campaign.deck, rng, 5);
    campaign.pending = { type: 'reward', options, stage: campaign.stage };
    saveCampaign();
    updateTopbar();
    const last = campaign.shards >= 5;
    openModal(`
      <div class="result-inner win">
        <p class="eyebrow"><span></span> ${last ? 'Último fragmento' : 'Combate superado'} <span></span></p>
        <div class="result-seal">勝</div>
        <h2>VICTORIA</h2>
        <p class="result-sub">Has derrotado a <b>${enemy.name}</b>.</p>
        <div class="result-reward">
          <div class="result-shard">${UI.shardSVG(true)}</div>
          <div><b>Fragmento del Jade</b><span>${campaign.shards} de 5 reunidos</span></div>
        </div>
        ${last ? '<p class="result-note">El Jade del Alba está completo. Reclama tu recompensa final.</p>' : '<p class="result-note">Elige una nueva técnica para tu mazo.</p>'}
        <div class="modal-actions">
          <button type="button" class="btn btn-primary btn-large" id="result-reward">
            <span class="btn-glyph">玉</span><span>Reclamar recompensa</span>
          </button>
        </div>
      </div>
    `, { className: 'result-modal', dismissible: false, focus: '#result-reward' });
    $('#result-reward').onclick = () => {
      closeModal();
      openRewardModal(campaign.pending.options);
    };
  }

  function handleEndlessWin() {
    const campaign = App.campaign;
    campaign.streak += 1;
    campaign.bestStreak = Math.max(campaign.bestStreak || 0, campaign.streak);
    saveCampaign();
    updateTopbar();
    const enemy = DT.character(App.opponent.characterId);
    Sound.play('shard');
    openModal(`
      <div class="result-inner win">
        <p class="eyebrow"><span></span> Modo infinito <span></span></p>
        <div class="result-seal">勝</div>
        <h2>RACHA ${campaign.streak}</h2>
        <p class="result-sub">Has derrotado a <b>${enemy.name}</b>.</p>
        <div class="endless-stats">
          <div><span>RACHA ACTUAL</span><b>${campaign.streak}</b></div>
          <div><span>MEJOR RACHA</span><b>${campaign.bestStreak}</b></div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary btn-large" id="result-next">Siguiente rival</button>
          <button type="button" class="btn btn-ghost" id="result-menu">Volver al menú</button>
        </div>
      </div>
    `, { className: 'result-modal', dismissible: false, focus: '#result-next' });
    $('#result-next').onclick = () => {
      closeModal();
      startBattle({ intro: true });
    };
    $('#result-menu').onclick = () => {
      closeModal();
      showTitle();
    };
  }

  function handleLoss() {
    const campaign = App.campaign;
    const enemy = DT.character(App.opponent.characterId);
    if (campaign.endless) {
      campaign.streak = 0;
      saveCampaign();
      updateTopbar();
    }
    openModal(`
      <div class="result-inner lose">
        <p class="eyebrow"><span></span> ${campaign.endless ? 'Racha terminada' : 'El jade se oscurece'} <span></span></p>
        <div class="result-seal">敗</div>
        <h2>DERROTA</h2>
        <p class="result-sub"><b>${enemy.name}</b> se queda con el fragmento.</p>
        <p class="result-note">${campaign.endless ? 'Tu mejor racha quedó en ' + (campaign.bestStreak || 0) + '.' : 'Reorganiza tu plan y vuelve a intentarlo.'}</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary btn-large" id="result-retry">${campaign.endless ? 'Nueva racha' : 'Reintentar combate'}</button>
          <button type="button" class="btn btn-ghost" id="result-menu">Volver al menú</button>
        </div>
      </div>
    `, { className: 'result-modal', dismissible: false, focus: '#result-retry' });
    $('#result-retry').onclick = () => {
      closeModal();
      startBattle({ intro: false });
    };
    $('#result-menu').onclick = () => {
      closeModal();
      showTitle();
    };
  }

  function handleDraw() {
    openModal(`
      <div class="result-inner draw">
        <p class="eyebrow"><span></span> Destino compartido <span></span></p>
        <div class="result-seal">引</div>
        <h2>EMPATE</h2>
        <p class="result-sub">Ambos guerreros caen al mismo tiempo.</p>
        <p class="result-note">El fragmento permanece en disputa.</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary btn-large" id="result-retry">Repetir combate</button>
          <button type="button" class="btn btn-ghost" id="result-menu">Volver al menú</button>
        </div>
      </div>
    `, { className: 'result-modal', dismissible: false, focus: '#result-retry' });
    $('#result-retry').onclick = () => {
      closeModal();
      startBattle({ intro: false });
    };
    $('#result-menu').onclick = () => {
      closeModal();
      showTitle();
    };
  }

  function openRewardModal(options) {
    if (!App.campaign) return;
    const list = options && options.length ? options : [];
    App.rewardSelected = null;
    const shards = App.campaign.shards;
    openModal(`
      <div class="reward-inner">
        <p class="eyebrow"><span></span> Botín de combate <span></span></p>
        <h2>ELIGE UNA TÉCNICA</h2>
        <p class="reward-sub">La carta se añadirá permanentemente a tu mazo. Fragmentos del Jade: <b>${shards} / 5</b>.</p>
        <div class="reward-grid" id="reward-grid">
          ${list.map((id) => {
            const card = DT.getCard(id);
            return '<button type="button" class="reward-option" data-reward-id="' + id + '">' +
              UI.cardHTML(card, { asDiv: true }) +
              '<span class="reward-check">✓</span>' +
              '</button>';
          }).join('')}
        </div>
        <div class="reward-detail" id="reward-detail"><span>Selecciona una carta para ver su descripción.</span></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary btn-large" id="reward-confirm" disabled>Añadir al mazo</button>
        </div>
      </div>
    `, { className: 'reward-modal', dismissible: false });
    const grid = $('#reward-grid');
    grid.addEventListener('click', (event) => {
      const option = event.target.closest('[data-reward-id]');
      if (!option) return;
      App.rewardSelected = option.dataset.rewardId;
      $$('.reward-option', grid).forEach((node) => node.classList.toggle('selected', node === option));
      const card = DT.getCard(App.rewardSelected);
      $('#reward-detail').innerHTML = '<div><b>' + card.name + '</b> <span class="reward-type">' + card.label + '</span></div><p>' + card.desc + '</p><p class="inspect-flavor">“' + card.flavor + '”</p>';
      $('#reward-confirm').disabled = false;
      Sound.play('select');
    });
    $('#reward-confirm').onclick = () => {
      if (!App.rewardSelected) return;
      applyReward(App.rewardSelected);
    };
  }

  function applyReward(cardId) {
    if (!App.campaign || !cardId) return;
    const campaign = App.campaign;
    if (campaign.deck.indexOf(cardId) === -1) campaign.deck.push(cardId);
    campaign.pending = null;
    const completes = campaign.shards >= 5 && !campaign.completed;
    saveCampaign();
    updateTopbar();
    closeModal();
    Sound.play('shard');
    if (completes) {
      completeCampaign();
    } else {
      showToast('Carta añadida: ' + DT.getCard(cardId).name, 'reward');
      startBattle({ intro: true });
    }
  }

  function completeCampaign() {
    const campaign = App.campaign;
    campaign.completed = true;
    campaign.slots = 4;
    campaign.endless = true;
    campaign.stage = 0;
    campaign.streak = 0;
    campaign.bestStreak = campaign.bestStreak || 0;
    if (campaign.deck.indexOf('jade-legend') === -1) campaign.deck.push('jade-legend');
    campaign.pending = null;
    saveCampaign();
    updateTopbar();
    openModal(`
      <div class="complete-inner">
        <p class="eyebrow"><span></span> El torneo ha terminado <span></span></p>
        <div class="complete-shards">${UI.shardTrack(5, 5)}</div>
        <h2>EL JADE DEL ALBA</h2>
        <p class="complete-sub">Has reunido los cinco fragmentos. El torneo te reconoce como campeón.</p>
        <div class="complete-unlocks">
          <div><span class="unlock-icon">4</span><div><b>Cuarta acción</b><p>Ahora puedes encadenar 4 cartas por ronda.</p></div></div>
          <div><span class="unlock-icon">玉</span><div><b>Poder del Jade</b><p>50 de daño en área y 20 de curación por 40 EN.</p></div></div>
          <div><span class="unlock-icon">∞</span><div><b>Modo infinito</b><p>Enfrenta rivales cada vez más preparados.</p></div></div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary btn-large" id="complete-start">Entrar al modo infinito</button>
          <button type="button" class="btn btn-ghost" id="complete-menu">Volver al menú</button>
        </div>
      </div>
    `, { className: 'complete-modal', dismissible: false, focus: '#complete-start' });
    $('#complete-start').onclick = () => {
      closeModal();
      startBattle({ intro: true });
    };
    $('#complete-menu').onclick = () => {
      closeModal();
      showTitle();
    };
  }

  function showHowTo() {
    if (App.busy) {
      showToast('Espera a que termine la ronda.');
      return;
    }
    const example = DT.getCard('kuro-claw');
    openModal(`
      <div class="howto-inner">
        <div class="howto-head">
          <p class="eyebrow"><span></span> Manual del torneo <span></span></p>
          <h2>CÓMO JUGAR</h2>
          <p>Un duelo simultáneo de lectura, energía y posicionamiento.</p>
        </div>
        <div class="howto-grid">
          <section>
            <span class="howto-num">1</span>
            <h3>Elige tus acciones</h3>
            <p>Cada ronda selecciona 3 cartas de tu mazo (4 tras completar el Jade). Se ejecutan en el orden que elijas. El rival prepara su plan en secreto.</p>
          </section>
          <section>
            <span class="howto-num">2</span>
            <h3>Prioridad de resolución</h3>
            <p>En cada acción, el <b>movimiento</b> ocurre antes que la <b>guardia</b>, y la guardia antes que el <b>ataque</b>. Si ambos atacan, el daño es simultáneo.</p>
          </section>
          <section>
            <span class="howto-num">3</span>
            <h3>Lee la cuadrícula</h3>
            <p>La carta muestra un tablero de 5×3. El centro es tu posición y las casillas marcadas son el alcance. La cuadrícula siempre mira hacia el rival.</p>
          </section>
          <section>
            <span class="howto-num">4</span>
            <h3>Administra la energía</h3>
            <p>Los ataques cuestan energía. Si no alcanza, la carta falla. Al final de cada ronda ambos recuperan <b>+15 EN</b>.</p>
          </section>
          <section>
            <span class="howto-num">5</span>
            <h3>Gana el duelo</h3>
            <p>Reduce la vida del rival a cero antes de que él lo haga contigo. Si ambos llegan a cero en la misma acción, es empate.</p>
          </section>
          <section>
            <span class="howto-num">6</span>
            <h3>Reclama el Jade</h3>
            <p>Derrota a 5 rivales para reunir los fragmentos. Cada victoria te permite añadir una carta nueva a tu mazo.</p>
          </section>
        </div>
        <div class="howto-example">
          <div class="howto-example-card">${UI.cardHTML(example, { asDiv: true })}</div>
          <div>
            <h3>Ejemplo: Zarpazo</h3>
            <p>Cuesta <b>10 EN</b>, hace <b>20 de daño</b> y golpea las tres casillas frontales. Si el rival está en cualquiera de ellas, recibe el daño; si se mueve fuera, falla.</p>
            <p class="howto-tip"><b>Consejo:</b> el movimiento se resuelve primero. Un paso atrás puede esquivar un ataque y dejar al rival sin energía.</p>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary btn-large" id="howto-close">Entendido</button>
        </div>
      </div>
    `, { className: 'howto-modal', dismissible: true, focus: '#howto-close' });
    $('#howto-close').onclick = closeModal;
  }

  function openMenu() {
    if (App.busy) {
      showToast('Espera a que termine la ronda.');
      return;
    }
    const inBattle = App.screen === 'battle' && App.campaign;
    const hasSave = !!loadSave();
    openModal(`
      <div class="menu-inner">
        <p class="eyebrow"><span></span> Pausa <span></span></p>
        <h2>MENÚ</h2>
        <div class="menu-rows">
          ${inBattle ? '<button type="button" class="menu-row" id="menu-resume"><span>Reanudar combate</span><b>→</b></button>' : ''}
          ${hasSave && !inBattle ? '<button type="button" class="menu-row" id="menu-continue"><span>Continuar torneo</span><b>→</b></button>' : ''}
          <button type="button" class="menu-row" id="menu-howto"><span>Cómo jugar</span><b>?</b></button>
          <button type="button" class="menu-row" id="menu-sound"><span>Sonido</span><b>${App.settings.sound ? 'ON' : 'OFF'}</b></button>
          <button type="button" class="menu-row" id="menu-title"><span>${inBattle ? 'Volver al título (se guarda el progreso)' : 'Volver al título'}</span><b>↩</b></button>
          ${App.campaign || hasSave ? '<button type="button" class="menu-row danger" id="menu-abandon"><span>Abandonar torneo</span><b>×</b></button>' : ''}
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="menu-close">Cerrar</button>
        </div>
      </div>
    `, { className: 'menu-modal', dismissible: true, focus: '#menu-close' });
    $('#menu-close').onclick = closeModal;
    if (inBattle) $('#menu-resume').onclick = closeModal;
    if (hasSave && !inBattle) {
      $('#menu-continue').onclick = () => {
        closeModal();
        continueCampaign();
      };
    }
    $('#menu-howto').onclick = () => {
      closeModal();
      setTimeout(showHowTo, 200);
    };
    $('#menu-sound').onclick = () => {
      toggleSound();
      closeModal();
      setTimeout(openMenu, 220);
    };
    $('#menu-title').onclick = () => {
      closeModal();
      showTitle();
    };
    const abandon = $('#menu-abandon');
    if (abandon) {
      abandon.onclick = () => {
        closeModal();
        setTimeout(confirmAbandon, 220);
      };
    }
  }

  function confirmAbandon() {
    openModal(`
      <div class="confirm-inner">
        <p class="eyebrow"><span></span> Advertencia <span></span></p>
        <h2>¿ABANDONAR EL TORNEO?</h2>
        <p>Se borrarán tu mazo, tus fragmentos y todo el progreso guardado. Esta acción no se puede deshacer.</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-danger btn-large" id="confirm-abandon">Sí, borrar progreso</button>
          <button type="button" class="btn btn-ghost" id="confirm-cancel">Cancelar</button>
        </div>
      </div>
    `, { className: 'confirm-modal', dismissible: true, focus: '#confirm-cancel' });
    $('#confirm-cancel').onclick = closeModal;
    $('#confirm-abandon').onclick = () => {
      clearSave();
      App.campaign = null;
      App.battle = null;
      App.opponent = null;
      closeModal();
      showTitle();
      showToast('Progreso borrado.');
      updateTopbar();
    };
  }

  function continueCampaign() {
    const save = loadSave();
    if (!save) {
      showToast('No hay un torneo guardado.');
      updateContinueButton();
      return;
    }
    App.campaign = save;
    App.settings.difficulty = save.difficulty || App.settings.difficulty;
    App.settings.speed = save.speed || App.settings.speed;
    App.speed = App.settings.speed;
    updateTopbar();
    if (save.pending && save.pending.type === 'reward') {
      showScreen('title');
      openRewardModal(save.pending.options);
      return;
    }
    if (save.completed && !save.endless) {
      showScreen('title');
      completeCampaign();
      return;
    }
    startBattle({ intro: true });
  }

  function showTitle() {
    closeModal();
    App.battle = null;
    App.opponent = null;
    App.currentSlot = -1;
    App.busy = false;
    App.rewardSelected = null;
    showScreen('title');
    renderTitleShowcase();
    updateContinueButton();
    updateTopbar();
  }

  function newTournament() {
    const save = loadSave();
    if (save) {
      openModal(`
        <div class="confirm-inner">
          <p class="eyebrow"><span></span> Nuevo torneo <span></span></p>
          <h2>¿REEMPLAZAR EL GUARDADO?</h2>
          <p>Ya existe un torneo en curso. Si empiezas de nuevo, perderás ese progreso.</p>
          <div class="modal-actions">
            <button type="button" class="btn btn-primary btn-large" id="new-confirm">Empezar de nuevo</button>
            <button type="button" class="btn btn-ghost" id="new-cancel">Cancelar</button>
          </div>
        </div>
      `, { className: 'confirm-modal', dismissible: true, focus: '#new-cancel' });
      $('#new-cancel').onclick = closeModal;
      $('#new-confirm').onclick = () => {
        clearSave();
        App.campaign = null;
        closeModal();
        App.selectedCharId = null;
        showSelect();
      };
      return;
    }
    App.campaign = null;
    App.selectedCharId = null;
    showSelect();
  }

  function toggleSound() {
    App.settings.sound = !App.settings.sound;
    Sound.setEnabled(App.settings.sound);
    saveSettings();
    updateSoundButton();
    if (App.settings.sound) Sound.play('click');
  }

  function toggleSpeed() {
    App.speed = App.speed === 1 ? 2 : 1;
    App.settings.speed = App.speed;
    saveSettings();
    $('#btn-speed').textContent = App.speed + '×';
    Sound.play('click');
  }

  function bindEvents() {
    $('#brand').onclick = () => {
      if (App.screen === 'battle') openMenu();
      else showTitle();
    };
    $('#btn-new').onclick = () => {
      Sound.play('click');
      newTournament();
    };
    $('#btn-continue').onclick = () => {
      Sound.play('click');
      continueCampaign();
    };
    $('#btn-how-title').onclick = showHowTo;
    $('#btn-help').onclick = showHowTo;
    $('#btn-menu').onclick = openMenu;
    $('#btn-sound').onclick = toggleSound;
    $('#btn-select-back').onclick = showTitle;
    $('#difficulty-picker').addEventListener('click', (event) => {
      const button = event.target.closest('[data-difficulty]');
      if (!button) return;
      App.settings.difficulty = button.dataset.difficulty;
      saveSettings();
      renderDifficulty();
      Sound.play('click');
    });
    $('#char-grid').addEventListener('click', (event) => {
      const card = event.target.closest('[data-char-id]');
      if (!card) return;
      if (App.selectedCharId === card.dataset.charId) return;
      App.selectedCharId = card.dataset.charId;
      renderCharGrid();
      renderCharDetail();
      Sound.play('click');
    });
    $('#hand').addEventListener('click', (event) => {
      const card = event.target.closest('[data-card-id]');
      if (!card) return;
      toggleCard(card.dataset.cardId);
    });
    $('#hand').addEventListener('pointerover', (event) => {
      const card = event.target.closest('[data-card-id]');
      if (!card) return;
      previewCard(card.dataset.cardId);
    });
    $('#hand').addEventListener('pointerleave', () => {
      if (!App.busy) clearPreviews();
    });
    $('#hand').addEventListener('focusin', (event) => {
      const card = event.target.closest('[data-card-id]');
      if (!card) return;
      previewCard(card.dataset.cardId);
    });
    $('#hand').addEventListener('focusout', () => {
      if (!App.busy) clearPreviews();
    });
    $('#action-slots').addEventListener('click', (event) => {
      if (!App.battle || App.busy || App.battle.phase !== 'planning') return;
      const slot = event.target.closest('[data-slot]');
      if (!slot) return;
      const index = Number(slot.dataset.slot);
      if (!App.battle.player.plan[index]) return;
      App.battle.player.plan.splice(index, 1);
      clearPreviews();
      renderSlots(null);
      renderHand();
      renderPlanSummary();
      renderInspect(null);
      updateControls();
      Sound.play('click');
    });
    $('#btn-execute').onclick = executeRound;
    $('#btn-clear').onclick = clearPlan;
    $('#btn-speed').onclick = toggleSpeed;
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (App.modalOpen) {
          if (App.modalDismissible) closeModal();
        } else if (App.screen === 'battle') {
          openMenu();
        }
      }
    });
    document.addEventListener('pointerdown', () => {
      Sound.setEnabled(App.settings.sound);
    }, { once: true });
  }

  function init() {
    loadSettings();
    $('#svg-defs').innerHTML = UI.shardDefs();
    Sound.setEnabled(App.settings.sound);
    updateSoundButton();
    updateContinueButton();
    renderTitleShowcase();
    bindEvents();
    showScreen('title');
    document.body.classList.add('ready');
  }

  init();
})();
