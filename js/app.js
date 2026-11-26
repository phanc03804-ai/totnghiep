import * as W from './world.js';

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
  // video mở đầu mỗi chặng: đặt file media/video1.mp4, video2.mp4, video3.mp4 – chưa có thì hiện thẻ tiêu đề
  stages: [
    { kick: 'CHẶNG 1', title: 'Cất cánh', line: 'Những điều mới mẻ, vươn ra thế giới mới.', mode: 'memories', duration: 25 },
    { kick: 'CHẶNG 2', title: 'Giông bão', line: 'Không phải chuyến bay nào cũng êm.', mode: 'storm', duration: 25 },
    { kick: 'CHẶNG 3', title: 'Hạ cánh an toàn', line: 'Sau tất cả, mình đã về tới nơi.', mode: 'landing', duration: 22 },
  ],
  cards: [
    { kind: 'CUỘC SỐNG MỚI', title: 'Ngày đầu nhập học', text: 'Lần đầu mặc đồng phục, lần đầu lạc đường trong trường.' },
    { kind: 'CUỘC SỐNG MỚI', title: 'Chiếc áo xanh', text: 'Vào Đoàn khoa Ngoại ngữ, quen thêm cả một gia đình thứ hai.' },
    { kind: 'THÀNH TÍCH', title: 'Đại hội Hội Sinh viên 2025', text: 'Đại biểu Đại hội Hội Sinh viên trường lần VI.' },
    { kind: 'THÀNH TÍCH', title: 'Tập thể tiên tiến', text: 'Cùng tập thể nhận danh hiệu tiên tiến Tháng Thanh niên 2025.' },
    { kind: 'NIỀM VUI', title: 'Những người bạn', text: 'Những bữa cơm, những trận cười không cần lý do.' },
    { kind: 'NIỀM VUI', title: 'Cầm máy ảnh', text: 'Đam mê chụp và dựng video bắt đầu từ đây.' },
  ],
  pressures: ['Deadline', 'Thi cử', 'Khoá luận', 'Đi làm thêm', 'Mất ngủ', 'Áp lực điểm số', 'Lo lắng tương lai', 'Mệt mỏi'],
  heals: ['Gia đình', 'Bạn bè', 'Thầy cô'],
  letter: {
    family: `Gửi cả nhà,

Cảm ơn cả nhà đã là nơi Cường cất cánh và cũng là nơi Cường hạ cánh. Những năm qua Cường đi sớm về khuya, ít khi nói ra, nhưng Cường biết cả nhà luôn chờ.

Tấm bằng này là của cả nhà. Hẹn cả nhà lúc 15:00, thứ Ba 08/12/2026 tại Nhà hát Hòa Bình.

Thương, Cường.`,
    friend: `Gửi {ten},

Cảm ơn bạn đã ngồi cạnh tui suốt chuyến bay này – lúc trời đẹp cũng như lúc giông bão. Những buổi trực, những bữa cơm, những tin nhắn lúc nửa đêm, tui nhớ hết.

Hẹn bạn lúc 15:00, thứ Ba 08/12/2026 tại Nhà hát Hòa Bình. Nhớ tới nha!

Cường.`,
  },
  map: 'https://www.google.com/maps/search/?api=1&query=Nh%C3%A0+h%C3%A1t+H%C3%B2a+B%C3%ACnh+240+%C4%90%C6%B0%E1%BB%9Dng+3+Th%C3%A1ng+2+TP.HCM',
};
const REL = { family: { khach: 'cả nhà', cuong: 'Cường' }, friend: { khach: 'bạn', cuong: 'tui' } };

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
const G = { code: store.get('id', null) || ('g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)), name: store.get('name', ''), rel: store.get('rel', 'friend') };
store.set('id', G.code);
const T = s => { const r = REL[G.rel] || REL.friend; return s.replace(/\{Khach\}/g, cap(r.khach)).replace(/\{khach\}/g, r.khach).replace(/\{Cuong\}/g, cap(r.cuong)).replace(/\{cuong\}/g, r.cuong).replace(/\{ten\}/g, G.name || 'bạn'); };
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
  return fetch(CFG.API, { method: 'POST', body: JSON.stringify({ ...data, k: G.code, name: data.name ?? (G.name + (G.rel === 'family' ? ' (gia đình)' : '')) }) }).then(r => r.json()).catch(() => ({ ok: false }));
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
const ENGINE = { nodes: null };
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
$('#dlgPf').style.backgroundImage = 'url(img/cuong-face.jpg)';
let dlgSkip = null;
dlg.addEventListener('click', e => { if (e.target.closest('#dlgCh')) return; dlgSkip && dlgSkip(); });
function speaker(on) { const a = W.current() && W.current().agent; if (a) a.userData.talk(on); }
// hiện 1 câu thoại; xong thì chờ người xem chạm (hoặc tự qua sau vài giây)
function say(role, text, { auto = 5200 } = {}) {
  return new Promise(res => {
    const full = T(text); let i = 0, typing = true, timer = 0, autoT = 0;
    $('#dlgWho').innerHTML = `Cường <i>· ${role}</i>`; $('#dlgTx').textContent = ''; $('#dlgCh').innerHTML = ''; $('#dlgCh').className = 'ch';
    dlg.classList.add('on'); dlg.classList.remove('wait'); speaker(true);
    const finish = () => { typing = false; clearInterval(timer); $('#dlgTx').textContent = full; speaker(false); dlg.classList.add('wait'); autoT = setTimeout(done, auto); };
    const done = () => { clearTimeout(autoT); dlgSkip = null; dlg.classList.remove('wait'); res(); };
    dlgSkip = () => typing ? finish() : done();
    timer = setInterval(() => { $('#dlgTx').textContent = full.slice(0, ++i); if (i % 3 === 0) SFX.type(); if (i >= full.length) finish(); }, 24);
  });
}
function dlgHide() { dlg.classList.remove('on', 'wait'); speaker(false); dlgSkip = null; }
// câu hỏi có lựa chọn trong khung thoại
function ask(role, text, choices) {
  return new Promise(res => {
    const full = T(text); let i = 0;
    $('#dlgWho').innerHTML = `Cường <i>· ${role}</i>`; $('#dlgTx').textContent = ''; dlg.classList.add('on'); dlg.classList.remove('wait'); speaker(true);
    const ch = $('#dlgCh'); ch.innerHTML = ''; ch.className = 'ch';
    const t = setInterval(() => { $('#dlgTx').textContent = full.slice(0, ++i); if (i % 3 === 0) SFX.type(); if (i >= full.length) { clearInterval(t); speaker(false); choices(ch, v => { ch.innerHTML = ''; res(v); }); } }, 24);
    dlgSkip = null;
  });
}

/* ================= ĐIỀU HƯỚNG ================= */
const S = { stage: '', rsvp: store.get('rsvp', null), cls: null, scores: [0, 0, 0], best: store.get('best', 0) };
const ENTER = {}, LEAVE = {};
async function go(id, arg) {
  dlgHide();
  (LEAVE[S.stage] || (() => {}))();
  S.stage = id;
  const app = $('#app'); app.classList.remove('paper', 'film', 'blur');
  if (id === 'end') app.classList.add('paper');
  if (id === 'video') app.classList.add('film');
  if (id === 'ticket') app.classList.add('blur');
  $('#btnSkip').style.visibility = ['checkin', 'quiz', 'board', 'takeoff', 'fly', 'video'].includes(id) ? 'visible' : 'hidden';
  const stageEl = { ticket: 's-ticket', checkin: 's-ground', quiz: 's-quiz', board: 's-ground', takeoff: 's-takeoff', video: 's-video', fly: 's-flight', letter: 's-letter', end: 's-end' }[id];
  $$('.stage').forEach(s => s.classList.toggle('on', s.id === stageEl));
  const sc = $('#' + stageEl + ' .scroll'); if (sc) sc.scrollTop = 0;
  await (ENTER[id] || (() => {}))(arg);
}
$('#btnSkip').onclick = () => go(G.name ? 'end' : 'ticket');

/* ================= CẢNH 0: VÉ TRÊN ĐIỆN THOẠI ================= */
ENTER.ticket = async () => {
  musicPlay('bgm', .45);
  await W.show('airport', { cam: 'wide' });
  $('#hold').classList.remove('down');
  $('#inName').value = G.name; paintRel(); checkTicket();
  $('#tkName').textContent = G.name || '_ _ _ _ _'; $('#tkSeat').textContent = G.name ? seatOf(G.code) : '—';
};
function paintRel() { $$('#relBtns button').forEach(b => b.classList.toggle('on', b.dataset.rel === G.rel && store.get('relPicked', false))); }
function checkTicket() { $('#tkDone').disabled = !($('#inName').value.trim().length >= 1 && store.get('relPicked', false)); }
$('#inName').addEventListener('input', () => { const v = $('#inName').value.trim(); $('#tkName').textContent = v || '_ _ _ _ _'; checkTicket(); });
$$('#relBtns button').forEach(b => b.onclick = () => { G.rel = b.dataset.rel; store.set('rel', G.rel); store.set('relPicked', true); paintRel(); checkTicket(); SFX.blip(2); });
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
const ROLE = { checkin: 'NHÂN VIÊN CHECK-IN', gate: 'NHÂN VIÊN THỦ TỤC', captain: 'CƠ TRƯỞNG' };
ENTER.checkin = async () => {
  musicPlay('bgm', .3);
  let arrive; const arrived = new Promise(r => arrive = r);
  const stepT = setInterval(SFX.step, 260);
  await W.show('airport', { variant: 'checkin', onArrive: () => arrive() });
  await arrived; clearInterval(stepT);
  if (S.stage !== 'checkin') return;
  SFX.beep(); $('#scanok').classList.add('on'); setTimeout(() => $('#scanok').classList.remove('on'), 1600);
  await say(ROLE.checkin, 'Xin chào {ten}! Vé chuyến TXCC2026 đây rồi. Chuyến này đặc biệt lắm đó – nó bay qua cả quãng đường đại học của {cuong}.');
  if (S.stage !== 'checkin') return;
  const go2 = await ask(ROLE.checkin, 'Điểm đến là lễ tốt nghiệp, 15:00 thứ Ba 08/12 ở Nhà hát Hòa Bình. {Khach} lên chuyến bay này cùng {cuong} nhé?', (box, pick) => {
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
let qi = 0, correct = 0, qTimer = 0, qLock = false;
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
  const fg = $('#timerFg'), n = $('#timerN'), tm = $('#timer'), t0 = performance.now(); let lastSec = CFG.qTime;
  qTimer = setInterval(() => {
    const left = Math.max(0, CFG.qTime - (performance.now() - t0) / 1000);
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
  $('#ppName').textContent = G.name; $('#ppScore').textContent = `ĐÚNG ${correct}/${CFG.quiz.length} CÂU`;
  const st = $('#stamp'); st.classList.remove('hit');
  $('#ppBook').style.setProperty('--stampc', S.cls === 'biz' ? '#A0670C' : '#1E5BC4');
  $('#stampText').textContent = S.cls === 'biz' ? '★ BUSINESS CLASS · TXCC2026 ★' : '★ ECONOMY CLASS · TXCC2026 ★';
  $('#ppRes').classList.remove('on'); $('#ppNext').hidden = true; $('#ppOv').classList.add('on');
  setTimeout(() => {
    st.classList.add('hit');
    setTimeout(() => { SFX.stamp(); $('#ppBook').classList.add('shake'); setTimeout(() => $('#ppBook').classList.remove('shake'), 400); }, 260);
    $('#ppRes').innerHTML = S.cls === 'biz' ? '<h2>Hạng Thương gia</h2><p class="muted">Được cộng 20.000 điểm khởi đầu.</p>' : '<h2>Hạng Phổ thông</h2><p class="muted">Ai cũng bay đủ 3 chặng như nhau.</p>';
    setTimeout(() => { $('#ppRes').classList.add('on'); $('#ppNext').hidden = false; }, 500);
  }, 700);
}
$('#ppNext').onclick = () => go('board');

/* ================= CẢNH 3: LÊN MÁY BAY ================= */
ENTER.board = async () => {
  let arrive; const arrived = new Promise(r => arrive = r);
  const stepT = setInterval(SFX.step, 270);
  await W.show('boarding', { onArrive: () => arrive() });
  await arrived; clearInterval(stepT);
  if (S.stage !== 'board') return;
  SFX.ding();
  await say(ROLE.captain, 'Kính chào quý khách, tôi là Cường, cơ trưởng chuyến bay TXCC2026. Hành trình hôm nay đi qua 3 chặng: cất cánh, giông bão và hạ cánh. Thắt dây an toàn vào, chúng ta cất cánh!');
  if (S.stage === 'board') go('takeoff');
};
ENTER.takeoff = async () => {
  musicPlay('bgm', .2); engineStart(.25);
  // mở khoá video ngay khi còn trong lượt chạm gần nhất, để lát nữa phát được có tiếng
  const v = $('#vid'); v.muted = AU.muted;
  await W.show('takeoff', { duration: 7.5, onEnd: async () => { $('#whiteout').classList.add('on'); await wait(800); go('video', 0); setTimeout(() => $('#whiteout').classList.remove('on'), 300); } });
  setTimeout(() => engineStart(.65), 600);
  setTimeout(() => { $('#cabinCap').querySelector('h2').textContent = 'Chúng ta đang cất cánh'; }, 3500);
};

/* ================= VIDEO MỞ ĐẦU MỖI CHẶNG ================= */
let vidDone = null;
ENTER.video = async (n) => {
  engineStop(1.5); W.clear();
  const st = CFG.stages[n], v = $('#vid');
  $('#vcKick').textContent = st.kick; $('#vcTitle').textContent = st.title; $('#vcLine').textContent = st.line;
  $('#tapPlay').classList.remove('on'); $('#vcard').classList.remove('on');
  const next = () => { if (S.stage !== 'video') return; v.pause(); go('fly', n); };
  vidDone = next;
  const ok = await new Promise(res => {
    v.onloadeddata = () => res(true); v.onerror = () => res(false);
    v.src = `media/video${n + 1}.mp4`; v.load(); setTimeout(() => res(false), 3500);
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
$('#vSkip').onclick = () => vidDone && vidDone();

/* ================= 3 CHẶNG BAY ================= */
let flightApi = null, flyN = 0, cardT = 0;
const hearts = n => `<span class="hearts">${[0, 1, 2].map(i => `<i class="${i < n ? '' : 'off'}"></i>`).join('')}</span>`;
const RULES = [
  `<div>${icon('touch')}<div>Kéo <b>nút tròn</b> (hoặc kéo ngón tay trên màn hình) để lái máy bay.</div></div><div>${icon('star')}<div>Nhặt <b>6 ngôi sao kỷ niệm</b> để mở lại những câu chuyện của Cường, nhặt <b>xu vàng</b> để lấy điểm.</div></div>`,
  `<div>${icon('touch')}<div>Gió giật làm máy bay lệch hướng, giữ chắc tay lái.</div></div><div>${icon('bolt')}<div>Né những <b>đám mây áp lực</b>. Có <b>3 mạng</b>; vệt sáng <b>Gia đình · Bạn bè · Thầy cô</b> giúp hồi 1 mạng.</div></div>`,
  `<div>${icon('ring')}<div>Bay xuyên qua các <b>vòng vàng</b> khi máy bay hạ độ cao.</div></div><div>${icon('plane')}<div>Cuối chặng giữ máy bay <b>chính giữa</b> để chạm bánh thật êm.</div></div>`,
];
ENTER.fly = async (n) => {
  flyN = n; const st = CFG.stages[n];
  $('#s-flight').classList.remove('playing');
  $('#fIntro').classList.add('on'); $('#fEnd').classList.remove('on'); $('#memcard').classList.remove('on');
  $('#fKick').textContent = `${st.kick} · ${st.duration} giây`; $('#fTitle').textContent = st.title; $('#fRules').innerHTML = RULES[n];
  $('#fStage').textContent = st.kick + ' · ' + st.title.toUpperCase(); $('#fTime').textContent = st.duration;
  $('#fScore').innerHTML = n === 1 ? hearts(3) : n === 0 ? `${icon('star')}<b>0/6</b>` : `${icon('ring')}<b>0</b>`;
  musicPlay('bgm', .3);
  flightApi = await W.show('flight', {
    mode: st.mode, duration: st.duration, words: CFG.pressures, heals: CFG.heals,
    sfx: { coin: SFX.coin, star: SFX.star, hit: SFX.hit, thunder: SFX.thunder },
    onHud: h => {
      $('#fTime').textContent = Math.ceil(h.time);
      $('#fScore').innerHTML = h.mode === 'storm' ? hearts(h.lives) : h.mode === 'memories' ? `${icon('star')}<b>${h.stars}/6</b>` : `${icon('ring')}<b>${h.rings}</b>`;
    },
    onStar: i => showCard(i),
    onFlash: () => { const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); },
    onEnd: r => endStage(n, r),
  });
  engineStart(.18);
};
function showCard(i) {
  const c = CFG.cards[i]; if (!c) return;
  $('#mcImg').src = `media/cards/c${i + 1}.jpg`; $('#mcKind').textContent = c.kind; $('#mcTitle').textContent = c.title; $('#mcText').textContent = c.text;
  const el = $('#memcard'); el.classList.add('on'); clearTimeout(cardT); cardT = setTimeout(() => el.classList.remove('on'), 3200);
}
$('#fStart').onclick = () => { $('#fIntro').classList.remove('on'); $('#s-flight').classList.add('playing'); engineStart(.38); musicPlay('game', .45); flightApi && flightApi.start(); };
async function endStage(n, r) {
  $('#s-flight').classList.remove('playing'); engineStart(.12); musicPlay('bgm', .35);
  S.scores[n] = r.score + (n === 0 && S.cls === 'biz' ? 20000 : 0);
  const msg = n === 0 ? `Nhặt được ${r.stars}/6 kỷ niệm. Phía trước trời đang tối dần… xin thắt chặt dây an toàn.`
    : n === 1 ? (r.survived ? 'Chúng ta đã ra khỏi vùng giông. Cảm ơn {khach} đã không buông tay lái.' : 'Máy bay rung lắc dữ dội… nhưng {cuong} vẫn đưa {khach} ra khỏi cơn bão.')
    : ['Hạ cánh hoàn hảo!', 'Hạ cánh êm ái!', 'Hơi xóc một chút, nhưng đã về tới nơi an toàn!'][r.rating ?? 1];
  $('#feKick').textContent = `Hoàn thành ${CFG.stages[n].kick.toLowerCase()}`;
  $('#fFinal').textContent = fmt(S.scores[n]) + ' điểm';
  $('#fVerdict').textContent = T(msg);
  $('#fNext').innerHTML = n < 2 ? `Sang ${CFG.stages[n + 1].kick.toLowerCase()} ${icon('arrow')}` : `Mở thư của Cường ${icon('arrow')}`;
  $('#fEnd').classList.add('on'); SFX.win();
  if (n === 2) { engineStop(2); confetti(60); }
}
$('#fNext').onclick = () => { const v = $('#vid'); v.play().then(() => v.pause()).catch(() => {}); flyN < 2 ? go('video', flyN + 1) : go('letter'); };
LEAVE.fly = () => { joyReset(); clearTimeout(cardT); };
const joy = $('#joy'), knob = $('#knob'); let joyId = null;
function joyReset() { joyId = null; knob.style.transform = ''; flightApi && flightApi.stick && flightApi.stick(0, 0); }
function joyMove(e) {
  const r = joy.getBoundingClientRect(), R = r.width / 2 - 14;
  let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
  knob.style.transform = `translate(${dx}px,${dy}px)`;
  flightApi && flightApi.stick && flightApi.stick(dx / R, dy / R);
}
joy.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); joyId = e.pointerId; try { joy.setPointerCapture(e.pointerId); } catch {} joyMove(e); });
joy.addEventListener('pointermove', e => { if (e.pointerId === joyId) { e.stopPropagation(); joyMove(e); } });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => joy.addEventListener(t, e => { if (e.pointerId === joyId) joyReset(); }));

/* ================= THƯ CUỐI + PHÁO HOA ================= */
let letterT = 0, fwT = 0;
function firework() {
  const box = $('#fireworks'), fw = document.createElement('div'); fw.className = 'fw';
  fw.style.left = 10 + Math.random() * 80 + '%'; fw.style.top = 8 + Math.random() * 40 + '%';
  fw.style.color = ['#E9CF96', '#FFB347', '#8FC1FF', '#FFFFFF', '#FF8FA3'][Math.floor(Math.random() * 5)];
  for (let i = 0; i < 26; i++) { const p = document.createElement('i'), a = i / 26 * Math.PI * 2, r = 60 + Math.random() * 50; p.style.setProperty('--dx', Math.cos(a) * r + 'px'); p.style.setProperty('--dy', Math.sin(a) * r + 30 + 'px'); fw.appendChild(p); }
  box.appendChild(fw); SFX.pop(); setTimeout(() => fw.remove(), 1800);
}
ENTER.letter = () => {
  musicPlay('bgm', .4);
  clearInterval(fwT); fwT = setInterval(firework, 900); firework();
  const el = $('#letterTxt'), full = T(CFG.letter[G.rel] || CFG.letter.friend); let i = 0;
  $('#letterBtn').classList.remove('on'); el.innerHTML = '<span class="cur"></span>'; clearTimeout(letterT);
  const tick = () => {
    if (S.stage !== 'letter') return;
    i++; const ch = full[i - 1];
    el.innerHTML = esc(full.slice(0, i)) + '<span class="cur"></span>';
    if (i >= full.length) { setTimeout(() => $('#letterBtn').classList.add('on'), 600); return; }
    letterT = setTimeout(tick, ch === '\n' ? 320 : (ch === '.' || ch === ',' || ch === '–') ? 200 : 42);
  };
  letterT = setTimeout(tick, 900);
};
LEAVE.letter = () => { clearTimeout(letterT); clearInterval(fwT); };
$('#letterBtn').onclick = () => go('end');

/* ================= TRANG CUỐI ================= */
let stars = 5;
(function () {
  const box = $('#stars');
  for (let i = 1; i <= 5; i++) { const b = document.createElement('button'); b.setAttribute('aria-label', i + ' sao'); b.innerHTML = '<svg viewBox="0 0 24 24"><use href="#i-star"/></svg>'; b.onclick = () => { stars = i; paint(); SFX.blip(i); }; box.appendChild(b); }
  const paint = () => [...box.children].forEach((b, i) => b.classList.toggle('on', i < stars)); paint();
})();
$('#lnkMap').href = CFG.map;
$('#lnkCal').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('Lễ tốt nghiệp của Cao Cường') +
  '&dates=20261208T080000Z/20261208T100000Z&location=' + encodeURIComponent('Nhà hát Hòa Bình, 240 Đường 3 Tháng 2, TP.HCM') + '&details=' + encodeURIComponent('Chuyến bay TXCC2026 – hẹn gặp lúc 15:00!');
ENTER.end = async () => {
  musicPlay('bgm', .4); W.clear();
  const total = S.scores.reduce((a, b) => a + b, 0);
  if (total > 0) {
    if (total > S.best) { S.best = total; store.set('best', total); }
    apiPost({ a: 'score', views: total });
  }
  $('#scoreline').innerHTML = CFG.stages.map((st, i) => `<div>${st.kick}<b>${fmt(S.scores[i])}</b></div>`).join('') + `<div>Tổng<b>${fmt(total)}</b></div>`;
  const no = S.rsvp && !S.rsvp.go;
  $('#endTitle').textContent = no ? 'Cảm ơn {khach} đã bay cùng Cường'.replace('{khach}', REL[G.rel].khach) : 'Hẹn gặp lúc 15:00 – 08/12';
  $('#wishTitle').textContent = store.get('reviewed', false) ? 'Gửi thêm một lời chúc' : 'Gửi Cường một lời chúc';
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
$('#rvSend').onclick = async () => {
  const text = $('#rvText').value.trim();
  if (text.length < 2) return toast('Viết vài chữ chúc mừng nhé');
  $('#rvSend').disabled = true; $('#rvSend').textContent = 'Đang gửi…';
  const name = G.name + (G.rel === 'family' ? ' (gia đình)' : '');
  store.set('myReview', { name, stars, text }); store.set('reviewed', true);
  await apiPost({ a: 'review', name, stars, text });
  $('#rvSend').disabled = false; $('#rvSend').textContent = 'Gửi lời chúc'; $('#rvText').value = '';
  confetti(); toast('Đã gửi lời chúc'); loadWall();
};
$$('.tabs button').forEach(b => b.onclick = () => { $$('.tabs button').forEach(x => x.classList.toggle('on', x === b)); $('#wallRv').hidden = b.dataset.t !== 'rv'; $('#wallLb').hidden = b.dataset.t !== 'lb'; });
$('#wAgain').onclick = () => { S.scores = [0, 0, 0]; go('ticket'); };
$('#wFly').onclick = () => { S.scores = [0, 0, 0]; go('video', 0); };

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
