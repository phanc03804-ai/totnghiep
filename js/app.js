import * as W from './world.js?v=20261128b'; // đổi số v mỗi lần cập nhật để điện thoại không dùng bản cũ

/* ================= CẤU HÌNH (sửa nội dung ở đây) ================= */
const CFG = {
  API: 'https://script.google.com/macros/s/AKfycbyYKIRBcJRA3APnx04jQ56R9HeU1h6EeappjTL5wnRkGikVjYyIOqNAu5V19xpGM8xi/exec',
  quiz: [
    { q: '{Khach} có nhớ ngày sinh của Cường không?', opts: ['20/01/2004', '02/10/2004', '20/10/2003', '21/01/2004'], a: 0 },
    { q: 'Cân nặng hiện tại của Cường là bao nhiêu?', opts: ['80 kg', '68 kg', '74 kg', '90 kg'], a: 0 },
    { q: 'Nhà Cường ở đâu?', opts: ['TP. Hồ Chí Minh', 'Bà Rịa – Vũng Tàu', 'Đồng Nai', 'Bình Dương'], a: 0 },
    { q: '{Khach} có thích {cuong} không?', yn: true },
    { q: '5 năm nữa {khach} vẫn đồng hành cùng {cuong} chứ?', yn: true },
  ],
  qTime: 10,
  flight: 'Thanh Xuân 2026',
  time: '15:00 – 17:30',
  phone: '',          // [xác nhận] số điện thoại in trên thiệp mời, để trống thì ẩn dòng Liên hệ
  passportPhoto: 'img/passport.jpg', // ảnh trong con dấu hộ chiếu (ảnh cầm cây chày) – chưa có thì dùng face.jpg
  faces: { checkin: 'img/cuong-face.jpg', gate: 'img/gate-face.jpg', captain: 'img/captain-face.jpg' }, // ảnh đại diện mỗi nhân vật trong khung thoại
  // biệt danh của Cường ở từng vai trong hội thoại
  nick: { checkin: 'C con cá', gate: 'Cường cọc cằn', captain: 'Cường cơ trưởng' },
  // Chặng 1: video media/video1.mp4 (~20 giây, dọc 9:16). Chưa có file thì hiện thẻ tiêu đề này
  intro: { kick: 'CHẶNG 1', title: 'Khởi hành', line: 'Những ngày đầu bỡ ngỡ.' },
  // Chặng 2: lần lượt từng vật phẩm bay tới; ăn được thì game dừng, hiện poster posterTime giây.
  // img: đường dẫn ảnh poster (ví dụ 'media/posters/p1.jpg'), để trống thì hiện khung chờ ảnh
  items: [
    { emoji: '🧋', name: 'Ly trà sữa', kind: 'NHỮNG NGƯỜI BẠN', title: 'Hội bạn xuyên trưa', text: 'Những buổi cúp tiết, tám chuyện xuyên trưa cùng hội bạn.', img: '' },
    { emoji: '📚', name: 'Cuốn giáo trình', kind: 'NĂM NHẤT', title: 'Đồ án nhóm đầu tiên', text: 'Lần đầu tiên làm đồ án nhóm, học được bao nhiêu điều mới.', img: '' },
    { emoji: '📷', name: 'Chiếc máy ảnh', kind: 'THANH XUÂN', title: 'Chuyến đi xa đầu tiên', text: 'Chuyến đi chơi xa đầu tiên, nơi tụi mình trở thành một phần thanh xuân của nhau.', img: '' },
    { emoji: '🏅', name: 'Huy chương', kind: 'THÀNH TÍCH', title: 'Đại hội Hội Sinh viên', text: 'Đại biểu Đại hội Hội Sinh viên trường lần VI.', img: '' },
    { emoji: '⭐', name: 'Ngôi sao', kind: 'GIA ĐÌNH THỨ HAI', title: 'Đoàn khoa Ngoại ngữ', text: 'Vào Đoàn khoa Ngoại ngữ, quen thêm cả một gia đình thứ hai.', img: '' },
  ],
  posterTime: 10,
  coinGap: 5,   // sau mỗi poster: số giây chỉ có xu, rồi mới bay tới vật phẩm tiếp theo
  // Chặng 3: giông bão, chạm vào điểm sáng phía xa → máy bay bay vào ánh sáng → montage + 3 poster
  storm: {
    words: ['Deadline', 'Thi lại', 'Áp lực điểm số', 'Mất phương hướng', 'Những đêm thức trắng', 'Khoá luận', 'Đi làm thêm', 'Lo lắng tương lai'],
    lead: 'Không có chuyến bay nào chỉ toàn nắng đẹp. Đã có những lúc {cuong} tưởng chừng muốn bỏ cuộc giữa vùng nhiễu động này…',
    montage: 'media/montage-anhsang.mp4',   // video montage chạy nền khi bay vào ánh sáng (chưa có thì trình chiếu ảnh)
    posterTime: 10,
    // img: poster nhiều ảnh làm bằng Canva (dọc 4:5), ví dụ 'media/posters/giadinh.jpg'
    frames: [
      { label: 'Gia đình', img: '', text: 'Những bữa cơm chờ cửa, những cuộc gọi hỏi "ăn cơm chưa", và cả những lo lắng chưa bao giờ nói thành lời. Gia đình là đường băng đầu tiên cho {cuong} cất cánh.' },
      { label: 'Thầy cô', img: '', text: 'Những bài giảng tận tình, những lần góp ý thẳng thắn, và cả những lúc thầy cô tin {cuong} hơn chính {cuong} tự tin. Thầy cô là người vẽ đường bay.' },
      { label: 'Bạn bè', img: '', text: 'Những cái ôm, những đêm cùng chạy deadline, những chuyến đi không kế hoạch. Bạn bè là những người ngồi chung khoang suốt hành trình.' },
    ],
    end: 'Và {cuong} chưa bao giờ bay một mình. Cảm ơn Gia đình, Thầy cô và Bạn bè đã luôn là ánh sáng giúp {cuong} vững tay lái đi qua giông bão.',
  },
  // Chặng 4: ảnh lễ phục cử nhân (chưa có thì dùng ảnh Cường tách nền)
  gradPhoto: 'img/grad.jpg',
  // Thư cảm ơn chạy trên nền media/montage.mp4 (30–45 giây). Chưa có thì trình chiếu các ảnh dưới đây
  montageFallback: ['media/cards/c1.jpg', 'media/cards/c2.jpg', 'media/cards/c3.jpg', 'media/cards/c4.jpg', 'media/cards/c5.jpg', 'media/cards/c6.jpg'],
  // thư cảm ơn cuối: mỗi nhóm một lá (lá "friend" dùng chung cho bạn bè, crush và "khác")
  letters: {
    family: 'Gửi gia đình thương yêu,\n\nHành trình những năm tháng cao đẳng của con cuối cùng cũng đã hạ cánh an toàn. Sau mỗi chặng bay là những bữa cơm chờ cửa, những lời hỏi han, và cả những lo lắng gia đình chẳng bao giờ nói ra.\n\nCảm ơn gia đình đã luôn là đường băng vững chắc nhất để con dám cất cánh. Tấm bằng này là của con, nhưng niềm vui này là của cả nhà.',
    teacher: 'Kính gửi thầy cô,\n\nEm cảm ơn thầy cô đã kiên nhẫn chỉ đường cho em qua từng chặng bay – từ những ngày năm nhất bỡ ngỡ đến những trang cuối của khoá luận.\n\nNhững bài giảng, những lời góp ý và cả những lần thầy cô tin em hơn em tự tin vào mình, em sẽ mang theo trên mọi hành trình phía trước.',
    work: 'Gửi {ten},\n\nCảm ơn {khach} vì những ngày cùng làm việc, cùng chạy deadline và chia nhau từng ly cà phê. Bên cạnh {khach}, {cuong} học được cách làm việc thật sự chứ không chỉ trên giáo trình.\n\nChuyến bay cao đẳng đã hạ cánh, mong mình vẫn là đồng đội trên những chặng đường mới.',
    friend: 'Gửi {ten},\n\nHành trình những năm tháng cao đẳng cuối cùng cũng đã đến trạm dừng chân đẹp nhất.\n\nCảm ơn {khach} vì đã là một phần không thể thiếu trong chuyến bay thanh xuân của {cuong} – những buổi tám chuyện xuyên trưa, những chuyến đi, và cả những lúc chỉ cần ngồi cạnh nhau là đủ.\n\nMọi kỷ niệm, dù vui hay buồn, {cuong} đều sẽ cất giữ thật kỹ cho những chặng đường mới phía trước.',
  },
  invite: 'Chuyến bay ký ức đã khép lại, nhưng lễ mừng hạ cánh thì không thể thiếu {khach}! Hẹn gặp {khach} tại buổi lễ tốt nghiệp của {cuong} nhé.',
  map: 'https://www.google.com/maps/search/?api=1&query=Nh%C3%A0+h%C3%A1t+H%C3%B2a+B%C3%ACnh+240+%C4%90%C6%B0%E1%BB%9Dng+3+Th%C3%A1ng+2+TP.HCM',
};
// mối quan hệ khách chọn trên vé: xưng hô trong toàn bộ thiệp đổi theo đây.
const REL = {
  family: { label: 'Gia đình', khach: 'gia đình', cuong: 'con', letter: 'family' },
  teacher: { label: 'Thầy cô', khach: 'thầy cô', cuong: 'em', letter: 'teacher' },
  friend: { label: 'Bạn bè', khach: 'anh/chị/em/bạn', cuong: 'em/Cường', letter: 'friend' },
  crush: { label: 'Crush', khach: 'anh/chị/em/bạn', cuong: 'em/Cường', letter: 'friend' },
  work: { label: 'Đồng nghiệp', khach: 'anh/chị/em/bạn', cuong: 'em/Cường', letter: 'work' },
  other: { label: 'Khác', khach: 'anh/chị/em/bạn', cuong: 'em/Cường', letter: 'friend' },
};
const relNow = () => REL[G.rel] || REL.friend;

/* ================= TIỆN ÍCH ================= */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const wait = ms => new Promise(r => setTimeout(r, ms));
const store = {
  get(k, d) { try { const v = localStorage.getItem('tx26_' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('tx26_' + k, JSON.stringify(v)); } catch {} },
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1).replace('.0', '') + 'K' : String(n);
const icon = id => `<svg class="ic"><use href="#i-${id}"/></svg>`;
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
const G = { code: store.get('id', null) || ('g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)), name: store.get('name', ''), rel: store.get('rel', 'friend'), relText: store.get('relText', '') };
// tên ghi vào Sheet kèm mối quan hệ, ví dụ "Lan (crush)"
const guestName = () => G.name + (G.rel === 'friend' || !REL[G.rel] ? '' : ` (${G.rel === 'other' ? (G.relText || 'khác') : REL[G.rel].label.toLowerCase()})`);
store.set('id', G.code);
const T = s => { const r = relNow(); return s.replace(/\{Khach\}/g, cap(r.khach)).replace(/\{khach\}/g, r.khach).replace(/\{Cuong\}/g, cap(r.cuong)).replace(/\{cuong\}/g, r.cuong).replace(/\{ten\}/g, G.name || 'bạn'); };
function seatOf(code) { let h = 0; for (const c of code) h = (h * 31 + c.charCodeAt(0)) >>> 0; return (1 + h % 30) + 'ABCDEF'[h % 6]; }
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2200); }
function confetti(n = 60) {
  const box = $('#confetti'), cols = ['#C9A35B', '#E9CF96', '#EF7A1A', '#1E6BE0', '#FFFFFF'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.style.left = Math.random() * 100 + '%'; c.style.background = cols[i % cols.length];
    c.style.animationDuration = 1.8 + Math.random() * 1.6 + 's'; c.style.animationDelay = Math.random() * .5 + 's';
    box.appendChild(c); setTimeout(() => c.remove(), 4200);
  }
}

/* ================= API (Google Sheet) ================= */
async function apiGet(params) { const r = await fetch(CFG.API + '?' + new URLSearchParams(params)); return r.json(); }
function apiPost(data) {
  return fetch(CFG.API, { method: 'POST', body: JSON.stringify({ ...data, k: G.code, name: data.name ?? guestName() }) }).then(r => r.json()).catch(() => ({ ok: false }));
}

/* ================= ÂM THANH ================= */
const AU = { ctx: null, muted: store.get('muted', false), master: null };
function audio() {
  if (!AU.ctx) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    AU.ctx = new C();
    const comp = AU.ctx.createDynamicsCompressor(); comp.connect(AU.ctx.destination);
    AU.master = AU.ctx.createGain(); AU.master.gain.value = AU.muted ? 0 : .55; AU.master.connect(comp);
    AU.noise = AU.ctx.createBuffer(1, AU.ctx.sampleRate * 2, AU.ctx.sampleRate);
    const d = AU.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (AU.ctx.state === 'suspended') AU.ctx.resume();
  return AU.ctx;
}
function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
function tone(freq, t, dur, type = 'sine', vol = .3, dest) {
  const c = AU.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); env(g, t, .005, vol, dur);
  o.connect(g); g.connect(dest || AU.master); o.start(t); o.stop(t + dur + .05); return o;
}
function noise(t, dur, vol, ftype, f, q = 1) {
  const c = AU.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
  s.buffer = AU.noise; fl.type = ftype; fl.frequency.value = f; fl.Q.value = q; env(g, t, .002, vol, dur);
  s.connect(fl); fl.connect(g); g.connect(AU.master); s.start(t); s.stop(t + dur + .05);
}
const SFX = {
  stamp() { const c = audio(); if (!c) return; const t = c.currentTime; const o = tone(120, t, .25, 'sine', .9); o.frequency.exponentialRampToValueAtTime(40, t + .2); noise(t, .12, .6, 'lowpass', 900); },
  beep() { const c = audio(); if (!c) return; const t = c.currentTime; tone(1760, t, .07, 'square', .1); tone(2093, t + .1, .12, 'square', .1); },
  blip(i = 0) { const c = audio(); if (!c) return; tone([660, 784, 880, 988, 1175, 1319, 1480, 1760][i % 8], c.currentTime, .08, 'triangle', .22); },
  coin() { const c = audio(); if (!c) return; const t = c.currentTime; tone(1319, t, .06, 'square', .07); tone(1976, t + .05, .12, 'square', .07); },
  star() { const c = audio(); if (!c) return; const t = c.currentTime; [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * .06, .3, 'triangle', .16)); },
  hit() { const c = audio(); if (!c) return; const t = c.currentTime; noise(t, .3, .5, 'lowpass', 600); tone(90, t, .3, 'sawtooth', .25); },
  thunder() { const c = audio(); if (!c) return; const t = c.currentTime; noise(t, 1.8, .7, 'lowpass', 260, .6); noise(t, .25, .4, 'lowpass', 1200); },
  err() { const c = audio(); if (!c) return; tone(110, c.currentTime, .2, 'sawtooth', .18); },
  tick() { const c = audio(); if (!c) return; tone(1200, c.currentTime, .03, 'square', .05); },
  win() { const c = audio(); if (!c) return; const t = c.currentTime; [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * .08, .25, 'triangle', .22)); },
  ding() { const c = audio(); if (!c) return; const t = c.currentTime; tone(1175, t, .6, 'sine', .2); tone(880, t + .35, .9, 'sine', .2); },
  type() { const c = audio(); if (!c) return; tone(2200 + Math.random() * 400, c.currentTime, .015, 'square', .015); },
  pop() { const c = audio(); if (!c) return; const t = c.currentTime; noise(t, .5, .35, 'lowpass', 700); tone(200, t, .15, 'sine', .2); },
  step() { const c = audio(); if (!c) return; noise(c.currentTime, .06, .08, 'lowpass', 500); },
};
const ENGINE = { nodes: null, level: 0 };
function engineStart(level = .5) {
  const c = audio(); if (!c) return;
  if (!ENGINE.nodes) {
    const src = c.createBufferSource(); src.buffer = AU.noise; src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = .7;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 2.2;
    const g = c.createGain(), gw = c.createGain(); g.gain.value = 0; gw.gain.value = .12;
    const hum = c.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 62;
    const hf = c.createBiquadFilter(); hf.type = 'lowpass'; hf.frequency.value = 180; const hg = c.createGain(); hg.gain.value = .25;
    src.connect(lp); lp.connect(g); src.connect(bp); bp.connect(gw); gw.connect(g); hum.connect(hf); hf.connect(hg); hg.connect(g); g.connect(AU.master);
    src.start(); hum.start();
    ENGINE.nodes = { src, g, hum };
  }
  ENGINE.level = level;
  if (PAUSE.on) return;
  ENGINE.nodes.g.gain.cancelScheduledValues(c.currentTime);
  ENGINE.nodes.g.gain.setTargetAtTime(level, c.currentTime, .6);
}
function engineStop(fade = 1) {
  if (!ENGINE.nodes || !AU.ctx) return;
  const { src, g, hum } = ENGINE.nodes, t = AU.ctx.currentTime;
  g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, fade / 3);
  setTimeout(() => { try { src.stop(); hum.stop(); } catch {} }, fade * 1500);
  ENGINE.nodes = null;
}

/* Nhạc: nhạc nền (media/bgm.mp3) và nhạc game (media/game.mp3). Chưa có file thì phát bản tự soạn. */
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const CH = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];
const MEL = [[76, 79, 76, 74, 72, null, 74, 76], [74, null, 71, 74, 79, null, 77, 76], [72, 76, 81, 79, 76, null, 74, 72], [69, 72, 77, 76, 74, null, 72, null]];
const SYN = { bus: null, timer: 0, next: 0, step: 0, fn: null, spb: .5 };
function pluck(f, t, vol, dur = .28) {
  const c = AU.ctx, g = c.createGain(); env(g, t, .004, vol, dur); g.connect(SYN.bus);
  [[1, 1], [4, .18], [10, .05]].forEach(([m, v]) => { const o = c.createOscillator(), gg = c.createGain(); o.frequency.value = f * m; gg.gain.value = v; o.connect(gg); gg.connect(g); o.start(t); o.stop(t + dur + .05); });
}
function drum(t, kind, vol) {
  const c = AU.ctx, out = SYN.bus;
  if (kind === 'kick') { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + .12); env(g, t, .003, vol, .24); o.connect(g); g.connect(out); o.start(t); o.stop(t + .3); return; }
  const sN = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); sN.buffer = AU.noise;
  if (kind === 'clap') { fl.type = 'bandpass'; fl.frequency.value = 1700; fl.Q.value = .9; env(g, t, .002, vol, .15); }
  else { fl.type = 'highpass'; fl.frequency.value = 8000; env(g, t, .002, vol, .04); }
  sN.connect(fl); fl.connect(g); g.connect(out); sN.start(t); sN.stop(t + .2);
}
function synthTone(type, f, t, dur, vol, cutoff) {
  const c = AU.ctx, o = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain();
  o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = cutoff; env(g, t, .005, vol, dur);
  o.connect(fl); fl.connect(g); g.connect(SYN.bus); o.start(t); o.stop(t + dur + .05);
}
function songStep(s, t) {
  const i = s % 16, bar = Math.floor(s / 16), sec = bar % 16, ch = CH[bar % 4], full = sec >= 4 && sec < 12, brk = sec >= 12;
  if (!brk && (i === 0 || i === 8 || (full && i === 10))) drum(t, 'kick', .8);
  if (i === 4 || i === 12) drum(t, 'clap', brk ? .22 : .32);
  if (i % 2 === 1 || full) drum(t, 'hat', i % 4 === 2 ? .1 : .05);
  if (!brk && i % 2 === 0) synthTone('triangle', mtof(ch[0] - 24 + (i % 4 === 2 ? 12 : 0)), t, .18, .42, 700);
  if (i % 2 === 0) { const arp = [ch[0], ch[1], ch[2], ch[0] + 12, ch[2], ch[1], ch[0] + 12, ch[1] + 12]; pluck(mtof(arp[i / 2] + 12), t, brk ? .08 : .13); }
  if (full && i % 2 === 0) { const n = MEL[bar % 4][i / 2]; if (n) { synthTone('triangle', mtof(n), t, .3, .12, 4000); pluck(mtof(n), t, .05, .2); } }
}
function houseStep(s, t) {
  const i = s % 16, bar = Math.floor(s / 16), ch = CH[(bar + 2) % 4], up = bar % 8 >= 4;
  if (i % 4 === 0) drum(t, 'kick', 1);
  if (i === 4 || i === 12) drum(t, 'clap', .4);
  drum(t, 'hat', i % 4 === 2 ? .2 : up ? .07 : .03);
  if (i % 2 === 0) synthTone('sawtooth', mtof(ch[0] - 24), t, .16, .32, i % 4 === 2 ? 900 : 400);
  if (i % 4 === 2) ch.forEach(m => { synthTone('sawtooth', mtof(m), t, .17, .05, 2400); synthTone('sawtooth', mtof(m) * 1.006, t, .17, .04, 2400); });
  if (up) { const arp = [ch[0], ch[1], ch[2], ch[1] + 12, ch[2] + 12, ch[0] + 12]; synthTone('square', mtof(arp[i % 6] + 12), t, .09, .045, 5000); }
}
const TRACKS = { bgm: { el: $('#bgm'), fn: songStep, bpm: 116 }, game: { el: $('#gameMusic'), fn: houseStep, bpm: 128 } };
const MUS = { cur: null, vol: .5, started: false, want: 'bgm' };
const hasFile = el => el && !el.error && el.networkState !== 3;
function fadeEl(el, to, ms, then) {
  const from = el.volume, t0 = performance.now();
  const step = () => { const k = Math.min(1, (performance.now() - t0) / ms); el.volume = Math.max(0, Math.min(1, from + (to - from) * k)); if (k < 1) requestAnimationFrame(step); else then && then(); };
  step();
}
function synthStop() { clearInterval(SYN.timer); SYN.fn = null; if (SYN.bus && AU.ctx) SYN.bus.gain.setTargetAtTime(0, AU.ctx.currentTime, .2); }
function synthStart(tr) {
  const c = audio(); if (!c) return;
  if (!SYN.bus) { SYN.bus = c.createGain(); SYN.bus.gain.value = 0; SYN.bus.connect(AU.master); }
  clearInterval(SYN.timer); SYN.fn = tr.fn; SYN.spb = 60 / tr.bpm; SYN.step = 0; SYN.next = c.currentTime + .1;
  SYN.timer = setInterval(() => { while (SYN.next < c.currentTime + .15) { SYN.fn(SYN.step, SYN.next); SYN.next += SYN.spb / 4; SYN.step++; } }, 25);
}
function musicPlay(name, vol = MUS.vol) {
  MUS.vol = vol;
  if (!MUS.started) { MUS.want = name; return; }
  if (MUS.cur === name) { musicLevel(vol); return; }
  const old = MUS.cur && TRACKS[MUS.cur];
  if (old && hasFile(old.el) && !old.el.paused) fadeEl(old.el, 0, 600, () => old.el.pause());
  synthStop();
  MUS.cur = name; if (!name) return;
  const tr = TRACKS[name];
  if (hasFile(tr.el)) { tr.el.volume = 0; tr.el.play().then(() => fadeEl(tr.el, AU.muted ? 0 : vol, 900)).catch(() => { synthStart(tr); musicLevel(vol); }); }
  else { synthStart(tr); setTimeout(() => musicLevel(vol), 50); }
}
function musicLevel(v, ms = 900) {
  MUS.vol = v; const tr = MUS.cur && TRACKS[MUS.cur]; if (!tr) return;
  if (SYN.fn === tr.fn && SYN.bus && AU.ctx) { SYN.bus.gain.cancelScheduledValues(AU.ctx.currentTime); SYN.bus.gain.setTargetAtTime(v, AU.ctx.currentTime, ms / 3000); }
  else if (hasFile(tr.el)) fadeEl(tr.el, AU.muted ? 0 : v, ms);
}
addEventListener('pointerdown', () => {
  if (MUS.started) return; MUS.started = true; audio();
  const w = MUS.want; MUS.want = null; if (w) musicPlay(w, MUS.vol);
}, { capture: true });
function paintMute() { $('#btnMute').innerHTML = icon(AU.muted ? 'mute' : 'sound'); }
paintMute();
$('#btnMute').onclick = () => {
  AU.muted = !AU.muted; store.set('muted', AU.muted); paintMute();
  if (AU.master) AU.master.gain.value = AU.muted ? 0 : .55;
  $('#vid').muted = AU.muted; musicLevel(MUS.vol, 200);
};

/* ================= HỘI THOẠI KIỂU GTA ================= */
const dlg = $('#dlg');
let dlgSkip = null;
dlg.addEventListener('click', e => { if (e.target.closest('#dlgCh')) return; dlgSkip && dlgSkip(); });
function speaker(on) { const a = W.current() && W.current().agent; if (a) a.userData.talk(on); }
// hiện 1 câu thoại; xong thì chờ người xem chạm (hoặc tự qua sau vài giây)
function say(role, text, { auto = 5200 } = {}) {
  return new Promise(res => {
    const full = T(text); let i = 0, typing = true, timer = 0, autoT = 0;
    dlgRole(role); $('#dlgTx').textContent = ''; $('#dlgCh').innerHTML = ''; $('#dlgCh').className = 'ch';
    dlg.classList.add('on'); dlg.classList.remove('wait'); speaker(true);
    const finish = () => { typing = false; clearInterval(timer); $('#dlgTx').textContent = full; speaker(false); dlg.classList.add('wait'); autoT = setTimeout(done, auto); };
    const done = () => { if (PAUSE.on && autoT) { autoT = setTimeout(done, 400); return; } clearTimeout(autoT); dlgSkip = null; dlg.classList.remove('wait'); res(); };
    dlgSkip = () => typing ? finish() : done();
    timer = setInterval(() => { $('#dlgTx').textContent = full.slice(0, ++i); if (i % 3 === 0) SFX.type(); if (i >= full.length) finish(); }, 24);
  });
}
// tên + ảnh đại diện của người đang nói
function dlgRole(role) { $('#dlgWho').innerHTML = `${esc(role[0])} <i>· ${role[1]}</i>`; $('#dlgPf').style.backgroundImage = `url(${role[2]})`; }
function dlgHide() { dlg.classList.remove('on', 'wait'); speaker(false); dlgSkip = null; }
// câu hỏi có lựa chọn trong khung thoại
function ask(role, text, choices) {
  return new Promise(res => {
    const full = T(text); let i = 0;
    dlgRole(role); $('#dlgTx').textContent = ''; dlg.classList.add('on'); dlg.classList.remove('wait'); speaker(true);
    const ch = $('#dlgCh'); ch.innerHTML = ''; ch.className = 'ch';
    const t = setInterval(() => { $('#dlgTx').textContent = full.slice(0, ++i); if (i % 3 === 0) SFX.type(); if (i >= full.length) { clearInterval(t); speaker(false); choices(ch, v => { ch.innerHTML = ''; res(v); }); } }, 24);
    dlgSkip = null;
  });
}

/* ================= ĐIỀU HƯỚNG ================= */
const S = { stage: '', rsvp: store.get('rsvp', null), cls: null, game: 0, best: store.get('best', 0) };
const ENTER = {}, LEAVE = {};
async function go(id, arg) {
  if (PAUSE.on) pause(false, true);
  dlgHide();
  (LEAVE[S.stage] || (() => {}))();
  S.stage = id;
  const app = $('#app'); app.classList.remove('paper', 'film', 'blur');
  if (id === 'end' || id === 'review') app.classList.add('paper');
  if (id === 'video' || id === 'letter' || id === 'light') app.classList.add('film');
  if (id === 'ticket') app.classList.add('blur');
  $('#btnPause').style.visibility = ['checkin', 'quiz', 'board', 'takeoff', 'video', 'fly', 'storm', 'light', 'landing', 'letter'].includes(id) ? 'visible' : 'hidden';
  const stageEl = { ticket: 's-ticket', checkin: 's-ground', quiz: 's-quiz', board: 's-ground', takeoff: 's-takeoff', video: 's-video', fly: 's-flight', storm: 's-storm', light: 's-light', landing: 's-landing', letter: 's-letter', review: 's-review', end: 's-end' }[id];
  $$('.stage').forEach(s => s.classList.toggle('on', s.id === stageEl));
  const sc = $('#' + stageEl + ' .scroll'); if (sc) sc.scrollTop = 0;
  await (ENTER[id] || (() => {}))(arg);
}

/* Tạm dừng: dừng cảnh 3D, video, nhạc, đồng hồ; menu chơi tiếp / bỏ qua chặng 2 / bỏ qua tới thiệp */
const PAUSE = { on: false, since: 0, vol: 0, vid: null };
function pause(on, quiet = false) {
  if (on === PAUSE.on) return;
  PAUSE.on = on; W.setPaused(on); $('#app').classList.toggle('paused', on);
  $('#pauseOv').classList.toggle('on', on && !quiet);
  const vids = [$('#vid'), $('#montage'), $('#ltVid')];
  if (on) {
    PAUSE.since = performance.now(); PAUSE.vol = MUS.vol; musicLevel(.06, 300);
    PAUSE.vid = vids.filter(v => !v.paused); PAUSE.vid.forEach(v => v.pause());
    if (ENGINE.nodes && AU.ctx) ENGINE.nodes.g.gain.setTargetAtTime(0, AU.ctx.currentTime, .15);
    $('#pSkip2').hidden = !['video', 'fly'].includes(S.stage);
  } else {
    qT0 += performance.now() - PAUSE.since;
    if (quiet) return;
    musicLevel(PAUSE.vol, 400); (PAUSE.vid || []).forEach(v => v.play().catch(() => {}));
    if (ENGINE.nodes) engineStart(ENGINE.level);
  }
}
$('#btnPause').onclick = () => { SFX.blip(1); pause(true); };
$('#pResume').onclick = () => pause(false);
$('#pSkip2').onclick = () => go('storm');
$('#pSkipEnd').onclick = () => go('end');

/* ================= CẢNH 0: VÉ TRÊN ĐIỆN THOẠI ================= */
ENTER.ticket = async () => {
  musicPlay('bgm', .45);
  await W.show('airport', { cam: 'wide' });
  $('#hold').classList.remove('down');
  $('#inName').value = G.name; paintRel(); checkTicket();
  $('#tkName').textContent = G.name || '_ _ _ _ _'; $('#tkSeat').textContent = G.name ? seatOf(G.code) : '—';
};
function paintRel() {
  const picked = store.get('relPicked', false);
  $$('#relBtns button').forEach(b => b.classList.toggle('on', b.dataset.rel === G.rel && picked));
  $('#inRel').hidden = !(picked && G.rel === 'other'); $('#inRel').value = G.relText;
}
function checkTicket() {
  const r = REL[G.rel];
  $('#tkDone').disabled = !($('#inName').value.trim().length >= 1 && store.get('relPicked', false) && r && (G.rel !== 'other' || $('#inRel').value.trim()));
}
$('#inName').addEventListener('input', () => { const v = $('#inName').value.trim(); $('#tkName').textContent = v || '_ _ _ _ _'; checkTicket(); });
$$('#relBtns button').forEach(b => b.onclick = () => { G.rel = b.dataset.rel; store.set('rel', G.rel); store.set('relPicked', true); paintRel(); checkTicket(); SFX.blip(2); if (G.rel === 'other') $('#inRel').focus(); });
$('#inRel').addEventListener('input', () => { G.relText = $('#inRel').value.trim().slice(0, 24); store.set('relText', G.relText); checkTicket(); });
$('#tkDone').onclick = async () => {
  G.name = $('#inName').value.trim().slice(0, 30); store.set('name', G.name);
  $('#tkName').textContent = G.name; $('#tkSeat').textContent = seatOf(G.code); SFX.win(); $('#inName').blur();
  await wait(900);
  $('#hold').classList.add('down');
  await wait(800);
  go('checkin');
};

/* ================= CẢNH 1: QUẦY CHECK-IN ================= */
const DODGE_SAY = ['Ơ kìa…', 'Bấm hụt rồi!', 'Không bắt được đâu', 'Đi đi mà', 'Thôi mà…'];
function makeDodger(btn, area, sayEl, fallbackText, onGiveUp) {
  let n = 0, tired = 0;
  const yes = area.querySelector('.btn');
  const move = e => {
    if (tired) return;
    e.preventDefault(); e.stopPropagation(); n++;
    if (n > DODGE_SAY.length) { tired = Date.now(); Object.assign(btn.style, { left: '0', right: 'auto', top: '64px', width: '100%', fontSize: '13px' }); btn.textContent = fallbackText; sayEl.textContent = ''; return; }
    const a = area.getBoundingClientRect(), b = btn.getBoundingClientRect(), y0 = yes.getBoundingClientRect();
    let x, y;
    for (let i = 0; i < 14; i++) { x = Math.random() * (a.width - b.width); y = Math.random() * (a.height - b.height - 22); if (x > y0.right - a.left || x + b.width < y0.left - a.left || y > y0.bottom - a.top) break; }
    Object.assign(btn.style, { right: 'auto', left: x + 'px', top: y + 'px' });
    sayEl.textContent = DODGE_SAY[n - 1]; SFX.blip(n);
  };
  btn.addEventListener('pointerdown', move);
  btn.addEventListener('click', () => { if (tired && Date.now() - tired > 400) onGiveUp(n); });
}
const ROLE = { checkin: [CFG.nick.checkin, 'NHÂN VIÊN CHECK-IN', CFG.faces.checkin], gate: [CFG.nick.gate, 'NHÂN VIÊN THỦ TỤC', CFG.faces.gate], captain: [CFG.nick.captain, 'CHUYẾN BAY ' + CFG.flight.toUpperCase(), CFG.faces.captain] };
ENTER.checkin = async () => {
  musicPlay('bgm', .3);
  let arrive; const arrived = new Promise(r => arrive = r);
  const stepT = setInterval(SFX.step, 260);
  await W.show('airport', { variant: 'checkin', onArrive: () => arrive() });
  await arrived; clearInterval(stepT);
  if (S.stage !== 'checkin') return;
  SFX.beep(); $('#scanok').classList.add('on'); setTimeout(() => $('#scanok').classList.remove('on'), 1600);
  await say(ROLE.checkin, `Xin chào {ten}! Vé chuyến ${CFG.flight} đây rồi. Chuyến này đặc biệt lắm đó – nó bay qua cả quãng đường cao đẳng của {cuong}.`);
  if (S.stage !== 'checkin') return;
  const go2 = await ask(ROLE.checkin, `Điểm đến là lễ tốt nghiệp, ${CFG.time} thứ Ba 08/12 ở Nhà hát Hòa Bình. {Khach} lên chuyến bay này cùng {cuong} nhé?`, (box, pick) => {
    box.className = 'ch dodge';
    box.innerHTML = `<button class="btn">${icon('check')}Có, đi chứ!</button><button class="dodger">Không đi</button><div class="dodge-say"></div>`;
    box.querySelector('.btn').onclick = () => pick(true);
    makeDodger(box.querySelector('.dodger'), box, box.querySelector('.dodge-say'), 'Bận thật hả? Gửi lời chúc cho Cường nhé', n => { S.dodges = n; pick(false); });
  });
  S.rsvp = { go: go2 }; store.set('rsvp', S.rsvp);
  apiPost({ a: 'rsvp', go: go2, n: go2 ? 1 : 0, dodges: S.dodges || 0 });
  if (go2) { SFX.win(); confetti(40); await say(ROLE.checkin, 'Tuyệt quá! Mời {khach} qua khu kiểm tra thủ tục. Nhớ trả lời đúng nha, không là… vẫn được bay, nhưng {cuong} buồn đó.'); }
  else await say(ROLE.checkin, 'Tiếc ghê… Không sao, {khach} vẫn xem hết chuyến bay và gửi {cuong} một lời chúc nhé.');
  if (S.stage === 'checkin') go('quiz');
};

/* ================= CẢNH 2: KIỂM TRA THỦ TỤC ================= */
let qi = 0, correct = 0, qTimer = 0, qLock = false, qT0 = 0;
ENTER.quiz = async () => {
  $('#ppOv').classList.remove('on'); $('#qSheet').style.display = 'none';
  let arrive; const arrived = new Promise(r => arrive = r);
  const stepT = setInterval(SFX.step, 260);
  await W.show('airport', { variant: 'customs', onArrive: () => arrive() });
  await arrived; clearInterval(stepT);
  if (S.stage !== 'quiz') return;
  await say(ROLE.gate, 'Hộ chiếu của {khach} đây. Trước khi lên máy bay, trả lời giúp {cuong} 5 câu nhé – xem {khach} hiểu {cuong} tới đâu. Mỗi câu 10 giây thôi!');
  if (S.stage !== 'quiz') return;
  dlgHide(); qi = 0; correct = 0; $('#qSheet').style.display = ''; showQ();
};
LEAVE.quiz = () => clearInterval(qTimer);
function showQ() {
  const q = CFG.quiz[qi]; qLock = false;
  $$('#qdots i').forEach((e, i) => e.classList.toggle('on', i <= qi));
  $('#qNo').textContent = `Thủ tục · Câu ${qi + 1}/${CFG.quiz.length}`;
  $('#qText').textContent = T(q.q); $('#qFeed').textContent = '';
  const body = $('#qBody'); body.innerHTML = '';
  if (q.yn) {
    body.innerHTML = `<div class="yn" id="yn"><button class="btn">${icon('heart')}Có</button><button class="dodger">Không</button><div class="dodge-say"></div></div>`;
    body.querySelector('.btn').onclick = () => answer(true);
    makeDodger(body.querySelector('.dodger'), $('#yn'), body.querySelector('.dodge-say'), 'Thôi được rồi, chọn Không', () => answer(false));
  } else {
    const box = document.createElement('div'); box.className = 'opts';
    shuffle(q.opts.map((o, i) => i)).forEach(i => { const b = document.createElement('button'); b.className = 'opt'; b.textContent = q.opts[i]; b.onclick = () => { b.classList.add(i === q.a ? 'right' : 'wrong'); answer(i === q.a); }; box.appendChild(b); });
    body.appendChild(box);
  }
  clearInterval(qTimer);
  const fg = $('#timerFg'), n = $('#timerN'), tm = $('#timer'); qT0 = performance.now(); let lastSec = CFG.qTime;
  qTimer = setInterval(() => {
    if (PAUSE.on) return;
    const left = Math.max(0, CFG.qTime - (performance.now() - qT0) / 1000);
    fg.style.strokeDashoffset = 138.2 * (1 - left / CFG.qTime);
    const sec = Math.ceil(left); n.textContent = sec; tm.classList.toggle('warn', left <= 3);
    if (sec !== lastSec) { lastSec = sec; if (sec <= 3 && sec > 0) SFX.tick(); }
    if (left <= 0) { clearInterval(qTimer); $('#qFeed').textContent = 'Hết giờ!'; SFX.err(); answer(false, true); }
  }, 50);
}
function answer(ok, timeout = false) {
  if (qLock) return; qLock = true; clearInterval(qTimer);
  if (ok) correct++;
  if (!timeout) { $('#qFeed').textContent = ok ? 'Chính xác!' : 'Chưa đúng rồi'; ok ? SFX.blip(4) : SFX.err(); }
  setTimeout(() => { qi++; qi < CFG.quiz.length ? showQ() : finishQuiz(); }, 750);
}
async function finishQuiz() {
  S.cls = correct >= 3 ? 'biz' : 'eco';
  apiPost({ a: 'quiz', score: correct, cls: S.cls });
  $('#qSheet').style.display = 'none';
  await say(ROLE.gate, S.cls === 'biz' ? 'Chuẩn luôn! {Khach} hiểu {cuong} ghê.' : 'Hmm… chuyến bay này sẽ giúp {khach} hiểu {cuong} hơn đó.', { auto: 2500 });
  dlgHide();
  $('#ppName').textContent = G.name;
  const ph = $('#stampImg'); if (!ph.dataset.set) { ph.dataset.set = 1; ph.onerror = () => { ph.onerror = null; ph.src = 'face.jpg'; }; ph.src = CFG.passportPhoto; } $('#ppScore').textContent = `ĐÚNG ${correct}/${CFG.quiz.length} CÂU`;
  const st = $('#stamp'); st.classList.remove('hit');
  $('#ppBook').style.setProperty('--stampc', S.cls === 'biz' ? '#A0670C' : '#1E5BC4');
  $('#stampText').textContent = S.cls === 'biz' ? '★ BUSINESS CLASS · THANH XUÂN 2026 ★' : '★ ECONOMY CLASS · THANH XUÂN 2026 ★';
  $('#ppRes').classList.remove('on'); $('#ppNext').hidden = true; $('#ppOv').classList.add('on');
  setTimeout(() => {
    st.classList.add('hit');
    setTimeout(() => { SFX.stamp(); $('#ppBook').classList.add('shake'); setTimeout(() => $('#ppBook').classList.remove('shake'), 400); }, 260);
    $('#ppRes').innerHTML = S.cls === 'biz' ? '<h2>Hạng Thương gia</h2><p class="muted">Được cộng 20.000 điểm khởi đầu.</p>' : '<h2>Hạng Phổ thông</h2><p class="muted">Ai cũng được bay trọn hành trình như nhau.</p>';
    setTimeout(() => { $('#ppRes').classList.add('on'); $('#ppNext').hidden = false; }, 500);
  }, 700);
}
$('#ppNext').onclick = () => go('board');

/* ================= CẢNH 3: LÊN MÁY BAY ================= */
ENTER.board = async () => {
  let arrive; const arrived = new Promise(r => arrive = r);
  const stepT = setInterval(SFX.step, 530);
  await W.show('boarding', { onArrive: () => arrive() });
  await arrived; clearInterval(stepT);
  if (S.stage !== 'board') return;
  SFX.ding();
  await say(ROLE.captain, `Kính chào quý khách, tôi là Cường, cơ trưởng chuyến bay ${CFG.flight}. Hôm nay chúng ta sẽ cùng bay qua những năm tháng cao đẳng đáng nhớ nhất. Thắt dây an toàn vào, chúng ta cất cánh!`);
  if (S.stage === 'board') go('takeoff');
};
ENTER.takeoff = async () => {
  musicPlay('bgm', .2); engineStart(.25);
  // mở khoá video ngay khi còn trong lượt chạm gần nhất, để lát nữa phát được có tiếng
  const v = $('#vid'); v.muted = AU.muted;
  const el = $('#s-takeoff'); el.classList.remove('win');
  $('#cabinCap').querySelector('h2').textContent = 'Thắt dây an toàn';
  await W.show('takeoff', {
    duration: 11,
    // góc thứ 4 là nhìn qua cửa sổ khoang khách
    onShot: i => { el.classList.toggle('win', i === 3); if (i === 2) { engineStart(.85); vibrate(60); } if (i === 3) $('#cabinCap').querySelector('h2').textContent = 'Chúng ta đang cất cánh'; },
    onEnd: async () => { $('#whiteout').classList.add('on'); await wait(800); go('video'); setTimeout(() => $('#whiteout').classList.remove('on'), 300); },
  });
  setTimeout(() => engineStart(.65), 600);
};

/* ================= CHẶNG 1: VIDEO KHỞI HÀNH ================= */
let vidDone = null;
ENTER.video = async () => {
  engineStop(1.5); W.clear();
  const st = CFG.intro, v = $('#vid');
  $('#vcKick').textContent = st.kick; $('#vcTitle').textContent = st.title; $('#vcLine').textContent = st.line;
  $('#tapPlay').classList.remove('on'); $('#vcard').classList.remove('on');
  const next = () => { if (S.stage !== 'video') return; v.pause(); go('fly'); };
  vidDone = next;
  const ok = await new Promise(res => {
    v.onloadeddata = () => res(true); v.onerror = () => res(false);
    v.src = 'media/video1.mp4'; v.load(); setTimeout(() => res(false), 3500);
  });
  if (S.stage !== 'video') return;
  if (ok) {
    musicPlay(null); v.muted = AU.muted; v.currentTime = 0;
    v.onended = next;
    v.play().catch(() => $('#tapPlay').classList.add('on'));
  } else {
    // chưa có video: hiện thẻ tiêu đề chặng vài giây
    musicPlay('bgm', .35); v.removeAttribute('src');
    $('#vcard').classList.add('on'); SFX.ding();
    setTimeout(next, 4800);
  }
};
LEAVE.video = () => { $('#vid').pause(); };
$('#tapPlay').onclick = () => $('#vid').play().then(() => $('#tapPlay').classList.remove('on')).catch(() => {});

/* ================= CHẶNG 2: MỞ KHOÁ KỶ NIỆM ================= */
let flightApi = null, posterLast = false, hintT = 0;
const itemName = k => CFG.items[k] ? CFG.items[k].emoji + ' ' + CFG.items[k].name : '';
ENTER.fly = async () => {
  S.game = 0;
  $('#s-flight').classList.remove('playing'); $('#fIntro').classList.add('on'); $('#poster').classList.remove('on'); $('#dusk').classList.remove('on');
  $('#fTotal').textContent = CFG.items.length; $('#fProg').textContent = '0%'; $('#fBar').style.width = '0'; $('#fScore').textContent = '0';
  $('#fFindName').textContent = itemName(0);
  musicPlay('bgm', .3);
  flightApi = await W.show('flight', {
    mode: 'memories', items: CFG.items,
    sfx: { coin: SFX.coin, star: SFX.star },
    onHud: h => {
      const pct = Math.round(h.got / h.total * 100);
      $('#fProg').textContent = pct + '%'; $('#fBar').style.width = pct + '%'; $('#fScore').textContent = fmt(h.score);
      $('#fFindName').textContent = itemName(h.got); S.game = h.score;
    },
    onItem: (k, got) => showPoster(k, got === CFG.items.length),
  });
  engineStart(.18);
};
$('#fStart').onclick = () => {
  $('#fIntro').classList.remove('on'); $('#s-flight').classList.add('playing'); engineStart(.38); musicPlay('game', .45);
  $('#dragHint').classList.add('on'); clearTimeout(hintT); hintT = setTimeout(() => $('#dragHint').classList.remove('on'), 3500);
  flightApi && flightApi.start();
};
// game dừng, bật poster kỷ niệm trong CFG.posterTime giây
function showPoster(k, last) {
  const it = CFG.items[k];
  $('#pImg').style.backgroundImage = it.img ? `url(${it.img})` : '';
  $('#pImg').innerHTML = it.img ? '' : `<div class="empty"><span>${it.emoji}</span>Ảnh sẽ được thêm sau</div>`;
  $('#pKind').textContent = it.kind; $('#pTitle').textContent = it.title; $('#pText').textContent = T(it.text);
  const bar = $('#pBar'), ov = $('#poster');
  bar.style.animationDuration = CFG.posterTime + 's';
  ov.classList.remove('on'); void ov.offsetWidth; ov.classList.add('on');
  posterLast = last; musicLevel(.2); engineStart(.12);
}
function closePoster() {
  const ov = $('#poster'); if (!ov.classList.contains('on')) return;
  ov.classList.remove('on');
  if (posterLast) return stage2Done();
  musicLevel(.45); engineStart(.38); flightApi && flightApi.resume(CFG.coinGap);
}
$('#pBar').addEventListener('animationend', closePoster);
$('#pSkip').onclick = () => { SFX.blip(3); closePoster(); };
// đủ vật phẩm: đoạn phim bay vào vùng mưa, xong thì camera trở về góc nhìn chơi và vào luôn chặng 3
function stage2Done() {
  const el = $('#s-flight'); el.classList.remove('playing'); el.classList.add('cine');
  musicLevel(.12, 1400); engineStart(.5);
  setTimeout(SFX.thunder, 2600); setTimeout(() => vibrate([40, 60, 40]), 2600);
  flightApi.toStorm({ duration: 7, onDone: () => { if (S.stage === 'fly') go('storm', { api: flightApi }); } });
}
LEAVE.fly = () => { $('#poster').classList.remove('on'); $('#s-flight').classList.remove('cine'); clearTimeout(hintT); };

/* ================= CHẶNG 3: GIÔNG BÃO → ĐIỂM SÁNG ================= */
let stormApi = null;
const ST = { loop: 0, timers: [], flying: false };
const vibrate = p => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };
ENTER.storm = async (arg) => {
  const s = CFG.storm;
  ST.flying = false;
  ['stLead', 'stTap'].forEach(id => $('#' + id).classList.remove('on'));
  $('#stBeacon').classList.remove('on'); $('#stLight').style.opacity = 0; $('#stDark').style.opacity = .3;
  $('#stLead').textContent = T(s.lead);
  // chữ áp lực trôi mờ
  $('#stWords').style.opacity = 1;
  $('#stWords').innerHTML = s.words.map((w, i) => `<span style="top:${14 + (i * 67) % 72}%;font-size:${18 + (i % 3) * 7}px;animation-duration:${11 + (i % 4) * 3}s;animation-delay:${-i * 2.3}s">${esc(w)}</span>`).join('');
  // mưa ngoài cửa sổ + giọt nước trượt trên kính
  $('#stRain').style.opacity = 1;
  $('#stRain').innerHTML = Array.from({ length: 50 }, (_, i) => `<i style="left:${Math.random() * 100}%;height:${40 + Math.random() * 60}px;animation-duration:${.5 + Math.random() * .5}s;animation-delay:${-Math.random()}s"></i>`).join('')
    + Array.from({ length: 16 }, () => { const d = 6 + Math.random() * 12; return `<b style="left:${Math.random() * 100}%;top:${Math.random() * 60}%;width:${d}px;height:${d * 1.15}px;animation-duration:${3 + Math.random() * 4}s;animation-delay:${-Math.random() * 5}s"></b>`; }).join('');
  musicPlay('bgm', .12); engineStart(.35);
  const onFlash = () => { const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); vibrate(40); };
  // đi tiếp từ đoạn phim chặng 2 thì dùng luôn cảnh đó; bỏ qua chặng 2 thì dựng cảnh giông mới
  if (arg && arg.api) { stormApi = arg.api; stormApi.handlers({ onFlash, thunder: SFX.thunder }); }
  else stormApi = await W.show('flight', { mode: 'storm', sfx: { thunder: SFX.thunder }, onFlash });
  if (S.stage !== 'storm') return;
  vibrate([60, 50, 60]); SFX.thunder();
  ST.timers = [
    setTimeout(() => $('#stLead').classList.add('on'), 900),
    setTimeout(() => { $('#stLead').classList.remove('on'); stormApi.showBeacon(); }, 6500),
    setTimeout(() => { $('#stBeacon').classList.add('on'); $('#stTap').classList.add('on'); }, 7600),
  ];
  // nút chạm bám theo điểm sáng trên màn hình
  ST.loop = setInterval(() => {
    const b = stormApi && stormApi.beaconScreen(), el = $('#stBeacon');
    if (!b) return;
    el.style.left = (b.x + 1) * 50 + '%'; el.style.top = (1 - b.y) * 50 + '%';
  }, 33);
};
$('#stBeacon').onclick = () => {
  if (ST.flying || !stormApi) return; ST.flying = true;
  SFX.star(); vibrate([30, 40, 80]);
  $('#stBeacon').classList.remove('on'); $('#stTap').classList.remove('on');
  $('#stWords').style.opacity = 0; $('#stRain').style.opacity = 0; $('#stDark').style.opacity = 0; $('#stLight').style.opacity = .9;
  musicPlay('bgm', .45); engineStart(.9);
  stormApi.flyToLight({
    duration: 4.2,
    onDone: async () => {
      if (S.stage !== 'storm') return;
      $('#whiteout').classList.add('on'); await wait(900);
      go('light'); setTimeout(() => $('#whiteout').classList.remove('on'), 400);
    },
  });
};
LEAVE.storm = () => { clearInterval(ST.loop); ST.timers.forEach(clearTimeout); stormApi = null; };

/* ================= TRONG ÁNH SÁNG: MONTAGE + POSTER GIA ĐÌNH / THẦY CÔ / BẠN BÈ ================= */
const LT = { i: 0, typeT: 0, slideT: 0 };
function lightMontage() {
  const v = $('#ltVid'), box = $('#ltSlides');
  box.innerHTML = ''; clearInterval(LT.slideT);
  const slides = () => {
    box.innerHTML = CFG.montageFallback.map(src => `<div style="background-image:url(${src})"></div>`).join('');
    const ds = [...box.children]; let i = 0; if (!ds.length) return;
    ds[0].classList.add('on');
    LT.slideT = setInterval(() => { if (PAUSE.on) return; ds[i].classList.remove('on'); i = (i + 1) % ds.length; ds[i].classList.add('on'); }, 3500);
  };
  v.onloadeddata = () => { box.innerHTML = ''; clearInterval(LT.slideT); v.play().catch(() => {}); };
  v.onerror = slides;
  v.src = CFG.storm.montage; v.load();
}
ENTER.light = () => {
  W.clear(); engineStop(2); musicPlay('bgm', .5);
  $('#ltEnd').classList.remove('on'); $('#ltCard').classList.remove('on');
  lightMontage(); LT.i = 0;
  setTimeout(() => S.stage === 'light' && showFrame(), 700);
};
function showFrame() {
  const f = CFG.storm.frames[LT.i], card = $('#ltCard');
  $('#ltImg').style.backgroundImage = f.img ? `url(${f.img})` : '';
  $('#ltImg').innerHTML = f.img ? '' : `<div class="empty">${icon('heart')}Poster ${esc(f.label)}<br>sẽ được thêm sau</div>`;
  $('#ltKick').textContent = `${LT.i + 1}/${CFG.storm.frames.length}`; $('#ltLabel').textContent = f.label;
  $('#ltBar').style.animationDuration = CFG.storm.posterTime + 's';
  card.classList.remove('on'); void card.offsetWidth; card.classList.add('on'); SFX.ding();
  // lời kể chạy từng chữ bên cạnh poster
  const full = T(f.text), el = $('#ltText'); let i = 0; el.textContent = ''; clearTimeout(LT.typeT);
  const tick = () => { if (S.stage !== 'light') return; if (PAUSE.on) { LT.typeT = setTimeout(tick, 300); return; } el.textContent = full.slice(0, ++i); if (i < full.length) LT.typeT = setTimeout(tick, 38); };
  LT.typeT = setTimeout(tick, 600);
}
function nextFrame() {
  if (S.stage !== 'light' || !$('#ltCard').classList.contains('on')) return;
  $('#ltCard').classList.remove('on'); clearTimeout(LT.typeT);
  LT.i++;
  if (LT.i < CFG.storm.frames.length) setTimeout(() => S.stage === 'light' && showFrame(), 600);
  else setTimeout(() => { if (S.stage !== 'light') return; $('#ltEndTx').textContent = T(CFG.storm.end); $('#ltEnd').classList.add('on'); SFX.star(); }, 600);
}
$('#ltBar').addEventListener('animationend', nextFrame);
$('#ltSkip').onclick = () => { SFX.blip(3); nextFrame(); };
$('#ltNext').onclick = () => go('landing');
LEAVE.light = () => { clearTimeout(LT.typeT); clearInterval(LT.slideT); $('#ltVid').pause(); };

/* ================= CHẶNG 4: ĐÁP CÁNH AN TOÀN ================= */
ENTER.landing = async () => {
  const el = $('#s-landing'); el.classList.remove('done');
  $('#ldMsg').textContent = `Chuyến bay ${CFG.flight} đã hạ cánh an toàn tại sân bay TỐT NGHIỆP!`;
  const img = $('#ldImg'); img.onerror = () => { img.onerror = null; img.src = 'img/cuong.webp'; }; img.src = CFG.gradPhoto;
  musicPlay('bgm', .3); engineStart(.55);
  await W.show('landing', {
    duration: 12,
    onTouch: () => { SFX.hit(); vibrate(80); engineStart(.8); setTimeout(() => engineStart(.25), 1500); },
    onEnd: () => {
      if (S.stage !== 'landing') return;
      el.classList.add('done'); engineStop(2); musicPlay('bgm', .5);
      SFX.win(); confetti(90); setTimeout(() => confetti(60), 900);
    },
  });
};

$('#ldNext').onclick = () => go('letter');

/* ================= THƯ CẢM ƠN TRÊN NỀN MONTAGE ================= */
let letterT = 0, slideT = 0;
function montageStart() {
  const v = $('#montage'), box = $('#slides');
  box.innerHTML = ''; clearInterval(slideT);
  v.onloadeddata = () => { box.innerHTML = ''; clearInterval(slideT); v.play().catch(() => {}); };
  v.onerror = () => {
    // chưa có media/montage.mp4: trình chiếu ảnh kỷ niệm thay thế
    box.innerHTML = CFG.montageFallback.map(src => `<div style="background-image:url(${src})"></div>`).join('');
    const ds = [...box.children]; let i = 0;
    if (!ds.length) return;
    ds[0].classList.add('on');
    slideT = setInterval(() => { ds[i].classList.remove('on'); i = (i + 1) % ds.length; ds[i].classList.add('on'); }, 4500);
  };
  v.src = 'media/montage.mp4'; v.load();
}
ENTER.letter = () => {
  musicPlay('bgm', .45); W.clear(); montageStart();
  const el = $('#letterTxt'), full = T(CFG.letters[relNow().letter] || CFG.letters.friend); let i = 0;
  $('#letterBtn').classList.remove('on'); el.innerHTML = '<span class="cur"></span>'; clearTimeout(letterT);
  const tick = () => {
    if (S.stage !== 'letter') return;
    if (PAUSE.on) { letterT = setTimeout(tick, 300); return; }
    i++; const ch = full[i - 1];
    el.innerHTML = esc(full.slice(0, i)) + '<span class="cur"></span>';
    if (i >= full.length) { setTimeout(() => $('#letterBtn').classList.add('on'), 600); return; }
    letterT = setTimeout(tick, ch === '\n' ? 320 : (ch === '.' || ch === ',' || ch === '–') ? 260 : 55);
  };
  letterT = setTimeout(tick, 1200);
};
LEAVE.letter = () => { clearTimeout(letterT); clearInterval(slideT); $('#montage').pause(); };
$('#letterBtn').onclick = () => go('review');

/* ================= ĐÁNH GIÁ CHUYẾN BAY ================= */
let stars = 5;
(function () {
  const box = $('#stars');
  for (let i = 1; i <= 5; i++) { const b = document.createElement('button'); b.setAttribute('aria-label', i + ' sao'); b.innerHTML = '<svg viewBox="0 0 24 24"><use href="#i-star"/></svg>'; b.onclick = () => { stars = i; paint(); SFX.blip(i); }; box.appendChild(b); }
  const paint = () => [...box.children].forEach((b, i) => b.classList.toggle('on', i < stars)); paint();
})();
ENTER.review = () => { musicPlay('bgm', .35); W.clear(); };
$('#rvSend').onclick = async () => {
  const text = $('#rvText').value.trim();
  if (text.length < 2) return toast('Viết vài chữ gửi cơ trưởng nhé');
  $('#rvSend').disabled = true; $('#rvSend').textContent = 'Đang gửi…';
  const name = guestName();
  store.set('myReview', { name, stars, text }); store.set('reviewed', true);
  await apiPost({ a: 'review', name, stars, text });
  $('#rvSend').disabled = false; $('#rvSend').textContent = 'Gửi lời chúc'; $('#rvText').value = '';
  confetti(); go('end');
};
$('#rvLater').onclick = () => go('end');

/* ================= THIỆP MỜI CHÍNH THỨC ================= */
$('#lnkMap').href = CFG.map;
$('#lnkCal').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('Lễ tốt nghiệp của Cao Cường') +
  '&dates=20261208T080000Z/20261208T103000Z&location=' + encodeURIComponent('Nhà hát Hòa Bình, 240 Đường 3 Tháng 2, TP.HCM') + '&details=' + encodeURIComponent(`Chuyến bay ${CFG.flight} – hẹn gặp lúc ${CFG.time}!`);
ENTER.end = async () => {
  musicPlay('bgm', .4); W.clear();
  const total = S.game + (S.cls === 'biz' ? 20000 : 0);
  if (total > 0) {
    if (total > S.best) { S.best = total; store.set('best', total); }
    apiPost({ a: 'score', views: total });
  }
  $('#btnWish').style.display = store.get('reviewed', false) ? 'none' : '';
  $('#ivMsg').textContent = T(CFG.invite);
  $('#ivName').textContent = G.name || '—';
  $('#ivPhoneRow').style.display = CFG.phone ? '' : 'none';
  $('#ivPhone').textContent = CFG.phone; $('#ivPhone').href = 'tel:' + CFG.phone.replace(/\s/g, '');
  $('#scoreline').innerHTML = `<div>Kỷ niệm<b>${fmt(S.game)}</b></div><div>Hạng vé<b>${S.cls === 'biz' ? '+20K' : '—'}</b></div><div>Tổng<b>${fmt(total)}</b></div>`;
  loadWall();
};
async function loadWall() {
  let data = null; try { data = await apiGet({ a: 'wall' }); } catch {}
  const mine = store.get('myReview', null);
  let reviews = (data && data.reviews) || [];
  if (mine && !reviews.some(r => r.name === mine.name && r.text === mine.text)) reviews = [mine, ...reviews];
  if (!reviews.length) reviews = [{ name: 'Cường', stars: 5, text: 'Lời chúc đầu tiên sẽ là của bạn đó!' }];
  $('#wallRv').innerHTML = reviews.map(r => `<div class="rv"><div class="h"><span>${esc(r.name)}</span><span class="s">${'★'.repeat(Math.max(1, Math.min(5, +r.stars || 5)))}</span></div><p>${esc(r.text)}</p></div>`).join('');
  let lb = (data && data.board) || [];
  if (!data && S.best) lb = [{ name: G.name, views: S.best }];
  $('#wallLb').innerHTML = lb.length ? lb.map((r, i) => `<div class="lbr"><div class="r">${i + 1}</div><div class="n">${esc(r.name)}</div><div class="v">${fmt(+r.views)}</div></div>`).join('') : '<p style="text-align:center;color:var(--muted)">Chưa có ai chơi. Vào chiếm hạng nhất đi!</p>';
}
$$('.tabs button').forEach(b => b.onclick = () => { $$('.tabs button').forEach(x => x.classList.toggle('on', x === b)); $('#wallRv').hidden = b.dataset.t !== 'rv'; $('#wallLb').hidden = b.dataset.t !== 'lb'; });
$('#btnWish').onclick = () => go('review');
$('#wAgain').onclick = () => go('ticket');
$('#wFly').onclick = () => go('fly');

// vẽ thiệp mời thành ảnh PNG để khách lưu về máy
function wrapText(g, text, maxW) {
  const out = []; let line = '';
  for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }
  if (line) out.push(line); return out;
}
async function inviteImage() {
  const W2 = 1080, H2 = 1600, c = document.createElement('canvas'); c.width = W2; c.height = H2;
  const g = c.getContext('2d'), serif = "'Playfair Display', Georgia, serif", sans = "'Be Vietnam Pro', Arial, sans-serif";
  const bg = g.createLinearGradient(0, 0, 0, H2); bg.addColorStop(0, '#0E2150'); bg.addColorStop(1, '#060D22'); g.fillStyle = bg; g.fillRect(0, 0, W2, H2);
  g.strokeStyle = '#C9A35B'; g.lineWidth = 4; g.strokeRect(48, 48, W2 - 96, H2 - 96); g.lineWidth = 1.5; g.strokeRect(64, 64, W2 - 128, H2 - 128);
  g.textAlign = 'center'; g.fillStyle = '#E9CF96';
  g.font = `800 34px ${sans}`; g.fillText(`${CFG.flight.toUpperCase()}  ·  THIỆP MỜI CHÍNH THỨC`, W2 / 2, 170);
  g.fillStyle = '#FFFFFF'; g.font = `700 76px ${serif}`; g.fillText('Lễ Tốt Nghiệp', W2 / 2, 290);
  g.font = `600 44px ${sans}`; g.fillStyle = '#E9CF96'; g.fillText('Phan Ngọc Cao Cường', W2 / 2, 370);
  g.font = `500 30px ${sans}`; g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText('Tiếng Anh Thương Mại · CĐ Kinh tế Đối ngoại', W2 / 2, 420);
  g.font = `italic 500 42px ${serif}`; g.fillStyle = '#FFFFFF';
  let y = 540; wrapText(g, T(CFG.invite), W2 - 240).forEach(l => { g.fillText(l, W2 / 2, y); y += 62; });
  y += 40; g.fillStyle = 'rgba(233,207,150,.35)'; g.fillRect(200, y, W2 - 400, 2); y += 90;
  const row = (label, val, sub) => {
    g.font = `700 26px ${sans}`; g.fillStyle = '#C9A35B'; g.fillText(label, W2 / 2, y); y += 56;
    g.font = `700 44px ${sans}`; g.fillStyle = '#FFFFFF'; g.fillText(val, W2 / 2, y); y += sub ? 48 : 80;
    if (sub) { g.font = `500 30px ${sans}`; g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText(sub, W2 / 2, y); y += 80; }
  };
  row('THỜI GIAN', `${CFG.time} · Thứ Ba, 08/12/2026`);
  row('ĐỊA ĐIỂM', 'Nhà hát Hòa Bình', '240 Đường 3 Tháng 2, P. Hòa Hưng, TP.HCM');
  if (CFG.phone) row('LIÊN HỆ', CFG.phone);
  g.font = `700 26px ${sans}`; g.fillStyle = '#C9A35B'; g.fillText('KHÁCH MỜI', W2 / 2, H2 - 190);
  g.font = `700 54px ${serif}`; g.fillStyle = '#FFFFFF'; g.fillText(G.name || '', W2 / 2, H2 - 120);
  return c.toDataURL('image/png');
}
$('#btnSave').onclick = async () => {
  try { await document.fonts.ready; } catch {}
  const url = await inviteImage();
  $('#saveImg').src = url; $('#saveDl').href = url; $('#saveOv').classList.add('on');
};
$('#saveClose').onclick = () => $('#saveOv').classList.remove('on');

/* ================= KHỞI ĐỘNG ================= */
(async function init() {
  const hide = () => $('#loading').classList.add('off');
  setTimeout(hide, 9000);
  try { W.initGL($('#gl')); } catch (e) { window.__errs.push('gl: ' + e); }
  // link riêng ?k=... (nếu có) thì điền sẵn tên
  const k = new URLSearchParams(location.search).get('k');
  if (k) {
    G.code = k;
    try { const r = await Promise.race([apiGet({ a: 'guest', k }), wait(4000)]); if (r && r.ok && !G.name) G.name = r.guest.name; } catch {}
  }
  try { await Promise.race([document.fonts.ready, wait(1500)]); } catch {}
  try { await Promise.race([go('ticket'), wait(6000)]); } catch (e) { window.__errs.push('ticket: ' + e); }
  hide();
  window.__app = { go, S, G, answer, W };
})();
