// PAUSE — kundli (Ashtakoota guna milan, 36 points) from Moon positions.
// Moon position: astronomy-engine (geocentric, true ecliptic of date) minus Lahiri ayanamsa.
const A = require('astronomy-engine');

const NAK = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
  'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula',
  'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];
const RASHI = ['Mesh', 'Vrishabh', 'Mithun', 'Kark', 'Simha', 'Kanya', 'Tula', 'Vrishchik', 'Dhanu', 'Makar', 'Kumbh', 'Meen'];
const SPAN = 360 / 27;

// dob 'YYYY-MM-DD', time 'HH:MM' in IST (born in India).
function moonSidereal(dob, time) {
  const [y, m, d] = String(dob).slice(0, 10).split('-').map(Number);
  const [hh, mm] = String(time).split(':').map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const utc = new Date(Date.UTC(y, m - 1, d, hh, mm) - 330 * 60000);
  const ecl = A.EclipticGeoMoon(A.MakeTime(utc));
  const years = (utc.getTime() - Date.UTC(2000, 0, 1, 12)) / (365.25 * 864e5);
  const ayanamsa = 23.857 + years * (50.2788 / 3600);
  return ((ecl.lon - ayanamsa) % 360 + 360) % 360;
}

// Someone who knows their Rashi + Nakshatra from a family kundli: use the middle of the overlap.
function fromManual(rashi, nak) {
  const r0 = rashi * 30, r1 = r0 + 30, n0 = nak * SPAN, n1 = n0 + SPAN;
  const lo = Math.max(r0, n0), hi = Math.min(r1, n1);
  if (!(rashi >= 0 && rashi < 12 && nak >= 0 && nak < 27) || hi <= lo) return null;
  return (lo + hi) / 2;
}

function chart(long) {
  if (long === null || long === undefined) return null;
  const nak = Math.floor(long / SPAN), rashi = Math.floor(long / 30);
  return { rashi, nak, rashi_name: RASHI[rashi], nak_name: NAK[nak], pada: Math.floor((long % SPAN) / (SPAN / 4)) + 1 };
}

// ---- the eight kootas ----
const VARNA = [3, 2, 1, 4, 3, 2, 1, 4, 3, 2, 1, 4]; // 4 Brahmin, 3 Kshatriya, 2 Vaishya, 1 Shudra
function vashyaGroup(long) { // 0 Chatushpada, 1 Manava, 2 Jalachara, 3 Vanachara, 4 Keeta
  const r = Math.floor(long / 30), deg = long % 30;
  return [0, 0, 1, 2, 3, 1, 1, 4, deg < 15 ? 1 : 0, deg < 15 ? 0 : 2, 1, 2][r];
}
const VASHYA = [[2, 1, 1, 0.5, 1], [1, 2, 0.5, 0, 1], [1, 0.5, 2, 1, 1], [0.5, 0, 1, 2, 0], [1, 1, 1, 0, 2]];
// Yoni animals: 0 Horse 1 Elephant 2 Sheep 3 Serpent 4 Dog 5 Cat 6 Rat 7 Cow 8 Buffalo 9 Tiger 10 Deer 11 Monkey 12 Mongoose 13 Lion
const YONI_OF = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1];
const YONI = [
  [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1], [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0], [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
  [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2], [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1], [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
  [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2], [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1], [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
  [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1], [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1], [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
  [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2], [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4]];
// Planets: 0 Sun 1 Moon 2 Mars 3 Mercury 4 Jupiter 5 Venus 6 Saturn
const LORD = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4];
const REL = [ // 1 friend, 0 neutral, -1 enemy
  [1, 1, 1, 0, 1, -1, -1], [1, 1, 0, 1, 0, 0, 0], [1, 1, 1, -1, 1, 0, 0], [1, -1, 0, 1, 0, 1, 0],
  [1, 1, 1, -1, 1, -1, 0], [-1, -1, 0, 1, 0, 1, 1], [-1, -1, -1, 1, 0, 1, 1]];
const GANA_OF = [0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0]; // 0 Deva 1 Manushya 2 Rakshasa
const GANA = [[6, 6, 1], [5, 6, 0], [1, 0, 6]];
const NADI = (n) => [0, 1, 2, 2, 1, 0][n % 6];

function taraGood(from, to) { const r = (((to - from + 27) % 27) + 1) % 9; return ![3, 5, 7].includes(r); }

// boy / girl = Moon longitudes. Returns { total, parts }.
function gunaMilan(boy, girl) {
  const b = chart(boy), g = chart(girl);
  const parts = [];
  parts.push(['Varna', 1, VARNA[b.rashi] >= VARNA[g.rashi] ? 1 : 0]);
  parts.push(['Vashya', 2, VASHYA[vashyaGroup(boy)][vashyaGroup(girl)]]);
  parts.push(['Tara', 3, (taraGood(g.nak, b.nak) ? 1.5 : 0) + (taraGood(b.nak, g.nak) ? 1.5 : 0)]);
  parts.push(['Yoni', 4, YONI[YONI_OF[b.nak]][YONI_OF[g.nak]]]);
  const lb = LORD[b.rashi], lg = LORD[g.rashi];
  let gm;
  if (lb === lg) gm = 5;
  else {
    const x = REL[lb][lg], y = REL[lg][lb];
    const key = [x, y].sort().join(',');
    gm = { '1,1': 5, '0,1': 4, '0,0': 3, '-1,1': 1, '-1,0': 0.5, '-1,-1': 0 }[key];
  }
  parts.push(['Graha Maitri', 5, gm]);
  parts.push(['Gana', 6, GANA[GANA_OF[b.nak]][GANA_OF[g.nak]]]);
  const d = ((b.rashi - g.rashi + 12) % 12) + 1;
  parts.push(['Bhakoot', 7, [2, 12, 5, 9, 6, 8].includes(d) ? 0 : 7]);
  parts.push(['Nadi', 8, NADI(b.nak) === NADI(g.nak) ? 0 : 8]);
  const total = parts.reduce((s, p) => s + p[2], 0);
  return { total, parts: parts.map(([name, max, got]) => ({ name, max, got })) };
}

// Works for any pair: man–woman uses the traditional roles; otherwise the average of both directions.
function pairScore(a, b) {
  if (a.moon_long == null || b.moon_long == null) return null;
  if (a.gender === 'man' && b.gender === 'woman') return gunaMilan(a.moon_long, b.moon_long);
  if (a.gender === 'woman' && b.gender === 'man') return gunaMilan(b.moon_long, a.moon_long);
  const x = gunaMilan(a.moon_long, b.moon_long), y = gunaMilan(b.moon_long, a.moon_long);
  return { total: Math.round((x.total + y.total)) / 2, parts: x.parts.map((p, i) => ({ ...p, got: (p.got + y.parts[i].got) / 2 })) };
}
const label = (t) => (t >= 33 ? 'Excellent' : t >= 25 ? 'Very good' : t >= 18 ? 'Good' : 'Low');

module.exports = { NAK, RASHI, moonSidereal, fromManual, chart, gunaMilan, pairScore, label };
