(function (root) {
  const DT = root.DT;
  let portraitSeq = 0;

  const TONE_COLORS = {
    red: { a: '#c8443b', b: '#5c1b20', c: '#ff8b72' },
    ivory: { a: '#eadfc4', b: '#7d4b3c', c: '#fff3d2' },
    violet: { a: '#7d5ac8', b: '#2a1b4a', c: '#c3a6ff' },
    teal: { a: '#3fa79c', b: '#123c42', c: '#8ee6d6' },
    jade: { a: '#60b98b', b: '#173b32', c: '#b8f0c8' },
    blue: { a: '#4c7fd0', b: '#172a52', c: '#9fc7ff' },
    gold: { a: '#d8a94a', b: '#5b3a16', c: '#ffe2a0' },
    silver: { a: '#b8c1cf', b: '#3b4350', c: '#f3f6fb' },
    ink: { a: '#6d7085', b: '#232434', c: '#c1c5d8' }
  };

  function portrait(id) {
    const n = portraitSeq += 1;
    const p = 'p' + n;
    const tone = DT.character(id) ? DT.character(id).tone : 'ink';
    const colors = TONE_COLORS[tone] || TONE_COLORS.ink;
    const commonOpen = `
      <svg viewBox="0 0 120 120" class="portrait-svg" role="img" aria-hidden="true">
        <defs>
          <radialGradient id="${p}bg" cx="50%" cy="38%" r="70%">
            <stop offset="0%" stop-color="${colors.a}" stop-opacity="0.95"/>
            <stop offset="58%" stop-color="${colors.b}" stop-opacity="0.98"/>
            <stop offset="100%" stop-color="#090811"/>
          </radialGradient>
          <linearGradient id="${p}skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f6d3ab"/>
            <stop offset="100%" stop-color="#d99e77"/>
          </linearGradient>
          <linearGradient id="${p}hair" x1="0" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stop-color="${colors.c}"/>
            <stop offset="100%" stop-color="${colors.b}"/>
          </linearGradient>
          <linearGradient id="${p}robe" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${colors.b}"/>
            <stop offset="100%" stop-color="#0d0b15"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#${p}bg)"/>
        <circle cx="60" cy="60" r="54" fill="none" stroke="${colors.c}" stroke-opacity="0.32" stroke-width="1"/>
        <circle cx="60" cy="60" r="48" fill="none" stroke="${colors.c}" stroke-opacity="0.12" stroke-width="8"/>
    `;
    const commonClose = `
        <rect x="12" y="12" width="96" height="96" rx="48" fill="none" stroke="#0a0810" stroke-opacity="0.35"/>
      </svg>
    `;
    const bodies = {
      kurogane: `
        <path d="M12 122 L20 94 Q28 82 43 78 L77 78 Q92 82 100 94 L108 122 Z" fill="url(#${p}robe)"/>
        <path d="M43 79 L60 92 L77 79 L72 74 L60 84 L48 74 Z" fill="#f0e5cd" opacity="0.9"/>
        <path d="M54 72 h12 v14 h-12 z" fill="url(#${p}skin)"/>
        <path d="M34 54 Q30 22 60 16 Q90 22 86 56 Q86 76 60 80 Q34 76 34 54 Z" fill="url(#${p}hair)"/>
        <path d="M42 34 L34 14 L50 24 Z" fill="url(#${p}hair)"/>
        <path d="M78 34 L86 14 L70 24 Z" fill="url(#${p}hair)"/>
        <path d="M39 54 Q39 33 60 32 Q81 33 81 54 Q81 74 60 77 Q39 74 39 54 Z" fill="url(#${p}skin)"/>
        <path d="M38 48 Q43 28 60 29 Q77 28 82 48 Q72 40 60 42 Q48 40 38 48 Z" fill="url(#${p}hair)"/>
        <path d="M43 56 Q49 53 55 56" fill="none" stroke="#3b1d22" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M65 56 Q71 53 77 56" fill="none" stroke="#3b1d22" stroke-width="2.4" stroke-linecap="round"/>
        <ellipse cx="50" cy="59" rx="2.6" ry="3.2" fill="#f3b33d"/>
        <ellipse cx="70" cy="59" rx="2.6" ry="3.2" fill="#f3b33d"/>
        <path d="M45 66 L53 64 M75 66 L67 64" stroke="#9b4a43" stroke-width="2" stroke-linecap="round"/>
        <path d="M56 70 Q60 73 64 70" fill="none" stroke="#6b2e35" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M44 63 L51 61 M76 63 L69 61" stroke="#a13b37" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M84 116 L99 78 L104 80 L90 118 Z" fill="#2a2b39"/>
        <path d="M97 76 L110 66 L113 70 L101 81 Z" fill="#c9cedb"/>
        <path d="M94 84 L106 81" stroke="#d8a94a" stroke-width="3"/>
      `,
      aiko: `
        <path d="M106 24 Q124 48 104 82" fill="none" stroke="#7c4a2e" stroke-width="4"/>
        <path d="M106 24 Q124 48 104 82" fill="none" stroke="#d8a94a" stroke-width="1" stroke-opacity="0.7"/>
        <path d="M34 54 Q26 18 60 14 Q94 18 86 54 L92 92 L28 92 Z" fill="#17131f"/>
        <path d="M16 122 L26 94 Q34 84 45 80 L75 80 Q86 84 94 94 L104 122 Z" fill="#f1ead8"/>
        <path d="M45 80 L60 96 L75 80 L70 76 L60 86 L50 76 Z" fill="#b33d3c"/>
        <path d="M54 72 h12 v14 h-12 z" fill="url(#${p}skin)"/>
        <path d="M38 54 Q38 32 60 31 Q82 32 82 54 Q82 75 60 78 Q38 75 38 54 Z" fill="url(#${p}skin)"/>
        <path d="M36 48 Q44 26 60 27 Q76 26 84 48 Q74 38 60 40 Q46 38 36 48 Z" fill="#1b1622"/>
        <path d="M30 44 Q34 20 60 18 Q86 20 90 44 L82 40 Q74 28 60 30 Q46 28 38 40 Z" fill="#211a2b"/>
        <path d="M44 57 Q50 54 56 57" fill="none" stroke="#2b2024" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M64 57 Q70 54 76 57" fill="none" stroke="#2b2024" stroke-width="2.2" stroke-linecap="round"/>
        <ellipse cx="50" cy="60" rx="2.3" ry="2.9" fill="#3b2b31"/>
        <ellipse cx="70" cy="60" rx="2.3" ry="2.9" fill="#3b2b31"/>
        <path d="M56 69 Q60 71 64 69" fill="none" stroke="#a85d58" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M83 82 L94 78 L96 106 L85 108 Z" fill="#efe6cf" opacity="0.92"/>
        <path d="M87 88 h5 M87 93 h5 M87 98 h3" stroke="#a8423f" stroke-width="1.4"/>
      `,
      ren: `
        <path d="M91 18 Q104 18 104 31 Q104 44 91 44 Q78 44 78 31 Q78 18 91 31" fill="none" stroke="#c9a85a" stroke-width="3"/>
        <path d="M90 42 L82 122" stroke="#6a472a" stroke-width="3"/>
        <path d="M14 122 L24 94 Q32 84 44 80 L76 80 Q88 84 96 94 L106 122 Z" fill="url(#${p}robe)"/>
        <path d="M44 81 L60 98 L76 81 L70 76 L60 87 L50 76 Z" fill="#d8a94a" opacity="0.72"/>
        <path d="M54 72 h12 v14 h-12 z" fill="url(#${p}skin)"/>
        <path d="M38 54 Q38 33 60 32 Q82 33 82 54 Q82 74 60 77 Q38 74 38 54 Z" fill="url(#${p}skin)"/>
        <path d="M36 50 Q42 28 60 27 Q78 28 84 50 Q74 40 60 42 Q46 40 36 50 Z" fill="#241a2d"/>
        <path d="M50 24 Q53 14 60 14 Q67 14 70 24 L66 30 L54 30 Z" fill="#241a2d"/>
        <path d="M45 56 Q51 53 56 56" fill="none" stroke="#2b2024" stroke-width="2.1" stroke-linecap="round"/>
        <path d="M64 56 Q69 53 75 56" fill="none" stroke="#2b2024" stroke-width="2.1" stroke-linecap="round"/>
        <ellipse cx="50" cy="59" rx="2.3" ry="2.8" fill="#3e2a45"/>
        <ellipse cx="70" cy="59" rx="2.3" ry="2.8" fill="#3e2a45"/>
        <path d="M55 69 Q61 73 66 68" fill="none" stroke="#8d4c4c" stroke-width="1.7" stroke-linecap="round"/>
        <circle cx="45" cy="84" r="3" fill="#c9a85a"/><circle cx="52" cy="88" r="3" fill="#c9a85a"/>
        <circle cx="60" cy="90" r="3" fill="#c9a85a"/><circle cx="68" cy="88" r="3" fill="#c9a85a"/>
        <circle cx="75" cy="84" r="3" fill="#c9a85a"/>
      `,
      suzu: `
        <path d="M24 34 Q6 50 26 74 L36 68 Q22 50 34 40 Z" fill="#c7a35d"/>
        <path d="M96 34 Q114 50 94 74 L84 68 Q98 50 86 40 Z" fill="#c7a35d"/>
        <path d="M60 20 Q76 10 82 26 Q92 40 82 62 L78 90 L42 90 L38 62 Q28 40 38 26 Q44 10 60 20 Z" fill="#5a3a2a"/>
        <path d="M14 122 L24 94 Q32 82 44 79 L76 79 Q88 82 96 94 L106 122 Z" fill="#2b4a4c"/>
        <path d="M28 92 Q34 80 44 78 L50 92 L40 104 Z" fill="#3f8e86"/>
        <path d="M92 92 Q86 80 76 78 L70 92 L80 104 Z" fill="#3f8e86"/>
        <path d="M28 94 Q44 82 60 92 Q76 82 92 94 L86 104 Q72 94 60 102 Q48 94 34 104 Z" fill="#d9c7a2"/>
        <path d="M54 72 h12 v14 h-12 z" fill="url(#${p}skin)"/>
        <path d="M38 54 Q38 33 60 32 Q82 33 82 54 Q82 74 60 77 Q38 74 38 54 Z" fill="url(#${p}skin)"/>
        <path d="M35 49 Q41 27 60 26 Q79 27 85 49 Q72 39 60 41 Q48 39 35 49 Z" fill="#5a3a2a"/>
        <path d="M37 38 Q60 22 83 38 L80 44 Q60 31 40 44 Z" fill="#7d2f2f"/>
        <path d="M44 57 Q50 54 56 57" fill="none" stroke="#3b241e" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M64 57 Q70 54 76 57" fill="none" stroke="#3b241e" stroke-width="2.2" stroke-linecap="round"/>
        <ellipse cx="50" cy="60" rx="2.4" ry="2.9" fill="#385f5b"/>
        <ellipse cx="70" cy="60" rx="2.4" ry="2.9" fill="#385f5b"/>
        <path d="M56 69 Q60 71 65 68" fill="none" stroke="#8d4c4c" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M46 47 L53 45" stroke="#7d2f2f" stroke-width="2" stroke-linecap="round"/>
      `,
      kaze: `
        <path d="M88 70 Q112 58 108 34 Q104 18 92 24 Q98 40 82 54 Z" fill="#e9dcc0" opacity="0.9"/>
        <path d="M92 34 L108 28 M94 42 L110 40 M94 50 L108 52" stroke="#6b8f70" stroke-width="1.6"/>
        <path d="M14 122 L24 94 Q32 83 44 79 L76 79 Q88 83 96 94 L106 122 Z" fill="#245044"/>
        <path d="M44 80 L60 98 L76 80 L70 75 L60 87 L50 75 Z" fill="#e9dcc0" opacity="0.85"/>
        <path d="M54 72 h12 v14 h-12 z" fill="url(#${p}skin)"/>
        <path d="M35 50 Q32 22 60 18 Q88 22 85 50 Q88 66 82 72 L38 72 Q32 66 35 50 Z" fill="#e5e0d3"/>
        <path d="M38 54 Q38 33 60 32 Q82 33 82 54 Q82 74 60 77 Q38 74 38 54 Z" fill="url(#${p}skin)"/>
        <path d="M37 48 Q42 28 60 27 Q78 28 83 48 Q72 38 60 40 Q48 38 37 48 Z" fill="#f1eee5"/>
        <path d="M36 52 Q30 60 35 68 Q38 60 40 56 Z" fill="#f1eee5"/>
        <path d="M84 52 Q90 60 85 68 Q82 60 80 56 Z" fill="#f1eee5"/>
        <path d="M44 57 Q50 54 56 57" fill="none" stroke="#3d2c35" stroke-width="2" stroke-linecap="round"/>
        <path d="M64 57 Q70 54 76 57" fill="none" stroke="#3d2c35" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="50" cy="60" rx="2.2" ry="2.8" fill="#3f7b65"/>
        <ellipse cx="70" cy="60" rx="2.2" ry="2.8" fill="#3f7b65"/>
        <path d="M56 69 Q60 71 64 69" fill="none" stroke="#a85d58" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M46 61 L52 60 M74 61 L68 60" stroke="#b2443f" stroke-width="2" stroke-linecap="round"/>
        <path d="M74 24 Q82 18 86 26 Q80 28 76 32 Z" fill="#b2443f" opacity="0.8"/>
      `,
      ryu: `
        <circle cx="60" cy="52" r="40" fill="#d8c794" opacity="0.12"/>
        <path d="M14 122 L24 94 Q32 82 44 78 L76 78 Q88 82 96 94 L106 122 Z" fill="#1e2b48"/>
        <path d="M30 90 Q44 78 60 88 Q76 78 90 90 L84 100 Q70 90 60 98 Q50 90 36 100 Z" fill="#b8c1cf"/>
        <path d="M54 72 h12 v14 h-12 z" fill="url(#${p}skin)"/>
        <path d="M34 54 Q30 24 60 18 Q90 24 86 54 Q86 76 60 80 Q34 76 34 54 Z" fill="url(#${p}hair)"/>
        <path d="M40 32 L32 12 L52 24 Z" fill="url(#${p}hair)"/>
        <path d="M80 32 L88 12 L68 24 Z" fill="url(#${p}hair)"/>
        <path d="M39 55 Q39 34 60 33 Q81 34 81 55 Q81 75 60 78 Q39 75 39 55 Z" fill="url(#${p}skin)"/>
        <path d="M38 48 Q44 27 60 28 Q76 27 82 48 Q71 39 60 41 Q49 39 38 48 Z" fill="url(#${p}hair)"/>
        <path d="M43 56 Q49 53 55 56" fill="none" stroke="#2c2333" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M65 56 Q71 53 77 56" fill="none" stroke="#2c2333" stroke-width="2.2" stroke-linecap="round"/>
        <ellipse cx="50" cy="59" rx="2.5" ry="3" fill="#e4b04b"/>
        <ellipse cx="70" cy="59" rx="2.5" ry="3" fill="#e4b04b"/>
        <path d="M62 64 L58 64 L60 67 Z" fill="#8b4a45"/>
        <path d="M55 70 Q60 74 65 70" fill="none" stroke="#6b2e35" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M46 46 L54 44 M74 46 L66 44" stroke="#9aa8bd" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M76 62 L84 58" stroke="#a13b37" stroke-width="2" stroke-linecap="round"/>
      `,
      seiryu: `
        <path d="M26 102 Q2 70 30 40 Q52 18 86 26" fill="none" stroke="#ffe2a0" stroke-width="2.4" stroke-opacity="0.8"/>
        <path d="M14 122 L24 94 Q32 82 44 78 L76 78 Q88 82 96 94 L106 122 Z" fill="#e7e0d2"/>
        <path d="M28 92 Q42 80 60 90 Q78 80 92 92 L86 104 Q72 94 60 102 Q48 94 34 104 Z" fill="#d8a94a"/>
        <path d="M54 72 h12 v14 h-12 z" fill="url(#${p}skin)"/>
        <path d="M32 52 Q28 18 60 14 Q92 18 88 52 L96 102 L24 102 Z" fill="#f0eee7"/>
        <path d="M39 54 Q39 33 60 32 Q81 33 81 54 Q81 74 60 77 Q39 74 39 54 Z" fill="url(#${p}skin)"/>
        <path d="M37 48 Q43 27 60 26 Q77 27 83 48 Q72 38 60 40 Q48 38 37 48 Z" fill="#f5f2ea"/>
        <path d="M35 38 L29 16 L43 28 Z" fill="#f5f2ea"/>
        <path d="M85 38 L91 16 L77 28 Z" fill="#f5f2ea"/>
        <path d="M44 57 Q50 54 56 57" fill="none" stroke="#3d3532" stroke-width="2" stroke-linecap="round"/>
        <path d="M64 57 Q70 54 76 57" fill="none" stroke="#3d3532" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="50" cy="60" rx="2.2" ry="2.8" fill="#b88a3d"/>
        <ellipse cx="70" cy="60" rx="2.2" ry="2.8" fill="#b88a3d"/>
        <path d="M56 69 Q60 71 64 69" fill="none" stroke="#9c5f58" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M56 33 Q60 30 64 33 L61 36 L59 36 Z" fill="#d8a94a"/>
        <path d="M60 44 L60 50" stroke="#c9a85a" stroke-width="1.4" stroke-opacity="0.8"/>
      `,
      muraki: `
        <path d="M22 88 Q4 60 22 34 Q34 16 52 18" fill="none" stroke="#7d5ac8" stroke-width="3" stroke-opacity="0.55"/>
        <path d="M96 80 Q116 50 100 26 Q90 14 74 18" fill="none" stroke="#60b98b" stroke-width="2.5" stroke-opacity="0.38"/>
        <path d="M14 122 L24 94 Q32 82 44 78 L76 78 Q88 82 96 94 L106 122 Z" fill="#1a1426"/>
        <path d="M44 79 L60 96 L76 79 L70 74 L60 86 L50 74 Z" fill="#5f3f8f" opacity="0.55"/>
        <path d="M54 72 h12 v14 h-12 z" fill="#e8c6a8"/>
        <path d="M34 54 Q26 20 60 14 Q94 20 86 54 L94 100 L26 100 Z" fill="#151220"/>
        <path d="M39 54 Q39 33 60 32 Q81 33 81 54 Q81 75 60 78 Q39 75 39 54 Z" fill="#e8c6a8"/>
        <path d="M37 48 Q42 27 60 26 Q78 27 83 48 Q72 37 60 39 Q48 37 37 48 Z" fill="#151220"/>
        <path d="M44 57 Q50 53 56 56" fill="none" stroke="#3b2430" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M64 57 Q70 53 76 56" fill="none" stroke="#3b2430" stroke-width="2.2" stroke-linecap="round"/>
        <ellipse cx="50" cy="60" rx="2.4" ry="2.9" fill="#b53d55"/>
        <ellipse cx="70" cy="60" rx="2.4" ry="2.9" fill="#b53d55"/>
        <path d="M55 69 Q61 73 66 68" fill="none" stroke="#7d3c4b" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M46 46 L53 44 M74 46 L67 44" stroke="#4b2b4e" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M82 82 Q92 70 98 76 Q92 82 88 94 Z" fill="#60b98b" opacity="0.34"/>
      `
    };
    return `<div class="portrait tone-${tone}">${commonOpen}${bodies[id] || bodies.kurogane}${commonClose}</div>`;
  }

  const ICONS = {
    slash: '<path d="M12 36 L35 11 M17 39 L39 17" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M10 31 L28 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".55"/>',
    claw: '<path d="M13 36 Q20 20 38 11 M19 39 Q26 22 42 17 M9 31 Q16 18 29 10" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" fill="none"/>',
    fang: '<path d="M14 14 L21 36 L27 19 Z M34 14 L27 36 L21 19 Z" fill="currentColor" opacity=".9"/>',
    arrow: '<path d="M9 24 Q20 7 31 24" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M20 12 L40 36 M33 36 L40 36 L40 29" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
    arrowRain: '<path d="M8 12 L16 38 M20 8 L28 34 M32 12 L40 38" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M4 32 L16 42 M16 28 L28 38 M28 32 L40 42" stroke="currentColor" stroke-width="2" opacity=".5" stroke-linecap="round"/>',
    cross: '<path d="M24 5 L24 43 M5 24 L43 24" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="24" r="7" fill="none" stroke="currentColor" stroke-width="2"/>',
    sun: '<circle cx="24" cy="24" r="8" fill="none" stroke="currentColor" stroke-width="3"/><path d="M24 3v7M24 38v7M3 24h7M38 24h7M9 9l5 5M34 34l5 5M39 9l-5 5M14 34l-5 5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    star: '<path d="M24 3 L29 19 L45 24 L29 29 L24 45 L19 29 L3 24 L19 19 Z" fill="currentColor"/><circle cx="24" cy="24" r="4" fill="#12101c"/>',
    staff: '<path d="M24 43 L24 17" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="24" cy="12" r="2.5" fill="currentColor"/>',
    fist: '<path d="M12 20 Q12 12 20 12 L28 12 Q36 12 36 20 L36 30 Q36 38 28 38 L20 38 Q12 38 12 30 Z" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M18 18v10M24 17v12M30 18v10" stroke="currentColor" stroke-width="2" opacity=".7"/>',
    vortex: '<path d="M24 7 Q41 7 41 24 Q41 40 24 40 Q9 40 9 25 Q9 13 23 13 Q34 13 34 24 Q34 33 24 33 Q18 33 18 25" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    scroll: '<rect x="12" y="9" width="24" height="30" rx="2" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M18 17h12M18 23h12M18 29h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 9h32M8 39h32" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    wave: '<path d="M5 18 Q12 10 19 18 T33 18 T47 18 M5 28 Q12 20 19 28 T33 28 T47 28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    boomerang: '<path d="M8 10 L22 38 L40 16" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 15 L22 31 L33 18" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".55"/>',
    chain: '<circle cx="14" cy="24" r="6" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="24" cy="24" r="6" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="34" cy="24" r="6" fill="none" stroke="currentColor" stroke-width="2.6"/>',
    cat: '<path d="M12 19 L10 7 L20 13 M36 19 L38 7 L28 13" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/><path d="M11 24 Q11 13 24 13 Q37 13 37 24 Q37 38 24 41 Q11 38 11 24 Z" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M19 24h2M27 24h2M22 30h4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    fan: '<path d="M24 40 L6 15 Q24 2 42 15 Z" fill="none" stroke="currentColor" stroke-width="2.8"/><path d="M24 40 L12 13 M24 40 L24 7 M24 40 L36 13" stroke="currentColor" stroke-width="1.8" opacity=".7"/>',
    petal: '<path d="M24 5 Q34 14 24 24 Q14 14 24 5 Z M24 43 Q14 34 24 24 Q34 34 24 43 Z M5 24 Q14 14 24 24 Q14 34 5 24 Z M43 24 Q34 14 24 24 Q34 34 43 24 Z" fill="currentColor" opacity=".9"/>',
    dragon: '<path d="M6 34 Q16 8 26 24 Q34 38 43 12" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M39 9 L45 12 L41 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M14 31 L20 27 M22 20 L28 16" stroke="currentColor" stroke-width="2" opacity=".6"/>',
    feather: '<path d="M38 8 Q16 12 9 39 Q28 38 38 8 Z" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M12 36 L33 13 M17 31 L18 22 M24 26 L25 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    wolf: '<path d="M10 16 L14 4 L22 12 Q24 10 26 12 L34 4 L38 16 Q42 24 36 34 Q31 43 24 43 Q17 43 12 34 Q6 24 10 16 Z" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M18 24l3 2M30 24l-3 2M20 34l4-3 4 3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    moon: '<path d="M31 6 Q13 10 13 24 Q13 38 31 42 Q19 34 19 24 Q19 14 31 6 Z" fill="currentColor"/>',
    whip: '<path d="M7 37 Q16 10 29 15 Q42 20 37 33" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M33 38 L37 33 L42 37" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15 26 L20 24" stroke="currentColor" stroke-width="2"/>',
    lightning: '<path d="M27 3 L10 27 L22 27 L18 45 L38 18 L25 18 Z" fill="currentColor" opacity=".92"/>',
    cloud: '<path d="M11 34 Q5 34 5 28 Q5 21 13 21 Q14 11 24 11 Q33 11 35 20 Q43 20 43 28 Q43 34 36 34 Z" fill="none" stroke="currentColor" stroke-width="2.6"/>',
    vine: '<path d="M24 43 Q24 26 14 16 Q6 8 16 5 Q28 2 28 16 Q28 28 20 30 Q14 32 16 38" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="M14 14 Q8 8 12 5 M25 20 Q33 14 38 18" fill="none" stroke="currentColor" stroke-width="2.2"/>',
    eye: '<path d="M4 24 Q14 9 24 9 Q34 9 44 24 Q34 39 24 39 Q14 39 4 24 Z" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="24" cy="24" r="7" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="24" cy="24" r="2.5" fill="currentColor"/>',
    portal: '<ellipse cx="24" cy="24" rx="18" ry="9" fill="none" stroke="currentColor" stroke-width="2.5"/><ellipse cx="24" cy="24" rx="11" ry="5" fill="none" stroke="currentColor" stroke-width="2" opacity=".7"/><ellipse cx="24" cy="24" rx="4" ry="2" fill="currentColor"/>',
    fox: '<path d="M8 10 L16 20 L24 12 L32 20 L40 10 L38 30 Q31 42 24 42 Q17 42 10 30 Z" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M18 26l3 2M30 26l-3 2M22 34l2 2 2-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    imp: '<path d="M13 42 Q10 24 18 15 L14 4 L24 12 L34 4 L30 15 Q38 24 35 42 Z" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M19 26h2M27 26h2M20 34h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    demon: '<path d="M8 42 Q6 20 17 10 L12 2 L25 9 L38 2 L33 10 Q44 20 42 42 Z" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M17 24l4 3M33 24l-4 3M18 34l6 4 6-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    jade: '<path d="M24 3 L39 15 L33 42 L15 42 L9 15 Z" fill="currentColor" opacity=".85"/><path d="M24 3 L24 42 M9 15 L24 22 L39 15" fill="none" stroke="#12101c" stroke-width="1.6" opacity=".5"/>',
    shield: '<path d="M24 4 L40 10 Q40 30 24 44 Q8 30 8 10 Z" fill="none" stroke="currentColor" stroke-width="2.8"/><path d="M24 12 L24 34 M16 20 L32 20" stroke="currentColor" stroke-width="2" opacity=".6"/>',
    orb: '<circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M14 28 Q20 12 30 20 Q38 27 27 34 Q18 38 18 27" fill="none" stroke="currentColor" stroke-width="2.2"/>',
    lotus: '<path d="M24 42 Q6 34 12 18 Q22 24 24 42 Q26 24 36 18 Q42 34 24 42 Z" fill="none" stroke="currentColor" stroke-width="2.3"/><path d="M24 42 Q16 24 24 8 Q32 24 24 42 Z" fill="none" stroke="currentColor" stroke-width="2.3"/>',
    step: '<path d="M7 24 H34 M27 15 L39 24 L27 33" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 12v24" stroke="currentColor" stroke-width="2" opacity=".4"/>',
    stepBack: '<path d="M41 24 H14 M21 15 L9 24 L21 33" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 12v24" stroke="currentColor" stroke-width="2" opacity=".4"/>',
    up: '<path d="M24 41 V12 M14 21 L24 9 L34 21" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>',
    down: '<path d="M24 7 V36 M14 27 L24 39 L34 27" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'
  };

  function icon(name) {
    return ICONS[name] || ICONS.slash;
  }

  function patternGrid(card, opts) {
    const options = opts || {};
    const facing = options.facing || 1;
    const cells = card.damage ? DT.displayPattern(card, facing) : [];
    const move = card.kind === 'move' ? DT.displayMove(card, facing) : null;
    let html = '<div class="pattern-grid" aria-hidden="true">';
    for (let y = 0; y < 3; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        const isCenter = x === 2 && y === 1;
        const isHit = cells.some((cell) => cell.x === x && cell.y === y);
        const isMove = move && move.x === x && move.y === y;
        const classes = ['pcell'];
        if (isHit) classes.push('hit');
        if (isMove) classes.push('move');
        if (isCenter) classes.push('center');
        html += `<span class="${classes.join(' ')}"></span>`;
      }
    }
    html += '</div>';
    return html;
  }

  function statLine(card) {
    const parts = [];
    if (card.damage) parts.push(`<span class="stat dmg">${card.damage}</span>`);
    if (card.guard) parts.push(`<span class="stat guard">${card.guard === 'all' ? '∞' : card.guard}</span>`);
    if (card.heal) parts.push(`<span class="stat heal">+${card.heal}</span>`);
    if (card.gain) parts.push(`<span class="stat energy">+${card.gain}</span>`);
    if (card.drain) parts.push(`<span class="stat drain">↺${card.drain}</span>`);
    return parts.join('');
  }

  function costLabel(card) {
    return card.cost ? `${card.cost}` : '0';
  }

  function cardHTML(card, opts) {
    const options = opts || {};
    const classes = ['card', 'tone-' + card.tone];
    if (card.rarity === 'rare') classes.push('rare');
    if (card.rarity === 'legend') classes.push('legend');
    if (options.selected) classes.push('selected');
    if (options.disabled) classes.push('disabled');
    if (options.compact) classes.push('compact');
    if (options.mini) classes.push('mini');
    const order = options.order ? `<span class="card-order">${options.order}</span>` : '';
    const data = options.cardId ? `data-card-id="${options.cardId}"` : '';
    const tag = options.asDiv ? 'div' : 'button';
    return `
      <${tag} class="${classes.join(' ')}" ${tag === 'button' ? 'type="button"' : ''} ${data}>
        <span class="card-cost" title="Coste de energía">${costLabel(card)}<small>EN</small></span>
        <div class="card-art">
          <svg viewBox="0 0 48 48" class="art-glyph" aria-hidden="true">${icon(card.icon)}</svg>
          <span class="art-sheen"></span>
        </div>
        <div class="card-name">${card.name}</div>
        <div class="card-sub">${card.label}</div>
        <div class="card-stats">${statLine(card)}</div>
        ${patternGrid(card)}
        ${order}
      </${tag}>
    `;
  }

  function miniCardHTML(card, opts) {
    const options = opts || {};
    return `
      <div class="mini-card tone-${card.tone} ${options.revealed ? 'revealed' : ''}">
        <span class="mini-cost">${costLabel(card)}</span>
        <svg viewBox="0 0 48 48" class="mini-glyph" aria-hidden="true">${icon(card.icon)}</svg>
        <span class="mini-name">${card.name}</span>
        <span class="mini-stat">${card.damage ? card.damage + ' DMG' : card.guard ? 'GUARDIA' : card.heal ? 'CURA' : card.gain ? 'ENERGÍA' : 'MUEVE'}</span>
      </div>
    `;
  }

  function cardBackHTML(label) {
    return `<div class="mini-card card-back" aria-label="${label || 'Carta oculta'}"><span class="back-seal">影</span></div>`;
  }

  function shardSVG(filled) {
    return `<svg viewBox="0 0 24 30" class="shard ${filled ? 'filled' : ''}" aria-hidden="true"><polygon points="12,1 22,10 12,29 2,10" fill="${filled ? 'url(#shardGrad)' : 'none'}" stroke="currentColor" stroke-width="1.3"/><path d="M12 1 L12 29 M2 10 L12 14 L22 10" fill="none" stroke="currentColor" stroke-width="0.8" opacity=".7"/></svg>`;
  }

  function shardTrack(count, total) {
    let html = '<div class="shard-track" aria-label="Fragmentos del Jade">';
    for (let i = 0; i < (total || 5); i += 1) {
      html += `<span class="shard-slot ${i < count ? 'earned' : ''}">${shardSVG(i < count)}</span>`;
    }
    html += '</div>';
    return html;
  }

  function fighterHUD(fighter, side, flags) {
    const options = flags || {};
    const data = DT.character(fighter.characterId);
    const hpPct = Math.max(0, (fighter.hp / fighter.maxHp) * 100);
    const enPct = Math.max(0, (fighter.energy / fighter.maxEnergy) * 100);
    return `
      <div class="fighter-hud tone-${data.tone} side-${side}" data-side="${side}">
        <div class="hud-portrait">${portrait(fighter.characterId)}</div>
        <div class="hud-body">
          <div class="hud-top">
            <div>
              <div class="hud-name">${fighter.name}</div>
              <div class="hud-title">${options.showTitle === false ? '' : data.title}</div>
            </div>
            <div class="hud-badge">${options.badge || ''}</div>
          </div>
          <div class="bar-row">
            <span class="bar-label">VIDA</span>
            <div class="bar hp"><span class="fill" style="width:${hpPct}%"></span><b>${Math.ceil(fighter.hp)} / ${fighter.maxHp}</b></div>
          </div>
          <div class="bar-row">
            <span class="bar-label">ENERGÍA</span>
            <div class="bar en"><span class="fill" style="width:${enPct}%"></span><b>${Math.ceil(fighter.energy)} / ${fighter.maxEnergy}</b></div>
          </div>
        </div>
      </div>
    `;
  }

  function characterCard(character, selected) {
    return `
      <button type="button" class="char-card tone-${character.tone} ${selected ? 'selected' : ''}" data-char-id="${character.id}">
        <div class="char-portrait">${portrait(character.id)}</div>
        <div class="char-info">
          <div class="char-name">${character.name}</div>
          <div class="char-title">${character.title}</div>
          <div class="char-style">${character.style}</div>
          <div class="char-bars">
            <span><i>VIDA</i>${character.hp}</span>
            <span><i>EN</i>${character.energy}</span>
          </div>
        </div>
        <div class="char-select-glow"></div>
      </button>
    `;
  }

  function boardHTML() {
    let tiles = '';
    for (let y = 0; y < 3; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        tiles += `<div class="tile" data-x="${x}" data-y="${y}"><span class="tile-mark"></span></div>`;
      }
    }
    return `
      <div class="board" id="board">
        ${tiles}
        <div class="board-vignette"></div>
        <div class="token token-player" id="token-player">
          <div class="token-ring"><div class="token-portrait" id="token-player-portrait"></div></div>
          <span class="token-flag">TÚ</span>
        </div>
        <div class="token token-enemy" id="token-enemy">
          <div class="token-ring"><div class="token-portrait" id="token-enemy-portrait"></div></div>
          <span class="token-flag">RIVAL</span>
        </div>
        <div class="board-fx" id="board-fx"></div>
      </div>
    `;
  }

  function actionSlotHTML(index, card, enemyReveal) {
    const playerCard = card ? miniCardHTML(DT.getCard(card), { revealed: true }) : '<button type="button" class="mini-card empty-slot" data-empty-slot="' + index + '"><span>+</span><small>ELIGE</small></button>';
    return `
      <div class="action-slot" data-slot="${index}">
        <div class="slot-head"><span>ACCIÓN ${index + 1}</span><span class="slot-key">${index + 1}</span></div>
        <div class="slot-pair">
          <div class="slot-enemy">${enemyReveal ? miniCardHTML(DT.getCard(enemyReveal), { revealed: true }) : cardBackHTML('Plan rival oculto')}</div>
          <div class="slot-vs">VS</div>
          <div class="slot-player">${playerCard}</div>
        </div>
      </div>
    `;
  }

  function shardDefs() {
    return `<svg width="0" height="0" aria-hidden="true"><defs><linearGradient id="shardGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffe9a8"/><stop offset="55%" stop-color="#d8a94a"/><stop offset="100%" stop-color="#7a4b17"/></linearGradient></defs></svg>`;
  }

  root.UI = {
    TONE_COLORS,
    portrait,
    icon,
    patternGrid,
    cardHTML,
    miniCardHTML,
    cardBackHTML,
    shardSVG,
    shardTrack,
    fighterHUD,
    characterCard,
    boardHTML,
    actionSlotHTML,
    shardDefs
  };
})(typeof window !== 'undefined' ? window : globalThis);
