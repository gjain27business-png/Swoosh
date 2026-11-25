// PAUSE — "Ask PAUSE" help bot. Rule-based: answers rules, how-tos and account status.
// It never reads anyone's chats. Anything it can't answer goes to a human via a support ticket.
const CHIPS = ['How does Masked work?', 'What is Destiny?', 'Why only five matches?', 'Is my verification done?', 'Kundli matching', 'Safety and emergencies', 'Report someone', 'Talk to a person'];

const STATUS = {
  new: 'You haven’t finished step 2 yet. Finish your profile, then link your Instagram or LinkedIn. A real person checks it, usually within a few hours. An ID check is optional.',
  pending: 'You’re in the queue. A real person is checking your profile and links, usually within a few hours. If you added an ID, we delete the ID photo and selfie once we decide.',
  verified: 'You’re verified. For the ID-verified badge, add an optional ID check from your Profile. ID photos and selfies are deleted after the check.',
  rejected: 'Your last check didn’t pass. Open the app to see the reason; you can try again with a different link or clearer photos.',
  banned: 'This account has been banned after a review. If you think this is a mistake, write to our grievance officer.'
};

const INTENTS = [
  { k: ['masked', 'mask', 'unmask', 'blur', 'hidden photo', 'photo hide', 'photos hidden', 'chehra'], a: () =>
    'Masked keeps photos hidden. If either of you is masked, you both stay masked in picks and chat. When you’re ready, tap Unmask. Photos open only when BOTH of you tap it. You can turn Masked on or off in any category from your profile.' },
  { k: ['destiny', 'questionnaire', 'questions', '9 pm', '9pm', 'drop', 'kismat', 'compatib'], a: () =>
    'Destiny is optional. Turn it on in a category and answer 12 quick questions (about 3 minutes). You’ll see a match % on your picks, and every night at 9 pm you get one hand-picked Destiny match with the reasons you fit.' },
  { k: ['5 matches', 'five matches', '5 chats', 'five', 'focus', 'limit', 'only 5', 'more matches', 'more chats', 'why 5', 'slots', 'no matches', 'not getting matches'], a: () =>
    'Everyone on PAUSE, men and women alike, can have up to 5 active matches. There’s no limit on browsing. At 5 matches, new matches pause: you can keep exploring, but you can’t like anyone new and you won’t appear in other people’s picks. If someone you liked likes you back while you’re full, it waits and becomes a match when a slot frees up. To make room, end a match from the chat menu.' },
  { k: ['category', 'categories', 'steady', 'forever', 'after dark', 'afterdark', 'mode', 'switch'], a: () =>
    'Three categories: Steady (dating that’s going somewhere), Forever (marriage-minded, kundli optional) and After Dark (casual, honest, still fully verified). You only meet people in the same category. You can switch once a week from your profile.' },
  { k: ['verify', 'verification', 'verified', 'id', 'aadhaar', 'pan', 'selfie', 'instagram', 'linkedin', 'badge', 'approve', 'approval', 'queue', 'kab'], a: (u) =>
    u ? STATUS[u.status] || STATUS.new : 'To join, link your Instagram or LinkedIn and a real person checks it. Only our reviewers see the link. For an ID-verified badge you can also add PAN, driving licence, Voter ID or passport plus a selfie; we delete both images after the check. We don’t accept Aadhaar.' },
  { k: ['kundli', 'guna', 'gun milan', 'nakshatra', 'rashi', 'manglik', 'astrology'], a: () =>
    'Kundli is only in Forever, and it’s optional. Add your birth time (we calculate your Moon sign and Nakshatra) or pick your Rashi and Nakshatra yourself. When both people have it on, picks show a guna score out of 36, and you can filter by a minimum score.' },
  { k: ['horoscope', 'zodiac', 'sun sign', 'star sign'], a: () =>
    'Zodiac is optional in Steady and After Dark. Turn on “Show my zodiac sign” in your profile and your sign appears on your card. It’s never used to hide anyone.' },
  { k: ['emergency', 'emergencies', 'unsafe', 'danger', 'help me', 'sos', '112', 'scared', 'police'], a: () =>
    'If you’re in danger, call 112 now. In the app, Safety has a button that sends your live location to your trusted person on WhatsApp, and a date plan you can share before meeting.' },
  { k: ['safe', 'safety', 'meet', 'first date', 'date plan', 'trusted'], a: () =>
    'Before a first meet: meet in a busy public place, share your date plan with a trusted person from the Safety tab, and keep the chat on PAUSE until you trust them. Numbers stay hidden until you both tap Share numbers.' },
  { k: ['report', 'harass', 'abuse', 'fake', 'block', 'creep', 'rude'], a: () =>
    'Open the chat, tap ⋮ and choose Report or Block. Reporting also blocks them. A real person reviews every report; a ban blocks their ID forever, so they can’t make a new account.' },
  { k: ['scam', 'money', 'upi', 'crypto', 'investment', 'otp', 'loan'], a: () =>
    'Never send money, OTPs or “investment” deposits to someone you met online — even if the story sounds real. PAUSE flags messages that ask for money, crypto or OTPs. Report them from the chat menu.' },
  { k: ['screenshot', 'screen shot', 'leak', 'save photo'], a: () =>
    'Photos you see are watermarked with your account code, so a leaked screenshot can be traced back to the account that took it. A website can’t block screenshots, so that’s how we discourage them.' },
  { k: ['number', 'phone number', 'contact', 'instagram', 'whatsapp', 'share number'], a: () =>
    'Numbers and social handles stay hidden. When you’re both ready, either of you taps Share numbers and the other accepts. Until then, numbers and handles can’t be sent in chat.' },
  { k: ['pause mode', 'take a pause', 'hide profile', 'break', 'invisible', 'snooze'], a: () =>
    'Take a pause: in Safety, switch on “Take a pause”. You disappear from picks; your existing chats continue. Switch it off anytime.' },
  { k: ['delete', 'remove account', 'close account', 'deactivate'], a: () =>
    'Safety → Delete my account. It removes your profile, photos and chats permanently. If you only need a break, use Take a pause instead.' },
  { k: ['price', 'cost', 'pay', 'free', 'premium', 'subscription', 'refund', 'charge'], a: () =>
    'PAUSE is free while we launch in Bangalore. If we add paid features later, we’ll tell you before anything is charged, and refunds will follow the policy on the website.' },
  { k: ['city', 'cities', 'bangalore', 'delhi', 'mumbai', 'pune', 'hyderabad', 'available', 'where'], a: (u, cities) =>
    `PAUSE is live in ${cities.join(' and ')}. In other cities you can still sign up and verify; you’ll get picks the day your city opens.` },
  { k: ['data', 'privacy', 'personal', 'dpdp', 'store'], a: () =>
    'We keep the minimum: your profile, photos and chats. ID photos and selfies are deleted after verification. You can delete everything anytime. Details are in the Privacy Policy.' },
  { k: ['grievance', 'complaint', 'officer', 'legal', 'rules', 'terms', 'regulation'], a: () =>
    'Our rules are in the Terms (18+ only, one person one account, no harassment, no money requests, no explicit content). For complaints you can reach our grievance officer — details are on the Grievance page; we acknowledge within 24 hours.' },
  { k: ['game', 'this or that', 'truth', 'lie', 'play'], a: () =>
    'In any chat, tap the game button: “This or that” (answers show once you’ve both picked) or “Two truths, one lie”. It’s the easiest way to break the ice before you unmask.' },
  { k: ['human', 'agent', 'person', 'talk to', 'support', 'contact us', 'customer care'], a: () =>
    'Sure — write your question below and tap Send to our team. A person replies on your registered number or email.', human: true }
];

function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }

function answer(text, user, cities) {
  const t = ' ' + norm(text) + ' ';
  let best = null, bestScore = 0;
  for (const it of INTENTS) {
    let s = 0;
    for (const k of it.k) if (t.includes(' ' + norm(k)) || t.includes(norm(k) + ' ')) s += k.length > 4 ? 2 : 1;
    if (s > bestScore) { best = it; bestScore = s; }
  }
  if (!best) {
    return { answer: 'I’m not sure about that one. Try one of these, or send it to our team and a person will reply.', chips: CHIPS, human: true };
  }
  return { answer: best.a(user, cities), chips: CHIPS.slice(0, 6), human: !!best.human };
}

module.exports = { answer, CHIPS };
