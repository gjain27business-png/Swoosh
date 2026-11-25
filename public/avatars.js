/* PAUSE avatars: original sticker-style cartoon people, drawn in SVG.
   They are illustrations, never presented as members.
   Usage: PauseAvatar.svg('ananya', { frame: 'sticker' | 'portrait' | 'circle', bg: ['#a', '#b'], pose, expr, outfit }) */
(function () {
  let uid = 0;
  const sh = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
    return '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt))))
      .toString(16).padStart(2, '0')).join('');
  };
  const INK = '#1A0F14';

  const BG = { coral: ['#FFE0D6', '#FF9E8A'], sun: ['#FFF3C4', '#FFD166'], mint: ['#DDF8EE', '#8FE6CC'], aqua: ['#D3F0F2', '#7FD0D6'], peach: ['#FFE9DA', '#FFBE95'] };
  const PEOPLE = {
    ananya: { skin: '#C99474', hair: '#1E1214', style: 'long', f: 1, bindi: 1, hoops: 1, outfit: '#FF6B57', bg: BG.mint, expr: 'smile', pose: 'wave' },
    kabir: { skin: '#B07A57', hair: '#1A1012', style: 'quiff', beard: 1, glasses: 1, outfit: '#FFD166', bg: BG.aqua, expr: 'grin', pose: 'chai' },
    meera: { skin: '#D8A17F', hair: '#2A1712', style: 'bun', f: 1, nosepin: 1, studs: 1, outfit: '#12808A', bg: BG.sun, expr: 'laugh', pose: 'heart' },
    arjun: { skin: '#9C6847', hair: '#16100E', style: 'curly', outfit: '#FF8A70', bg: BG.aqua, expr: 'wink', pose: 'peace', kurta: 1 },
    zoya: { skin: '#E0AF8E', hair: '#3B2219', style: 'side', f: 1, hoops: 1, sunnies: 1, outfit: '#0F6470', bg: BG.coral, expr: 'smile', pose: 'phone' },
    rohan: { skin: '#BC8660', hair: '#1A1012', style: 'short', beard: 1, outfit: '#7CE8C9', bg: BG.peach, expr: 'grin', pose: 'wave' },
    isha: { skin: '#C48A66', hair: '#22120E', style: 'pony', f: 1, studs: 1, outfit: '#FF6B57', bg: BG.sun, expr: 'wink', pose: 'none' },
    dev: { skin: '#A97250', hair: '#140C0A', style: 'quiff', outfit: '#0B4A5C', bg: BG.coral, expr: 'smile', pose: 'none', glasses: 1 }
  };

  const FRAMES = { sticker: '-14 -8 268 286', portrait: '-22 -60 284 355', circle: '22 8 196 196' };

  function eye(cx, cy, f, closed) {
    if (closed) return `<path d="M${cx - 11} ${cy + 2}Q${cx} ${cy - 10} ${cx + 11} ${cy + 2}" stroke="${INK}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
    const out = cx < 120 ? -1 : 1;
    return `<ellipse cx="${cx}" cy="${cy}" rx="12" ry="13.5" fill="#fff"/>
      <circle cx="${cx + out * -1}" cy="${cy + 1.5}" r="8.6" fill="url(#IRIS)"/><circle cx="${cx + out * -1}" cy="${cy + 1.5}" r="4.3" fill="#120906"/>
      <circle cx="${cx + 3}" cy="${cy - 2.5}" r="3" fill="#fff"/><circle cx="${cx - 3}" cy="${cy + 5}" r="1.4" fill="#fff" opacity=".85"/>
      <path d="M${cx - 13} ${cy - 2}Q${cx} ${cy - 17} ${cx + 13} ${cy - 2}" stroke="${INK}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      ${f ? `<path d="M${cx + out * 12} ${cy - 4}l${out * 6} -5M${cx + out * 9} ${cy - 8}l${out * 4} -6" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>` : ''}`;
  }

  function mouth(expr, beard) {
    const m = beard ? '#5A1422' : '#6E1A2A';
    if (expr === 'grin') return `<path d="M101 143Q120 160 139 143" stroke="${m}" stroke-width="4.4" fill="none" stroke-linecap="round"/><path d="M98 140q2 4 5 5M142 140q-2 4 -5 5" stroke="${m}" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>`;
    if (expr === 'wink') return `<path d="M104 147Q124 158 139 141" stroke="${m}" stroke-width="4.4" fill="none" stroke-linecap="round"/>`;
    const big = expr === 'laugh';
    const top = big ? 138 : 141, bot = big ? 170 : 163, l = big ? 97 : 101, r = big ? 143 : 139;
    return `<path d="M${l} ${top}Q120 ${top + 7} ${r} ${top}Q${r - 2} ${bot} 120 ${bot}Q${l + 2} ${bot} ${l} ${top}Z" fill="${m}"/>
      <path d="M${l + 3} ${top + 2}Q120 ${top + 8} ${r - 3} ${top + 2}L${r - 4} ${top + 7}Q120 ${top + 12} ${l + 4} ${top + 7}Z" fill="#fff"/>
      <ellipse cx="120" cy="${bot - 5}" rx="${big ? 11 : 8.5}" ry="${big ? 6 : 4.5}" fill="#FF7A8A"/>`;
  }

  function hair(style, id) {
    const H = `url(#${id}h)`;
    const back = {
      long: `<path d="M58 98C50 40 92 16 122 16C158 16 192 42 184 102C188 152 194 196 204 230L36 230C46 196 52 152 58 98Z" fill="${H}"/>`,
      side: `<path d="M58 100C52 44 90 18 122 18C158 18 190 44 184 104C186 140 190 168 196 190L44 190C50 168 54 140 58 100Z" fill="${H}"/>`,
      bun: `<circle cx="120" cy="24" r="25" fill="${H}"/><path d="M104 30q16 -8 32 0" stroke="#fff" stroke-width="3" opacity=".18" fill="none" stroke-linecap="round"/>`,
      pony: `<path d="M166 60C206 66 214 126 196 176C190 148 182 118 170 98Z" fill="${H}"/>`
    }[style] || '';
    const front = {
      long: `<path d="M60 104C54 52 86 24 122 24C158 24 188 50 182 106C174 80 158 62 134 56C116 76 88 86 60 104Z" fill="${H}"/>
             <path d="M62 100C58 140 60 186 72 214Q64 222 56 210C50 198 48 186 48 170C46 140 50 116 62 100Z" fill="${H}"/><path d="M180 100C184 140 182 186 170 214Q178 222 186 210C192 198 194 186 194 170C196 140 192 116 180 100Z" fill="${H}"/>`,
      side: `<path d="M60 108C52 54 88 26 124 26C160 26 190 52 182 110C176 84 162 66 142 58C128 80 96 96 60 108Z" fill="${H}"/><path d="M60 104C56 136 58 162 66 182C54 178 48 160 48 140C48 124 52 112 60 104Z" fill="${H}"/>`,
      bun: `<path d="M60 98C58 56 86 32 120 32C154 32 182 56 180 98C172 72 150 56 122 56C92 56 70 70 60 98Z" fill="${H}"/>`,
      pony: `<path d="M60 100C58 56 86 30 120 30C154 30 182 56 180 100C170 74 150 58 120 58C90 58 70 74 60 100Z" fill="${H}"/>`,
      quiff: `<path d="M62 96C56 50 82 14 126 14C164 14 188 40 180 94C176 74 168 62 154 56C134 66 100 66 76 58C68 66 64 80 62 96Z" fill="${H}"/>`,
      short: `<path d="M62 94C58 54 86 28 122 28C158 28 186 52 180 94C176 72 164 60 148 56C128 62 100 62 80 58C70 66 64 78 62 94Z" fill="${H}"/>`,
      curly: `<g fill="${H}">${[[66, 92, 16], [72, 66, 19], [90, 46, 21], [114, 34, 22], [140, 34, 22], [162, 44, 21], [178, 64, 19], [182, 90, 15], [102, 58, 18], [128, 52, 20], [154, 60, 18]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`
    }[style] || '';
    const shine = `<path d="M92 44Q118 30 146 38" stroke="#fff" stroke-width="5" opacity=".16" fill="none" stroke-linecap="round"/>`;
    return [back, front + (style === 'curly' ? '' : shine)];
  }

  function pose(p, S, SD, id) {
    const O = `url(#${id}o)`;
    const mitten = (x, y, rot) => `<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - 14}" y="${y - 18}" width="28" height="34" rx="13" fill="${S}"/><ellipse cx="${x - 15}" cy="${y + 2}" rx="6" ry="10" transform="rotate(-28 ${x - 15} ${y + 2})" fill="${S}"/><path d="M${x - 6} ${y - 14}v9M${x + 1} ${y - 16}v11M${x + 8} ${y - 14}v9" stroke="${SD}" stroke-width="2" stroke-linecap="round"/></g>`;
    const palm = (x, y, rot) => {
      const f = [[-10, 20, -10], [-3.4, 24, -3], [3.4, 23, 3], [10, 18, 10]].map(([dx, h, r]) => `<rect x="${x + dx - 3.4}" y="${y - 10 - h + 5}" width="6.8" height="${h}" rx="3.4" fill="${S}" stroke="${SD}" stroke-width="1.2" transform="rotate(${r} ${x + dx} ${y - 8})"/>`).join('');
      return `<g transform="rotate(${rot} ${x} ${y})">${f}<rect x="${x - 13.5}" y="${y - 11}" width="27" height="27" rx="11" fill="${S}"/><rect x="${x - 23}" y="${y - 1}" width="8" height="19" rx="4" fill="${S}" stroke="${SD}" stroke-width="1.2" transform="rotate(-52 ${x - 15} ${y + 9})"/></g>`;
    };
    switch (p) {
      case 'wave': return [`<path d="M180 222Q206 206 210 170" stroke="${O}" stroke-width="26" stroke-linecap="round" fill="none"/>${palm(212, 146, 12)}`,
        `<path d="M231 122q8 8 3 17M240 108q11 11 5 26" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".9"/>`];
      case 'peace': return [`<path d="M180 222Q202 204 200 172" stroke="${O}" stroke-width="26" stroke-linecap="round" fill="none"/>
        <g transform="rotate(8 200 150)"><rect x="191" y="108" width="10" height="30" rx="5" fill="${S}" transform="rotate(-14 196 136)"/><rect x="202" y="108" width="10" height="30" rx="5" fill="${S}" transform="rotate(12 207 136)"/>
        <rect x="186" y="134" width="30" height="26" rx="11" fill="${S}"/><ellipse cx="186" cy="146" rx="6" ry="9" fill="${S}" transform="rotate(-30 186 146)"/><path d="M196 140h14M196 147h14" stroke="${SD}" stroke-width="2" stroke-linecap="round"/></g>`, ''];
      case 'chai': return [`<path d="M86 248Q104 234 136 230" stroke="${O}" stroke-width="22" stroke-linecap="round" fill="none"/>
        <path d="M138 198h36l-4 36q-14 7 -28 0z" fill="#FFF7EC"/><path d="M139 206h34" stroke="#C9542B" stroke-width="4"/><ellipse cx="156" cy="199" rx="18" ry="4.5" fill="#B9733E"/>
        <path d="M174 206q13 1 11 12q-2 9 -13 9" stroke="#FFF7EC" stroke-width="5" fill="none"/>
        <path d="M150 190q-6 -8 0 -15t0 -14M162 190q-6 -8 0 -15t0 -14" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".35"/>
        <ellipse cx="140" cy="226" rx="14" ry="11" fill="${S}"/><path d="M133 220h12M133 226h12" stroke="${SD}" stroke-width="2" stroke-linecap="round"/>`, ''];
      case 'heart': return [`<path d="M74 246Q80 228 98 218M166 246Q160 228 142 218" stroke="${O}" stroke-width="22" stroke-linecap="round" fill="none"/>
        <path d="M120 250C84 228 78 204 94 194C106 187 116 194 120 203C124 194 134 187 146 194C162 204 156 228 120 250Z" fill="#FF2E63"/>
        <ellipse cx="104" cy="204" rx="7" ry="4.5" fill="#fff" opacity=".5" transform="rotate(-30 104 204)"/>
        <ellipse cx="94" cy="216" rx="12" ry="14" fill="${S}"/><ellipse cx="146" cy="216" rx="12" ry="14" fill="${S}"/>`, ''];
      case 'phone': return [`<path d="M182 248Q174 242 166 236" stroke="${O}" stroke-width="22" stroke-linecap="round" fill="none"/>
        <rect x="140" y="182" width="38" height="62" rx="8" fill="#1A1033"/><rect x="144" y="188" width="30" height="48" rx="5" fill="#FF4FA3"/>
        <path d="M159 220c-8-5-9-10-6-12c2-1 5 0 6 2c1-2 4-3 6-2c3 2 2 7-6 12z" fill="#fff"/>
        <ellipse cx="160" cy="238" rx="17" ry="12" fill="${S}"/><ellipse cx="142" cy="220" rx="5" ry="9" fill="${S}"/>`, ''];
      default: return ['', ''];
    }
  }

  function svg(who, opt) {
    const base = typeof who === 'string' ? PEOPLE[who] : who;
    const o = Object.assign({}, base, opt || {});
    const id = 'pa' + (uid++), S = o.skin, SD = sh(S, -0.2), SL = sh(S, 0.18), H = o.hair, OC = o.outfit;
    const frame = o.frame || 'sticker', sticker = frame === 'sticker';
    const [hb, hf] = hair(o.style, id);
    const expr = o.expr || 'smile';
    const closedL = expr === 'laugh', closedR = expr === 'laugh' || expr === 'wink';
    const bgc = frame === 'sticker' ? null : (o.bg || null);
    const bg = bgc ? (() => {
      const [x, y, w, h] = FRAMES[frame].split(' ').map(Number);
      return `<linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bgc[0]}"/><stop offset="1" stop-color="${bgc[1]}"/></linearGradient>|<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}b)"/><circle cx="${x + w * 0.8}" cy="${y + h * 0.2}" r="${w * 0.2}" fill="#fff" opacity=".2"/><circle cx="${x + w * 0.12}" cy="${y + h * 0.72}" r="${w * 0.09}" fill="#fff" opacity=".14"/>`;
    })().split('|') : ['', ''];
    const defs = `<defs>
      <radialGradient id="${id}s" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="${SL}"/><stop offset=".55" stop-color="${S}"/><stop offset="1" stop-color="${SD}"/></radialGradient>
      <linearGradient id="${id}h" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="${sh(H, 0.3)}"/><stop offset=".45" stop-color="${H}"/><stop offset="1" stop-color="${sh(H, -0.4)}"/></linearGradient>
      <linearGradient id="${id}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sh(OC, 0.2)}"/><stop offset="1" stop-color="${sh(OC, -0.22)}"/></linearGradient>
      <radialGradient id="${id}i" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#9A6A40"/><stop offset="1" stop-color="#3A2214"/></radialGradient>
      ${bg[0]}
      ${sticker ? `<filter id="${id}f" x="-12%" y="-10%" width="124%" height="126%"><feMorphology in="SourceAlpha" operator="dilate" radius="6" result="d"/><feOffset in="d" dy="6" result="dd"/><feGaussianBlur in="dd" stdDeviation="5" result="db"/><feFlood flood-color="#2A0A2E" flood-opacity=".3"/><feComposite in2="db" operator="in" result="shd"/><feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="ring"/><feMerge><feMergeNode in="shd"/><feMergeNode in="ring"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : ''}
    </defs>`;
    const body = `<path d="M38 252C40 206 74 182 120 182C166 182 200 206 202 252Q202 262 192 262H48Q38 262 38 252Z" fill="url(#${id}o)"/>
      ${o.kurta ? `<path d="M120 196v52" stroke="${sh(OC, -0.35)}" stroke-width="3"/><circle cx="120" cy="214" r="3" fill="#FFE7A8"/><circle cx="120" cy="230" r="3" fill="#FFE7A8"/>` : ''}
      <path d="M100 184Q120 206 140 184" fill="${SD}"/><path d="M106 148h28v38q-14 9 -28 0z" fill="${SD}"/>`;
    const face = `<ellipse cx="60" cy="110" rx="10" ry="15" fill="${S}"/><ellipse cx="180" cy="110" rx="10" ry="15" fill="${S}"/>
      <path d="M60 96C60 52 88 32 120 32C152 32 180 52 180 96C180 140 156 170 120 170C84 170 60 140 60 96Z" fill="url(#${id}s)"/>
      ${o.beard ? `<path d="M62 108C64 150 88 174 120 174C152 174 176 150 178 108C172 130 160 138 148 140C138 132 102 132 92 140C80 138 68 130 62 108Z" fill="url(#${id}h)"/><path d="M98 137Q120 126 142 137Q120 133 98 137Z" fill="url(#${id}h)"/>` : ''}
      <ellipse cx="88" cy="134" rx="11" ry="7" fill="#FF5C86" opacity=".26"/><ellipse cx="152" cy="134" rx="11" ry="7" fill="#FF5C86" opacity=".26"/>
      <path d="M86 87Q98 ${expr === 'wink' ? 81 : 78} 110 85M130 85Q142 ${expr === 'wink' ? 84 : 78} 154 87" stroke="${H}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
      ${o.sunnies ? '' : eye(98, 108, o.f, closedL) + eye(142, 108, o.f, closedR)}
      <path d="M118 118Q113 130 119 133Q124 134 127 131" stroke="${SD}" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${mouth(expr, o.beard)}
      ${o.glasses ? `<g fill="#fff" fill-opacity=".12" stroke="${INK}" stroke-width="3.4"><circle cx="98" cy="108" r="17"/><circle cx="142" cy="108" r="17"/></g><path d="M115 106q5 -4 10 0" stroke="${INK}" stroke-width="3.4" fill="none"/>` : ''}
      ${o.sunnies ? `<path d="M76 98h40q2 22 -18 24q-22 0 -22 -24zM124 98h40q0 24 -22 24q-20 -2 -18 -24z" fill="#1A1033"/><path d="M116 101h8" stroke="#1A1033" stroke-width="4"/><path d="M84 103l10 10M132 103l10 10" stroke="#fff" stroke-width="3" opacity=".45" stroke-linecap="round"/>` : ''}
      ${o.bindi ? '<circle cx="120" cy="76" r="3.6" fill="#E5197E"/>' : ''}
      ${o.nosepin ? '<circle cx="128" cy="129" r="2.6" fill="#FFC53D"/>' : ''}
      ${o.hoops ? '<circle cx="60" cy="130" r="8" fill="none" stroke="#FFC53D" stroke-width="3.6"/><circle cx="180" cy="130" r="8" fill="none" stroke="#FFC53D" stroke-width="3.6"/>' : ''}
      ${o.studs ? '<circle cx="60" cy="122" r="4" fill="#FFC53D"/><circle cx="180" cy="122" r="4" fill="#FFC53D"/>' : ''}`;
    const [pa, pfx] = pose(o.pose, S, SD, id);
    const art = (hb + body + face + hf + pa).replace(/url\(#IRIS\)/g, `url(#${id}i)`);
    return `<svg class="pav" viewBox="${FRAMES[frame]}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${defs}${bg[1]}<g${sticker ? ` filter="url(#${id}f)"` : ''}>${art}</g>${pfx}</svg>`;
  }

  function mount(root) {
    (root || document).querySelectorAll('[data-pav]').forEach((el) => {
      if (el.dataset.pavDone) return;
      const d = el.dataset, opt = {};
      if (d.frame) opt.frame = d.frame;
      if (d.pose) opt.pose = d.pose;
      if (d.expr) opt.expr = d.expr;
      if (d.outfit) opt.outfit = d.outfit;
      if (d.bg) opt.bg = d.bg.split(',');
      if (!PEOPLE[d.pav]) return;
      el.insertAdjacentHTML('afterbegin', svg(d.pav, opt));
      el.dataset.pavDone = '1';
    });
  }

  window.PauseAvatar = { svg, mount, PEOPLE, BG, shade: sh };
})();
