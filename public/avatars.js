/* PAUSE avatars: original sticker-style cartoon people, drawn in SVG.
   Used only where the site or app shows a profile. They are illustrations, never presented as members.
   Usage: PauseAvatar.svg('ananya', { frame: 'sticker' | 'portrait' | 'circle', bg: ['#a', '#b'], pose, expr }) */
(function () {
  let uid = 0;
  const sh = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
    return '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt))))
      .toString(16).padStart(2, '0')).join('');
  };
  const INK = '#17101A';
  const BG = { coral: ['#FFE0D6', '#FF9E8A'], sun: ['#FFF3C4', '#FFD166'], mint: ['#DDF8EE', '#8FE6CC'], aqua: ['#D3F0F2', '#7FD0D6'], peach: ['#FFE9DA', '#FFBE95'], lilac: ['#ECE6FF', '#B9A8FF'] };

  // Three fair, three brown.
  const PEOPLE = {
    ananya: { g: 'f', skin: '#F2CDB4', hair: '#2A1712', hl: '#B57A45', style: 'waves', outfit: 'jacket', cloth: '#6F9BDB', top: '#FFFFFF', ear: 'hoops', lip: '#D9576F', expr: 'smile', pose: 'fheart', bg: BG.coral },
    kabir: { g: 'm', skin: '#EDC3A5', hair: '#1E140F', style: 'crop', outfit: 'hoodie', cloth: '#22222E', ear: 'pods', stubble: 1, expr: 'grin', pose: 'peace', bg: BG.sun },
    zoya: { g: 'f', skin: '#F5D6C2', hair: '#3A2015', hl: '#8E5432', style: 'buns', outfit: 'hoodie', cloth: '#B9A4FF', phones: 1, lip: '#E0607A', expr: 'wink', pose: 'selfie', bg: BG.aqua },
    meera: { g: 'f', skin: '#B67A55', hair: '#1C110E', style: 'hipony', outfit: 'top', cloth: '#FF6B57', necklace: 1, ear: 'studs', shades: 1, lip: '#B8435A', expr: 'grin', pose: 'iced', bg: BG.mint },
    arjun: { g: 'm', skin: '#9A6444', hair: '#130B09', style: 'curlytop', outfit: 'tee', cloth: '#FAFAFA', chain: 1, expr: 'smirk', pose: 'thumbs', bg: BG.coral },
    dev: { g: 'm', skin: '#A86F4C', hair: '#140C0A', style: 'beanie', beanie: '#FF6B57', outfit: 'hoodie', cloth: '#7CE8C9', ear: 'pods', expr: 'grin', pose: 'wave', bg: BG.lilac }
  };

  const FRAMES = { sticker: '-16 -10 272 290', portrait: '4 -26 232 290', circle: '24 10 192 192' };

  // ---------- face ----------
  function eye(id, cx, cy, o, closed, side) {
    const f = o.g === 'f';
    if (closed) return `<path d="M${cx - 12} ${cy + 1}Q${cx} ${cy - 8} ${cx + 12} ${cy + 1}" stroke="${INK}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
    const sc = `M${cx - 13} ${cy + 2}C${cx - 8} ${cy - 9} ${cx + 8} ${cy - 12} ${cx + 14} ${cy - 2}C${cx + 9} ${cy + 7} ${cx - 6} ${cy + 9} ${cx - 13} ${cy + 2}Z`;
    const cid = `${id}e${side < 0 ? 'l' : 'r'}`;
    const mirror = side < 0 ? ` transform="translate(${2 * cx} 0) scale(-1 1)"` : '';
    return `<g${mirror}><clipPath id="${cid}"><path d="${sc}"/></clipPath><path d="${sc}" fill="#fff"/>
      <g clip-path="url(#${cid})"><circle cx="${cx + 0.5}" cy="${cy - 1}" r="8.4" fill="url(#${id}i)"/><circle cx="${cx + 0.5}" cy="${cy - 1}" r="3.9" fill="#0E0806"/></g>
      <path d="M${cx - 14} ${cy + 2}C${cx - 8} ${cy - 10} ${cx + 8} ${cy - 13} ${cx + 15} ${cy - 2}" stroke="${INK}" stroke-width="${f ? 3.8 : 3}" fill="none" stroke-linecap="round"/>
      ${f ? `<path d="M${cx + 13} ${cy - 2}L${cx + 21} ${cy - 9}M${cx + 8} ${cy - 8}l3 -5" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>` : ''}
      <path d="M${cx - 9} ${cy + 6}Q${cx + 2} ${cy + 10} ${cx + 12} ${cy + 3}" stroke="${INK}" stroke-width="1.3" fill="none" opacity=".25"/></g>
      <circle cx="${cx + 3.5}" cy="${cy - 4.5}" r="2.8" fill="#fff"/><circle cx="${cx - 2.5}" cy="${cy + 2.5}" r="1.2" fill="#fff" opacity=".8"/>`;
  }
  function brow(cx, cy, o, side, low) {
    const f = o.g === 'f', d = low ? 3 : 0;
    const path = f ? `M${cx - 12} ${cy - 17 + d}Q${cx + 2} ${cy - 27 + d} ${cx + 15} ${cy - 20 + d}` : `M${cx - 13} ${cy - 18 + d}Q${cx + 1} ${cy - 24 + d} ${cx + 15} ${cy - 20 + d}`;
    const mirror = side < 0 ? ` transform="translate(${2 * cx} 0) scale(-1 1)"` : '';
    return `<path${mirror} d="${path}" stroke="${o.hair}" stroke-width="${f ? 3.6 : 5.4}" fill="none" stroke-linecap="round"/>`;
  }
  function mouth(o) {
    const f = o.g === 'f', lip = o.lip || '#B0505E', x = o.expr;
    if (x === 'grin') return `<path d="M104 145Q120 150 136 145Q133 161 120 161Q107 161 104 145Z" fill="#5A1622" ${f ? `stroke="${lip}" stroke-width="3" stroke-linejoin="round"` : ''}/>
      <path d="M106.5 146.5Q120 151 133.5 146.5L132.5 151Q120 155 107.5 151Z" fill="#fff"/><ellipse cx="120" cy="157" rx="7" ry="3" fill="#FF7A8A" opacity=".9"/>`;
    if (x === 'smirk') return `<path d="M108 149Q123 155 135 144" stroke="#6E2A2A" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M116 155q6 1.5 11 -1" stroke="${sh(o.skin, -0.25)}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    if (!f) return `<path d="M107 147Q120 156 133 146" stroke="#6E2A2A" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M114 154q6 2 12 0" stroke="${sh(o.skin, -0.25)}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    return `<path d="M106 147Q113 142.5 120 145.5Q127 142.5 134 147Q120 151 106 147Z" fill="${lip}"/>
      <path d="M106 147Q120 151.5 134 147Q129 157 120 157Q111 157 106 147Z" fill="${sh(lip, 0.12)}"/>
      <path d="M106 147Q120 152 134 147" stroke="${sh(lip, -0.4)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <ellipse cx="123" cy="152.5" rx="4" ry="1.6" fill="#fff" opacity=".4"/>`;
  }

  // ---------- hair ----------
  function hair(o, id) {
    const H = `url(#${id}h)`, HL = o.hl || sh(o.hair, 0.35);
    const circles = (list) => list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${H}"/>`).join('');
    switch (o.style) {
      case 'waves': return {
        back: `<path d="M60 100C50 44 88 18 120 18C152 18 190 44 180 100C186 128 176 148 188 172C198 194 184 212 194 238Q170 246 150 236L90 236Q70 246 46 238C56 212 42 194 52 172C64 148 54 128 60 100Z" fill="${H}"/>`,
        front: `<path d="M66 98C62 54 90 28 120 28C150 28 178 54 174 98C168 72 152 56 126 52Q122 46 120 40Q118 46 114 52C88 56 72 72 66 98Z" fill="${H}"/>
          <path d="M118 44C100 50 78 66 70 106C76 94 86 84 98 80C106 70 114 60 118 44Z" fill="${H}"/><path d="M122 44C140 50 162 66 170 106C164 94 154 84 142 80C134 70 126 60 122 44Z" fill="${H}"/>
          <path d="M68 104C60 128 72 148 62 172C54 192 66 206 58 226Q74 222 78 202C84 182 74 164 80 142C82 126 78 112 68 104Z" fill="${H}"/>
          <path d="M172 104C180 128 168 148 178 172C186 192 174 206 182 226Q166 222 162 202C156 182 166 164 160 142C158 126 162 112 172 104Z" fill="${H}"/>
          <g stroke="${HL}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"><path d="M84 62Q100 48 116 46"/><path d="M72 128Q80 150 68 174Q62 190 66 206"/><path d="M168 128Q160 150 172 174Q178 190 174 206"/><path d="M150 50Q164 58 170 72"/></g>`
      };
      case 'hipony': return {
        back: `<path d="M138 30C170 6 216 26 206 78C200 108 216 128 206 160C198 184 208 200 198 216C186 198 184 178 186 158C188 132 174 114 178 88C180 66 162 48 140 44Z" fill="${H}"/><path d="M178 60Q200 86 194 120Q190 146 198 170" stroke="${HL}" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>`,
        front: `<path d="M66 98C62 54 90 30 120 30C150 30 178 54 174 98C170 74 152 54 120 52C90 54 70 74 66 98Z" fill="${H}"/>
          <path d="M75 76C66 98 74 120 68 142Q80 130 81 110Q81 92 75 76Z" fill="${H}"/><path d="M165 76C174 98 166 120 172 142Q160 130 159 110Q159 92 165 76Z" fill="${H}"/>
          <ellipse cx="146" cy="35" rx="10" ry="7" fill="#FF6B57" transform="rotate(-24 146 35)"/>
          <path d="M92 46Q118 34 146 44" stroke="${HL}" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>`
      };
      case 'buns': return {
        back: `<circle cx="80" cy="36" r="23" fill="${H}"/><circle cx="160" cy="36" r="23" fill="${H}"/>
          <path d="M70 30q10 -8 20 0M150 30q10 -8 20 0" stroke="${HL}" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>
          <path d="M62 102C56 52 90 26 120 26C150 26 184 52 178 102L176 132L64 132Z" fill="${H}"/>`,
        front: `<path d="M66 98C62 56 90 30 120 30C150 30 178 56 174 98C168 72 150 54 122 50L120 44L118 50C90 54 72 72 66 98Z" fill="${H}"/>
          <path d="M71 100q-5 14 1 28M169 100q5 14 -1 28" stroke="${o.hair}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
      };
      case 'curls': {
        const back = [[70, 60, 27], [96, 36, 27], [126, 30, 27], [154, 38, 27], [176, 64, 27], [186, 98, 25], [188, 132, 24], [182, 164, 22], [54, 98, 25], [52, 132, 24], [58, 164, 22], [74, 192, 18], [168, 192, 18]];
        const front = [[80, 68, 16], [98, 54, 17], [120, 49, 17], [142, 54, 17], [160, 68, 16]];
        return { back: circles(back), front: circles(front) + `<g stroke="${HL}" stroke-width="2.4" fill="none" opacity=".7" stroke-linecap="round">${front.map(([x, y]) => `<path d="M${x - 7} ${y - 3}q7 -7 14 0"/>`).join('')}</g>` };
      }
      case 'crop': return {
        back: '',
        front: `<path d="M66 96C62 58 84 30 118 28C152 26 180 50 176 94C172 82 168 76 162 72L160 63L152 69L146 57L138 65L128 53L120 63L110 53L102 63L94 57L88 67L80 65C72 73 68 84 66 96Z" fill="${H}"/>
          <path d="M66 96C65 86 67 78 71 72L73 108ZM174 96C175 86 173 78 169 72L167 108Z" fill="${o.hair}" opacity=".45"/>
          <g stroke="${HL}" stroke-width="2.6" fill="none" opacity=".55" stroke-linecap="round"><path d="M88 46l9 -7M108 40l10 -6M130 39l9 -5M150 45l7 -5"/></g>`
      };
      case 'flow': return {
        back: `<path d="M62 100C56 50 90 24 120 24C150 24 184 50 178 100L176 110L64 110Z" fill="${H}"/>`,
        front: `<path d="M66 96C62 54 90 30 120 30C150 30 178 54 174 96C170 80 160 66 144 60L120 40L96 60C80 66 70 80 66 96Z" fill="${H}"/>
          <path d="M119 40C104 50 84 58 72 76C66 86 64 98 66 112C72 98 80 88 92 82C104 76 114 64 119 40Z" fill="${H}"/><path d="M121 40C136 50 156 58 168 76C174 86 176 98 174 112C168 98 160 88 148 82C136 76 126 64 121 40Z" fill="${H}"/>
          <g stroke="${HL}" stroke-width="2.6" fill="none" opacity=".55" stroke-linecap="round"><path d="M110 50Q92 62 78 84"/><path d="M130 50Q148 62 162 84"/></g>`
      };
      case 'curlytop': {
        const top = [[84, 60, 15], [98, 45, 16], [116, 38, 17], [134, 40, 16], [150, 48, 16], [162, 62, 14], [108, 57, 14], [128, 54, 14], [146, 61, 13], [92, 68, 12], [76, 76, 10], [166, 78, 10]];
        return { back: '', front: `<path d="M66 100C65 88 68 78 74 72L74 110ZM174 100C175 88 172 78 166 72L166 110Z" fill="${o.hair}" opacity=".5"/>` + circles(top) + `<g stroke="${HL}" stroke-width="2.2" fill="none" opacity=".6" stroke-linecap="round">${top.slice(0, 7).map(([x, y]) => `<path d="M${x - 6} ${y - 3}q6 -6 12 0"/>`).join('')}</g>` };
      }
      case 'beanie': {
        const B = o.beanie || '#FF6B57';
        return {
          back: '',
          front: `<path d="M74 104q4 10 0 20M166 104q-4 10 0 20" stroke="${o.hair}" stroke-width="5" stroke-linecap="round"/>
            <path d="M60 96C58 46 88 16 120 16C152 16 182 46 180 96C150 86 90 86 60 96Z" fill="${B}"/>
            <path d="M84 40Q110 26 140 30" stroke="#fff" stroke-width="5" opacity=".22" fill="none" stroke-linecap="round"/>
            <path d="M57 90C90 78 150 78 183 90L185 110C150 100 90 100 55 110Z" fill="${sh(B, -0.16)}"/>
            <g stroke="${sh(B, -0.34)}" stroke-width="2" opacity=".55">${[66, 76, 86, 96, 106, 116, 126, 136, 146, 156, 166, 176].map((x) => `<path d="M${x} ${(88 - Math.abs(120 - x) * 0.06).toFixed(1)}v16"/>`).join('')}</g>`
        };
      }
      default: return { back: '', front: '' };
    }
  }

  // ---------- clothes ----------
  function outfit(o, id) {
    const C = `url(#${id}o)`, S = o.skin, SD = sh(S, -0.2), CD = sh(o.cloth, -0.2);
    const base = `<path d="M42 256C44 212 76 188 120 186C164 188 196 212 198 256Q198 264 190 264H50Q42 264 42 256Z" fill="${C}"/>`;
    const neck = `<path d="M107 150h26v42q-13 8 -26 0z" fill="${SD}"/>`;
    let s;
    if (o.outfit === 'hoodie') {
      s = base + `<path d="M80 198C84 178 104 170 120 174C136 170 156 178 160 198C152 208 136 213 120 213C104 213 88 208 80 198Z" fill="${CD}"/>` + neck +
        `<path d="M98 190Q120 207 142 190Q134 181 120 181Q106 181 98 190Z" fill="${sh(S, -0.3)}"/>
        <path d="M109 207l-3 30M131 207l3 30" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/><rect x="103" y="235" width="5" height="8" rx="2" fill="#fff"/><rect x="132" y="235" width="5" height="8" rx="2" fill="#fff"/>`;
    } else if (o.outfit === 'tee') {
      s = base + neck + `<path d="M99 189Q120 206 141 189" stroke="${CD}" stroke-width="5" fill="none" stroke-linecap="round"/>
        <g transform="translate(76 222)"><rect width="16" height="16" rx="5" fill="#FF6B57"/><rect x="5" y="4" width="2.2" height="8" rx="1.1" fill="#08263A"/><rect x="8.8" y="4" width="2.2" height="8" rx="1.1" fill="#08263A"/></g>`;
    } else if (o.outfit === 'top') {
      s = base + neck + `<path d="M93 193Q120 228 147 193L140 188Q120 198 100 188Z" fill="${sh(S, -0.08)}"/><path d="M93 193Q120 228 147 193" stroke="${CD}" stroke-width="3" fill="none"/>`;
    } else if (o.outfit === 'jacket') {
      const T = o.top || '#fff';
      s = base + neck + `<path d="M102 188L120 264L138 188Q120 199 102 188Z" fill="${T}"/>
        <path d="M102 187L88 206L103 214L95 228L120 263Z" fill="${CD}"/><path d="M138 187L152 206L137 214L145 228L120 263Z" fill="${CD}"/>
        <path d="M60 232h24M156 232h24" stroke="${sh(o.cloth, 0.3)}" stroke-width="2" stroke-dasharray="3 3"/>`;
    } else s = base + neck;
    if (o.necklace) s += `<path d="M99 193Q120 213 141 193" stroke="#F2C14E" stroke-width="1.8" fill="none"/><path d="M120 211c-3-2-4-4-3-5c1-1 2.5-.5 3 .5c.5-1 2-1.5 3-.5c1 1 0 3-3 5z" fill="#F2C14E"/>`;
    if (o.chain) s += `<path d="M100 193Q120 220 140 193" stroke="#E9EBEF" stroke-width="2.8" fill="none" stroke-dasharray="4 1.5"/>`;
    if (o.phones) s += `<path d="M84 196Q120 236 156 196" stroke="#1E1A2E" stroke-width="7" fill="none" stroke-linecap="round"/>
      <ellipse cx="84" cy="192" rx="11" ry="14" transform="rotate(-24 84 192)" fill="#1E1A2E"/><ellipse cx="86" cy="193" rx="6" ry="8.5" transform="rotate(-24 86 193)" fill="#FF6B57"/>
      <ellipse cx="156" cy="192" rx="11" ry="14" transform="rotate(24 156 192)" fill="#1E1A2E"/><ellipse cx="154" cy="193" rx="6" ry="8.5" transform="rotate(24 154 193)" fill="#FF6B57"/>`;
    return s;
  }

  // ---------- hands and props ----------
  function pose(o, id) {
    const S = o.skin, SD = sh(S, -0.2), C = `url(#${id}o)`;
    const arm = (d, w) => `<path d="${d}" stroke="${C}" stroke-width="${w || 24}" stroke-linecap="round" fill="none"/>`;
    const palm = (x, y, rot) => {
      const f = [[-10, 20, -10], [-3.4, 24, -3], [3.4, 23, 3], [10, 18, 10]].map(([dx, h, r]) => `<rect x="${x + dx - 3.4}" y="${y - 10 - h + 5}" width="6.8" height="${h}" rx="3.4" fill="${S}" stroke="${SD}" stroke-width="1.2" transform="rotate(${r} ${x + dx} ${y - 8})"/>`).join('');
      return `<g transform="rotate(${rot} ${x} ${y})">${f}<rect x="${x - 13.5}" y="${y - 11}" width="27" height="27" rx="11" fill="${S}"/><rect x="${x - 23}" y="${y - 1}" width="8" height="19" rx="4" fill="${S}" stroke="${SD}" stroke-width="1.2" transform="rotate(-52 ${x - 15} ${y + 9})"/></g>`;
    };
    switch (o.pose) {
      case 'wave': return arm('M180 222Q206 206 210 170') + palm(212, 146, 12);
      case 'peace': return arm('M180 222Q202 204 200 172') + `<g transform="rotate(8 200 150)"><rect x="191" y="108" width="10" height="30" rx="5" fill="${S}" stroke="${SD}" stroke-width="1" transform="rotate(-14 196 136)"/><rect x="202" y="108" width="10" height="30" rx="5" fill="${S}" stroke="${SD}" stroke-width="1" transform="rotate(12 207 136)"/>
        <rect x="186" y="134" width="30" height="26" rx="11" fill="${S}"/><ellipse cx="186" cy="146" rx="6" ry="9" fill="${S}" transform="rotate(-30 186 146)"/><path d="M196 140h14M196 147h14" stroke="${SD}" stroke-width="2" stroke-linecap="round"/></g>`;
      case 'fheart': return arm('M182 224Q204 208 200 176') + `<g><rect x="186" y="150" width="28" height="26" rx="11" fill="${S}"/><path d="M193 161h15M193 167h15" stroke="${SD}" stroke-width="1.8" stroke-linecap="round"/>
        <rect x="199" y="128" width="8" height="26" rx="4" fill="${S}" stroke="${SD}" stroke-width="1.1" transform="rotate(-16 203 152)"/><rect x="193" y="131" width="8" height="23" rx="4" fill="${S}" stroke="${SD}" stroke-width="1.1" transform="rotate(26 197 152)"/></g>
        <path d="M214 118c-9-6-11-12-7.5-14.5c2.5-1.8 6-.6 7.5 1.8c1.5-2.4 5-3.6 7.5-1.8c3.5 2.5 1.5 8.5-7.5 14.5z" fill="#FF3D5E"/>`;
      case 'iced': return arm('M58 252Q80 240 108 228', 22) + `<path d="M78 196h36l-4.5 50q-13.5 5 -27 0z" fill="#fff" opacity=".6"/>
        <path d="M80.5 210h31l-3.6 34.5q-12 4 -23.8 0z" fill="#9A6038"/><path d="M80.5 210h31l-1 10h-29z" fill="#C89065"/>
        <rect x="86" y="214" width="9" height="9" rx="2" fill="#fff" opacity=".5" transform="rotate(14 90 218)"/><rect x="99" y="222" width="8" height="8" rx="2" fill="#fff" opacity=".45" transform="rotate(-10 103 226)"/>
        <path d="M76 196q20 -13 40 0z" fill="#fff" opacity=".85"/><path d="M99 188l7 -28" stroke="#FF6B57" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="112" cy="226" rx="12" ry="11" fill="${S}"/><ellipse cx="103" cy="216" rx="5" ry="8" fill="${S}" transform="rotate(-20 103 216)"/>`;
      case 'selfie': return arm('M182 226Q214 198 208 146') + `<g transform="rotate(8 207 108)"><rect x="190" y="74" width="34" height="60" rx="8" fill="#FF6B57"/><rect x="194" y="78" width="13" height="22" rx="5" fill="#1E1A2E"/><circle cx="200.5" cy="84" r="3.4" fill="#4A4470"/><circle cx="200.5" cy="94" r="3.4" fill="#4A4470"/></g>
        <ellipse cx="206" cy="138" rx="13" ry="11" fill="${S}"/><ellipse cx="193" cy="128" rx="4.5" ry="8" fill="${S}"/>`;
      case 'thumbs': return arm('M190 248Q186 236 172 226', 22) + `<rect x="150" y="208" width="28" height="26" rx="10" fill="${S}"/><path d="M156 219h16M156 226h16" stroke="${SD}" stroke-width="1.8" stroke-linecap="round"/>
        <rect x="153" y="186" width="10" height="28" rx="5" fill="${S}" stroke="${SD}" stroke-width="1.1" transform="rotate(-8 158 210)"/>`;
      default: return '';
    }
  }

  function ears(o) {
    const S = o.skin, SD = sh(S, -0.2);
    return `<ellipse cx="65" cy="113" rx="9" ry="13" fill="${S}"/><ellipse cx="175" cy="113" rx="9" ry="13" fill="${S}"/><path d="M63 107q-3 6 1 12M177 107q3 6 -1 12" stroke="${SD}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }
  function earwear(o) {
    if (o.ear === 'hoops') return '<circle cx="64" cy="130" r="6.5" fill="none" stroke="#F2C14E" stroke-width="2.6"/><circle cx="176" cy="130" r="6.5" fill="none" stroke="#F2C14E" stroke-width="2.6"/>';
    if (o.ear === 'studs') return '<circle cx="64" cy="122" r="3" fill="#F2C14E"/><circle cx="62" cy="113" r="2" fill="#F2C14E"/><circle cx="176" cy="122" r="3" fill="#F2C14E"/><circle cx="178" cy="113" r="2" fill="#F2C14E"/>';
    if (o.ear === 'pods') return '<g fill="#fff" stroke="#D5D9DE" stroke-width="1"><rect x="60" y="117" width="5" height="13" rx="2.5"/><circle cx="64" cy="117" r="4.6"/><rect x="175" y="117" width="5" height="13" rx="2.5"/><circle cx="176" cy="117" r="4.6"/></g>';
    return '';
  }

  function svg(who, opt) {
    const base = typeof who === 'string' ? PEOPLE[who] : who;
    const o = Object.assign({}, base, opt || {});
    const id = 'pa' + (uid++), S = o.skin, SD = sh(S, -0.2), SL = sh(S, 0.18), H = o.hair;
    const frame = o.frame || 'sticker', sticker = frame === 'sticker';
    const hr = hair(o, id);
    const wink = o.expr === 'wink';
    const bgc = sticker ? null : (o.bg || null);
    let bgDef = '', bgArt = '';
    if (bgc) {
      const [x, y, w, h] = FRAMES[frame].split(' ').map(Number);
      bgDef = `<linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bgc[0]}"/><stop offset="1" stop-color="${bgc[1]}"/></linearGradient>`;
      bgArt = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}b)"/><circle cx="${x + w * 0.82}" cy="${y + h * 0.18}" r="${w * 0.2}" fill="#fff" opacity=".22"/><circle cx="${x + w * 0.1}" cy="${y + h * 0.7}" r="${w * 0.08}" fill="#fff" opacity=".16"/>`;
    }
    const hairEnd = o.style === 'waves' && o.hl ? o.hl : sh(H, -0.35);
    const defs = `<defs>
      <radialGradient id="${id}s" cx=".4" cy=".32" r=".78"><stop offset="0" stop-color="${SL}"/><stop offset=".6" stop-color="${S}"/><stop offset="1" stop-color="${SD}"/></radialGradient>
      <linearGradient id="${id}h" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="${sh(H, 0.25)}"/><stop offset=".45" stop-color="${H}"/><stop offset="1" stop-color="${hairEnd}"/></linearGradient>
      <linearGradient id="${id}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sh(o.cloth, 0.16)}"/><stop offset="1" stop-color="${sh(o.cloth, -0.2)}"/></linearGradient>
      <radialGradient id="${id}i" cx=".5" cy=".3" r=".75"><stop offset="0" stop-color="#A9743F"/><stop offset=".6" stop-color="#5A3418"/><stop offset="1" stop-color="#2A160A"/></radialGradient>
      ${bgDef}
      ${sticker ? `<filter id="${id}f" x="-12%" y="-10%" width="124%" height="126%"><feMorphology in="SourceAlpha" operator="dilate" radius="6" result="d"/><feOffset in="d" dy="6" result="dd"/><feGaussianBlur in="dd" stdDeviation="5" result="db"/><feFlood flood-color="#04202C" flood-opacity=".3"/><feComposite in2="db" operator="in" result="shd"/><feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="ring"/><feMerge><feMergeNode in="shd"/><feMergeNode in="ring"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : ''}
    </defs>`;
    const face = `<path d="M64 96C64 54 90 34 120 34C150 34 176 54 176 96C176 126 164 150 146 164C138 170 129 174 120 174C111 174 102 170 94 164C76 150 64 126 64 96Z" fill="url(#${id}s)"/>
      ${o.stubble ? `<path d="M70 118C72 146 92 170 120 174C148 170 168 146 170 118C166 140 152 150 140 152C130 146 110 146 100 152C88 150 74 140 70 118Z" fill="${H}" opacity=".2"/><path d="M104 140Q120 134 136 140Q120 138 104 140Z" fill="${H}" opacity=".32"/>` : ''}
      <ellipse cx="90" cy="135" rx="10" ry="6" fill="#FF6B86" opacity=".16"/><ellipse cx="150" cy="135" rx="10" ry="6" fill="#FF6B86" opacity=".16"/>
      <ellipse cx="88" cy="127" rx="7" ry="2.6" fill="#fff" opacity=".14"/><ellipse cx="152" cy="127" rx="7" ry="2.6" fill="#fff" opacity=".14"/>
      ${brow(98, 112, o, -1, false)}${brow(142, 112, o, 1, wink)}
      ${eye(id, 98, 112, o, false, -1)}${eye(id, 142, 112, o, wink, 1)}
      <path d="M118 123Q115 133 121 135Q125 135.5 127.5 132.5" stroke="${SD}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      ${mouth(o)}`;
    const shades = o.shades ? `<g><path d="M84 41h31q2 13 -15 14q-17 -1 -16 -14zM125 41h31q1 14 -16 14q-17 -1 -15 -14z" fill="#1E1A2E"/><path d="M115 43h10" stroke="#1E1A2E" stroke-width="3"/><path d="M90 45l7 6M131 45l7 6" stroke="#fff" stroke-width="2.6" opacity=".5" stroke-linecap="round"/></g>` : '';
    const art = hr.back + outfit(o, id) + ears(o) + face + hr.front + shades + earwear(o) + pose(o, id);
    return `<svg class="pav" viewBox="${FRAMES[frame]}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${defs}${bgArt}<g${sticker ? ` filter="url(#${id}f)"` : ''}>${art}</g></svg>`;
  }

  function mount(root) {
    (root || document).querySelectorAll('[data-pav]').forEach((el) => {
      if (el.dataset.pavDone) return;
      const d = el.dataset, opt = {};
      if (d.frame) opt.frame = d.frame;
      if (d.pose) opt.pose = d.pose;
      if (d.expr) opt.expr = d.expr;
      if (d.bg) opt.bg = d.bg.split(',');
      if (!PEOPLE[d.pav]) return;
      el.insertAdjacentHTML('afterbegin', svg(d.pav, opt));
      el.dataset.pavDone = '1';
    });
  }

  window.PauseAvatar = { svg, mount, PEOPLE, BG, shade: sh };
})();
