/* PAUSE object stickers: glossy die-cut illustrations used everywhere a person isn't being shown.
   Usage: PauseObj.svg('kulhad') or <span data-obj="kulhad"></span> + PauseObj.mount() */
(function () {
  let uid = 0;
  const RING = (id) => `<filter id="${id}f" x="-20%" y="-20%" width="140%" height="145%"><feMorphology in="SourceAlpha" operator="dilate" radius="4.5" result="d"/><feOffset in="d" dy="5" result="dd"/><feGaussianBlur in="dd" stdDeviation="4" result="db"/><feFlood flood-color="#04202C" flood-opacity=".3"/><feComposite in2="db" operator="in" result="shd"/><feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="ring"/><feMerge><feMergeNode in="shd"/><feMergeNode in="ring"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  const lg = (id, a, b, x2 = 0.3, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const shine = (d) => `<path d="${d}" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none" opacity=".45"/>`;

  const ART = {
    mask: (g) => [lg(g, '#FF9A85', '#E8452F'), `
      <path d="M8 52C8 36 24 29 41 33C51 36 56 41 60 45C64 41 69 36 79 33C96 29 112 36 112 52C112 73 97 86 80 84C70 83 64 76 60 70C56 76 50 83 40 84C23 86 8 73 8 52Z" fill="url(#${g})"/>
      <ellipse cx="38" cy="56" rx="13" ry="8.5" fill="#08263A" transform="rotate(-8 38 56)"/><ellipse cx="82" cy="56" rx="13" ry="8.5" fill="#08263A" transform="rotate(8 82 56)"/>
      ${shine('M20 44Q30 36 44 38')}<g fill="#FFD166"><circle cx="60" cy="38" r="3.2"/><circle cx="26" cy="72" r="2.4"/><circle cx="94" cy="72" r="2.4"/></g>`],
    kulhad: (g) => [lg(g, '#E58A5C', '#A9492A', 1, 0.2), `
      <path d="M34 26q-6 -8 0 -15t0 -14M58 24q-6 -8 0 -15t0 -14M82 26q-6 -8 0 -15t0 -14" stroke="#B5CBCF" stroke-width="3.4" fill="none" stroke-linecap="round" transform="translate(0 12)"/>
      <path d="M27 48h66l-6 42q-2 11 -13 13q-14 3 -28 0q-11 -2 -13 -13z" fill="url(#${g})"/>
      <ellipse cx="60" cy="48" rx="34" ry="9" fill="#C45F38"/><ellipse cx="60" cy="49" rx="28" ry="6" fill="#D9A06E"/><ellipse cx="54" cy="48" rx="9" ry="2" fill="#fff" opacity=".35"/>
      <path d="M31 72q29 8 58 0" stroke="#7E3219" stroke-width="3" fill="none" opacity=".5"/>${shine('M36 60l-3 30')}`],
    rings: (g) => [lg(g, '#FFE08A', '#D9971E'), `
      <circle cx="46" cy="70" r="26" fill="none" stroke="url(#${g})" stroke-width="10"/>
      <circle cx="76" cy="62" r="26" fill="none" stroke="url(#${g})" stroke-width="10"/>
      <path d="M68 85A26 26 0 0 1 64 60" stroke="url(#${g})" stroke-width="10" fill="none"/>
      <path d="M76 22l10 10l-10 12l-10 -12z" fill="#CFF7FF" stroke="#8FD8E8" stroke-width="2"/><path d="M66 32h20" stroke="#8FD8E8" stroke-width="2"/>
      <path d="M26 56Q30 48 38 46" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".6"/>`],
    star: (g) => [lg(g, '#FFE592', '#F5A524'), `
      <path d="M58 8C62 40 76 54 108 58C76 62 62 76 58 108C54 76 40 62 8 58C40 54 54 40 58 8Z" fill="url(#${g})"/>
      
      ${shine('M50 34Q54 46 46 52')}`],
    shield: (g) => [lg(g, '#A6F3DB', '#2FB78F'), `
      <path d="M60 8L102 22V54C102 82 84 100 60 112C36 100 18 82 18 54V22Z" fill="url(#${g})"/>
      <path d="M40 58l14 14l28 -30" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${shine('M30 30L52 22')}`],
    moon: (g) => [lg(g, '#FFE9A6', '#F4B23A'), `
      <path d="M74 10A50 50 0 1 0 108 86A42 42 0 1 1 74 10Z" fill="url(#${g})"/>
      <circle cx="44" cy="70" r="5" fill="#E09A22" opacity=".45"/><circle cx="58" cy="90" r="3.5" fill="#E09A22" opacity=".45"/>
      ${shine('M30 40Q34 28 46 20')}`],
    pause: (g) => [lg(g, '#FF8E7A', '#EE4D36'), `
      <rect x="12" y="12" width="96" height="96" rx="28" fill="url(#${g})"/>
      <rect x="44" y="36" width="11" height="48" rx="5.5" fill="#08263A"/><rect x="65" y="36" width="11" height="48" rx="5.5" fill="#08263A"/>${shine('M26 40Q28 28 40 26')}`],
    pin: (g) => [lg(g, '#FF8E7A', '#E2432D'), `
      <path d="M60 8C36 8 20 25 20 48C20 78 60 112 60 112C60 112 100 78 100 48C100 25 84 8 60 8Z" fill="url(#${g})"/>
      <circle cx="60" cy="47" r="20" fill="#fff"/><path d="M60 58c-9-6-11-12-7.5-14.5c2.5-1.8 6-.6 7.5 1.8c1.5-2.4 5-3.6 7.5-1.8c3.5 2.5 1.5 8.5-7.5 14.5z" fill="#FF6B57"/>${shine('M32 34Q36 22 48 18')}`],
    heart: (g, c) => [lg(g, (c || ['#FF8F7D', '#E8384F'])[0], (c || ['#FF8F7D', '#E8384F'])[1]), `
      <path d="M60 106C22 82 8 62 12 40C16 20 40 12 54 27L60 33L66 27C80 12 104 20 108 40C112 62 98 82 60 106Z" fill="url(#${g})"/>${shine('M26 36Q30 26 40 26')}`],
    chat: (g) => [lg(g, '#B4F5E2', '#4FD1AE'), `
      <path d="M22 16h76q14 0 14 14v40q0 14 -14 14H56L34 104V84H22q-14 0 -14 -14V30q0 -14 14 -14Z" fill="url(#${g})"/>
      <g fill="#08263A"><circle cx="40" cy="50" r="6"/><circle cx="60" cy="50" r="6"/><circle cx="80" cy="50" r="6"/></g>${shine('M20 30Q22 24 30 24')}`]
  };

  function svg(name, opt) {
    const id = 'po' + (uid++), o = opt || {};
    const make = ART[name]; if (!make) return '';
    const [grad, art] = make(id + 'g', o.colors);
    return `<svg class="pobj" viewBox="-8 -8 136 140" aria-hidden="true"><defs>${grad}${RING(id)}</defs><g filter="url(#${id}f)">${art}</g></svg>`;
  }
  function mount(root) {
    (root || document).querySelectorAll('[data-obj]').forEach((el) => {
      if (el.dataset.objDone || !ART[el.dataset.obj]) return;
      el.insertAdjacentHTML('afterbegin', svg(el.dataset.obj, el.dataset.colors ? { colors: el.dataset.colors.split(',') } : null));
      el.dataset.objDone = '1';
    });
  }
  window.PauseObj = { svg, mount, names: Object.keys(ART) };
})();
