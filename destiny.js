// PAUSE — Destiny questionnaires (one per category) and scoring.
// Each question: k = short label used in "why you match", w = weight, ord = options are a scale (neighbours get half credit).
const Q = {
  steady: [
    { id: 's1', k: 'First date', q: 'Your ideal first date?', opts: ['Coffee and a long walk', 'Dinner somewhere nice', 'Something fun: bowling, games', 'Try something new together'], w: 1 },
    { id: 's2', k: 'Texting', q: 'How much do you like to text?', opts: ['All day', 'A few times a day', 'Once a day is fine', 'Just call me'], w: 1.5, ord: true },
    { id: 's3', k: 'Weekends', q: 'A perfect weekend looks like…', opts: ['Out with friends', 'Home, food, a show', 'Outdoors or a short trip', 'A bit of everything'], w: 1 },
    { id: 's4', k: 'Love language', q: 'You feel most loved through…', opts: ['Kind words', 'Time together', 'Little gifts', 'Help and effort', 'Hugs and closeness'], w: 1.5 },
    { id: 's5', k: 'Fights', q: 'After an argument you…', opts: ['Talk it out right away', 'Need some space first', 'Write it out', 'Laugh it off'], w: 1.5 },
    { id: 's6', k: 'Friends', q: 'When should your date meet your friends?', opts: ['Early, why not', 'After a few months', 'When it is serious'], w: 1, ord: true },
    { id: 's7', k: 'Plans', q: 'You are more…', opts: ['Spontaneous', 'A planner', 'Depends on the day'], w: 1 },
    { id: 's8', k: 'Pace', q: 'How fast do you fall for someone?', opts: ['Slow burn', 'Let it flow', 'I know quickly'], w: 1, ord: true },
    { id: 's9', k: 'Drinks', q: 'Do you drink?', opts: ['Never', 'Socially', 'Regularly'], w: 1.5, ord: true },
    { id: 's10', k: 'Smoking', q: 'Do you smoke?', opts: ['No', 'Sometimes', 'Yes'], w: 2, ord: true },
    { id: 's11', k: 'One year from now', q: 'If it works out, one year from now you want…', opts: ['Exclusive and serious', 'Still seeing where it goes', 'Talking about the future'], w: 2, ord: true },
    { id: 's12', k: 'Chai or coffee', q: 'Chai or coffee?', opts: ['Chai', 'Coffee', 'Both', 'Neither'], w: 0.5 }
  ],
  forever: [
    { id: 'f1', k: 'Marriage timeline', q: 'When would you like to get married?', opts: ['Within a year', 'In 1–2 years', 'In 2–3 years', 'When it feels right'], w: 2.5, ord: true },
    { id: 'f2', k: 'Living', q: 'After marriage you would live…', opts: ['In our own place', 'With family', 'Flexible'], w: 2 },
    { id: 'f3', k: 'Kids', q: 'Kids?', opts: ['Want them', 'Open to it', 'Don’t want them'], w: 3, ord: true },
    { id: 'f4', k: 'Religion', q: 'How important is religion in daily life?', opts: ['Very important', 'Somewhat', 'Not important'], w: 2, ord: true },
    { id: 'f5', k: 'Food at home', q: 'Food at home will be…', opts: ['Veg', 'Jain food', 'Eggetarian', 'Non-veg is fine', 'No preference'], w: 2 },
    { id: 'f6', k: 'Careers', q: 'Work after marriage?', opts: ['Both keep working', 'One stays home', 'Flexible'], w: 2 },
    { id: 'f7', k: 'Family say', q: 'How much should families be involved in decisions?', opts: ['A lot', 'Balanced', 'Very little'], w: 1.5, ord: true },
    { id: 'f8', k: 'Money', q: 'Money as a couple?', opts: ['Fully joint', 'Separate', 'A mix'], w: 1.5 },
    { id: 'f9', k: 'Moving', q: 'Would you move cities for your partner?', opts: ['Yes, anywhere', 'Within India', 'Prefer not to'], w: 1.5, ord: true },
    { id: 'f10', k: 'Traditions', q: 'Festivals and traditions?', opts: ['Celebrate them all', 'The big ones', 'Not really my thing'], w: 1, ord: true },
    { id: 'f11', k: 'Kundli', q: 'Kundli matching is…', opts: ['A must', 'Nice to have', 'Not needed'], w: 1.5, ord: true },
    { id: 'f12', k: 'Sundays', q: 'Sundays after marriage?', opts: ['Family time', 'Friends', 'Just us two', 'A mix'], w: 1 }
  ],
  afterdark: [
    { id: 'a1', k: 'Here for', q: 'What are you here for?', opts: ['Fun dates', 'Late-night conversations', 'See where it goes', 'Not sure yet'], w: 2 },
    { id: 'a2', k: 'Pace', q: 'Your pace?', opts: ['Take it slow', 'Go with the flow', 'Know what I want'], w: 2, ord: true },
    { id: 'a3', k: 'Ideal night', q: 'Ideal night out?', opts: ['Rooftop drinks', 'A long late drive', 'Gig or club', 'Quiet late-night café'], w: 1 },
    { id: 'a4', k: 'Exclusivity', q: 'Seeing other people?', opts: ['One at a time', 'Open to it', 'Let’s talk about it'], w: 2 },
    { id: 'a5', k: 'Boundaries', q: 'When do you talk boundaries?', opts: ['Before we meet', 'On the first date', 'As it comes up'], w: 1.5, ord: true },
    { id: 'a6', k: 'Clock', q: 'Night owl or early bird?', opts: ['Night owl', 'Early bird', 'Both, somehow'], w: 1 },
    { id: 'a7', k: 'Texting', q: 'Your texting style?', opts: ['Witty banter', 'Straight to the point', 'Voice notes'], w: 1 },
    { id: 'a8', k: 'Privacy', q: 'Keep it private?', opts: ['Totally private', 'Close friends can know', 'Don’t mind who knows'], w: 1.5, ord: true },
    { id: 'a9', k: 'Drinks', q: 'Do you drink?', opts: ['Never', 'Socially', 'Regularly'], w: 1.5, ord: true },
    { id: 'a10', k: 'Smoking', q: 'Do you smoke?', opts: ['No', 'Sometimes', 'Yes'], w: 1.5, ord: true },
    { id: 'a11', k: 'First meet', q: 'First meet should be at…', opts: ['A busy café', 'A bar', 'An event or gig'], w: 1 },
    { id: 'a12', k: '1 am playlist', q: 'Music at 1 am?', opts: ['Bollywood', 'Punjabi', 'Indie', 'Lo-fi', 'EDM'], w: 0.5 }
  ]
};

// Returns { pct, reasons[] } using only questions both people answered.
function score(mode, a, b) {
  const qs = Q[mode] || [];
  let got = 0, total = 0;
  const same = [];
  for (const q of qs) {
    const x = a && a[q.id], y = b && b[q.id];
    if (x === undefined || y === undefined) continue;
    total += q.w;
    if (x === y) { got += q.w; same.push(q); } else if (q.ord && Math.abs(x - y) === 1) got += q.w / 2;
  }
  if (!total) return null;
  same.sort((p, q) => q.w - p.w);
  return {
    pct: Math.round((got / total) * 100),
    reasons: same.slice(0, 3).map((q) => `${q.k}: you both said “${q.opts[a[q.id]]}”`)
  };
}
function valid(mode, answers) {
  const qs = Q[mode];
  if (!qs || !answers || typeof answers !== 'object') return null;
  const out = {};
  for (const q of qs) {
    const v = parseInt(answers[q.id], 10);
    if (!(v >= 0 && v < q.opts.length)) return null;
    out[q.id] = v;
  }
  return out;
}
module.exports = { QUESTIONS: Q, score, valid };
