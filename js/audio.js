(function (root) {
  let ctx = null;
  let master = null;
  let enabled = true;

  function ensure() {
    if (!enabled) return null;
    if (!ctx) {
      const Ctx = root.AudioContext || root.webkitAudioContext;
      if (!Ctx) return null;
      ctx = new Ctx();
      master = ctx.createGain();
      master.gain.value = 0.18;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, duration, options) {
    const audio = ensure();
    if (!audio) return;
    const opts = options || {};
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, audio.currentTime);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), audio.currentTime + duration);
    const peak = (opts.gain === undefined ? 0.35 : opts.gain);
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(peak, audio.currentTime + Math.min(0.02, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(audio.currentTime + duration + 0.02);
  }

  function noise(duration, options) {
    const audio = ensure();
    if (!audio) return;
    const opts = options || {};
    const size = Math.max(1, Math.floor(audio.sampleRate * duration));
    const buffer = audio.createBuffer(1, size, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / size);
    }
    const src = audio.createBufferSource();
    src.buffer = buffer;
    const filter = audio.createBiquadFilter();
    filter.type = opts.filter || 'bandpass';
    filter.frequency.value = opts.freq || 900;
    filter.Q.value = opts.q || 0.9;
    const gain = audio.createGain();
    gain.gain.value = opts.gain === undefined ? 0.35 : opts.gain;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start();
  }

  function play(name) {
    if (!enabled) return;
    switch (name) {
      case 'click':
        tone(420, 0.05, { type: 'square', gain: 0.12, to: 320 });
        break;
      case 'hover':
        tone(760, 0.03, { type: 'sine', gain: 0.05 });
        break;
      case 'select':
        tone(520, 0.08, { type: 'triangle', gain: 0.16 });
        setTimeout(() => tone(780, 0.09, { type: 'triangle', gain: 0.12 }), 60);
        break;
      case 'flip':
        noise(0.08, { freq: 2200, gain: 0.12 });
        tone(340, 0.06, { type: 'triangle', gain: 0.08 });
        break;
      case 'move':
        noise(0.22, { freq: 1400, gain: 0.14, q: 1.4 });
        break;
      case 'hit':
        noise(0.16, { filter: 'lowpass', freq: 700, gain: 0.5 });
        tone(120, 0.18, { type: 'sine', gain: 0.4, to: 48 });
        break;
      case 'block':
        tone(940, 0.1, { type: 'square', gain: 0.12, to: 620 });
        noise(0.08, { freq: 2600, gain: 0.1 });
        break;
      case 'heal':
        [440, 554, 659].forEach((f, i) => setTimeout(() => tone(f, 0.16, { type: 'sine', gain: 0.14 }), i * 60));
        break;
      case 'energy':
        tone(660, 0.12, { type: 'triangle', gain: 0.12, to: 990 });
        break;
      case 'guard':
        tone(300, 0.16, { type: 'triangle', gain: 0.12, to: 240 });
        break;
      case 'execute':
        tone(90, 0.32, { type: 'sine', gain: 0.5, to: 45 });
        noise(0.22, { filter: 'lowpass', freq: 400, gain: 0.28 });
        break;
      case 'round':
        tone(196, 0.3, { type: 'sine', gain: 0.18 });
        setTimeout(() => tone(294, 0.36, { type: 'sine', gain: 0.14 }), 110);
        break;
      case 'win':
        [392, 494, 587, 784].forEach((f, i) => setTimeout(() => tone(f, 0.28, { type: 'triangle', gain: 0.18 }), i * 110));
        break;
      case 'lose':
        [330, 262, 208, 156].forEach((f, i) => setTimeout(() => tone(f, 0.32, { type: 'sine', gain: 0.16 }), i * 130));
        break;
      case 'shard':
        [880, 1174, 1568].forEach((f, i) => setTimeout(() => tone(f, 0.22, { type: 'sine', gain: 0.13 }), i * 90));
        break;
      case 'fizzle':
        tone(180, 0.18, { type: 'sawtooth', gain: 0.1, to: 90 });
        break;
      default:
        tone(500, 0.05, { type: 'sine', gain: 0.08 });
    }
  }

  function setEnabled(value) {
    enabled = !!value;
  }

  function isEnabled() {
    return enabled;
  }

  root.Sound = { play, setEnabled, isEnabled };
})(typeof window !== 'undefined' ? window : globalThis);
