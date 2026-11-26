import * as W from './world.js';
import { mountChibi } from './chibi.js';

/* ================= CẤU HÌNH ================= */
const CFG = {
  API: 'https://script.google.com/macros/s/AKfycbyYKIRBcJRA3APnx04jQ56R9HeU1h6EeappjTL5wnRkGikVjYyIOqNAu5V19xpGM8xi/exec',
  quiz: [
    { q: '{Ban} có nhớ ngày sinh của Cường không?', opts: ['20/01/2004', '02/10/2004', '20/10/2003', '21/01/2004'], a: 0 },
    { q: 'Cân nặng hiện tại của Cường là bao nhiêu?', opts: ['80 kg', '68 kg', '74 kg', '90 kg'], a: 0 },
    { q: 'Nhà Cường ở đâu?', opts: ['TP. Hồ Chí Minh', 'Bà Rịa – Vũng Tàu', 'Đồng Nai', 'Bình Dương'], a: 0 },
    { q: '{Ban} có thích Cường không? 😳', yn: true },
    { q: '5 năm nữa {ban} vẫn đồng hành cùng Cường chứ? 🤝', yn: true },
  ],
  qTime: 10,
  map: 'https://www.google.com/maps/search/?api=1&query=Nh%C3%A0+h%C3%A1t+H%C3%B2a+B%C3%ACnh+240+%C4%90%C6%B0%E1%BB%9Dng+3+Th%C3%A1ng+2+TP.HCM',
};
const DEMO_GUEST = { code: 'demo', name: 'Bạn', toi: 'tui', ban: 'bạn', note: '' };

/* ================= TIỆN ÍCH ================= */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const wait = ms => new Promise(r => setTimeout(r, ms));
const store = {
  get(k, d) { try { const v = localStorage.getItem('tr007_' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('tr007_' + k, JSON.stringify(v)); } catch {} },
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1).replace('.0', '') + 'K' : String(n);
let G = DEMO_GUEST;
const T = s => s.replace(/\{Ban\}/g, cap(G.ban)).replace(/\{ban\}/g, G.ban).replace(/\{Toi\}/g, cap(G.toi)).replace(/\{toi\}/g, G.toi);
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2200); }
function confetti(n = 70) {
  const box = $('#confetti'), cols = ['#FF8000', '#D9823B', '#008EFF', '#1554B8', '#E2B867', '#fff'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.style.left = Math.random() * 100 + '%'; c.style.background = cols[i % cols.length];
    c.style.animationDuration = 1.6 + Math.random() * 1.6 + 's'; c.style.animationDelay = Math.random() * .5 + 's';
    box.appendChild(c); setTimeout(() => c.remove(), 4000);
  }
}
function seatOf(code) { let h = 0; for (const c of code) h = (h * 31 + c.charCodeAt(0)) >>> 0; return (1 + h % 30) + 'ABCDEF'[h % 6]; }
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

/* ================= API (Google Sheet) ================= */
async function apiGet(params) {
  if (!CFG.API) return null;
  const r = await fetch(CFG.API + '?' + new URLSearchParams(params));
  return r.json();
}
function apiPost(data) {
  if (!CFG.API) return Promise.resolve({ ok: true });
  return fetch(CFG.API, { method: 'POST', body: JSON.stringify({ ...data, k: G.code, name: data.name ?? G.name }) }).then(r => r.json()).catch(() => ({ ok: false }));
}

/* ================= ÂM THANH ================= */
const AU = { ctx: null, muted: store.get('muted', false), master: null };
function audio() {
  if (!AU.ctx) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    AU.ctx = new C();
    const comp = AU.ctx.createDynamicsCompressor(); comp.connect(AU.ctx.destination);
    AU.master = AU.ctx.createGain(); AU.master.gain.value = AU.muted ? 0 : .55; AU.master.connect(comp);
    AU.noise = AU.ctx.createBuffer(1, AU.ctx.sampleRate, AU.ctx.sampleRate);
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
  beep() { const c = audio(); if (!c) return; const t = c.currentTime; tone(1760, t, .07, 'square', .12); tone(2093, t + .1, .12, 'square', .12); },
  blip(i = 0) { const c = audio(); if (!c) return; tone([660, 784, 880, 988, 1175, 1319, 1480, 1760][i % 8], c.currentTime, .08, 'triangle', .25); },
  coin() { const c = audio(); if (!c) return; const t = c.currentTime; tone(1319, t, .06, 'square', .1); tone(1976, t + .05, .12, 'square', .1); },
  hit() { const c = audio(); if (!c) return; const t = c.currentTime; noise(t, .3, .5, 'lowpass', 600); tone(90, t, .3, 'sawtooth', .25); },
  err() { const c = audio(); if (!c) return; tone(110, c.currentTime, .2, 'sawtooth', .2); },
  tick() { const c = audio(); if (!c) return; tone(1200, c.currentTime, .03, 'square', .06); },
  win() { const c = audio(); if (!c) return; const t = c.currentTime; [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * .08, .25, 'triangle', .25)); },
  swoosh() { const c = audio(); if (!c) return; noise(c.currentTime, .7, .25, 'bandpass', 1100, .7); },
  ding() { const c = audio(); if (!c) return; const t = c.currentTime; tone(2349, t, .9, 'sine', .25); tone(3136, t, .7, 'sine', .1); },
};

/* Nhạc nền tự tổng hợp (không dính bản quyền) – house 124 BPM */
const MUSIC = { bpm: 124, on: false, step: 0, next: 0, t0: 0, timer: null, useCtx: false };
MUSIC.spb = 60 / MUSIC.bpm; MUSIC.bar = MUSIC.spb * 4;
const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function schedStep(s, t) {
  const c = AU.ctx, i = s % 16, bar = Math.floor(s / 16), ch = PROG[bar % 4], intense = bar % 8 >= 4;
  if (i % 4 === 0) { const o = tone(150, t, .3, 'sine', 1); o.frequency.exponentialRampToValueAtTime(42, t + .14); }
  if (i === 4 || i === 12) noise(t, .16, .45, 'bandpass', 1600, .8);
  if (i % 4 === 2) noise(t, .06, .28, 'highpass', 7000); else if (intense) noise(t, .025, .08, 'highpass', 9000);
  if (i % 2 === 0) {
    const o = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o.frequency.value = mtof(ch[0] - 24); fl.type = 'lowpass'; fl.frequency.setValueAtTime(i % 4 === 2 ? 900 : 400, t);
    env(g, t, .005, .32, .16); o.connect(fl); fl.connect(g); g.connect(AU.master); o.start(t); o.stop(t + .25);
  }
  if (i % 4 === 2) {
    const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 2400; fl.connect(AU.master);
    ch.forEach(m => { tone(mtof(m), t, .17, 'sawtooth', .05, fl); tone(mtof(m) * 1.006, t, .17, 'sawtooth', .04, fl); });
  }
  if (intense) { const arp = [ch[0], ch[1], ch[2], ch[1] + 12, ch[2] + 12, ch[0] + 12]; tone(mtof(arp[i % 6] + 12), t, .09, 'square', .045); }
}
async function musicStart() {
  if (MUSIC.on) return;
  const c = audio();
  if (c && c.state !== 'running') await Promise.race([c.resume(), wait(400)]);
  MUSIC.useCtx = !!(c && c.state === 'running');
  MUSIC.on = true;
  if (!MUSIC.useCtx) { MUSIC.t0 = performance.now() / 1000; return; }
  MUSIC.step = 0; MUSIC.t0 = MUSIC.next = c.currentTime + .1;
  MUSIC.timer = setInterval(() => { while (MUSIC.next < c.currentTime + .12) { schedStep(MUSIC.step, MUSIC.next); MUSIC.next += MUSIC.spb / 4; MUSIC.step++; } }, 25);
}
function musicStop() { MUSIC.on = false; clearInterval(MUSIC.timer); }
const now = () => MUSIC.useCtx ? AU.ctx.currentTime : performance.now() / 1000;
$('#btnMute').textContent = AU.muted ? '🔇' : '🔊';
$('#btnMute').onclick = () => {
  AU.muted = !AU.muted; store.set('muted', AU.muted); $('#btnMute').textContent = AU.muted ? '🔇' : '🔊';
  if (AU.master) AU.master.gain.value = AU.muted ? 0 : .55;
};

/* ================= CHIBI HƯỚNG DẪN (video nhỏ) + BONG BÓNG THOẠI ================= */
const guide = mountChibi($('#pipChibi'), 'guide');
let guideTimer = 0;
function setGuide(text, who = 'HƯỚNG DẪN · CƯỜNG') {
  const el = $('#pipTxt'); clearInterval(guideTimer);
  $('#pipWho').textContent = who; el.textContent = '';
  const full = T(text); let i = 0; guide.talk(true);
  guideTimer = setInterval(() => { el.textContent = full.slice(0, ++i); if (i >= full.length) { clearInterval(guideTimer); setTimeout(() => guide.talk(false), 300); } }, 28);
}
let bubbleH = 0;
function say(who, text, ms = 4200) {
  const b = $('#bubble'); $('#bubbleWho').textContent = who; $('#bubbleTxt').textContent = T(text);
  b.classList.add('on'); const a = W.current() && W.current().agent; if (a) a.userData.talk(true);
  clearTimeout(bubbleH); bubbleH = setTimeout(() => { b.classList.remove('on'); if (a) a.userData.talk(false); }, ms);
}
function hush() { $('#bubble').classList.remove('on'); const a = W.current() && W.current().agent; if (a) a.userData.talk(false); }

/* ================= ĐIỀU HƯỚNG ================= */
const S = { stage: '', rsvp: store.get('rsvp', null), cls: store.get('cls', null), bonus: store.get('bonus', 0), best: store.get('best', 0), skip: false };
const SCENE = { intro: ['airport', { cam: 'wide' }], checkin: ['airport', { variant: 'checkin' }], quiz: ['airport', { variant: 'customs' }], lobby: ['lobby'], door: ['door'] };
const PAPER = ['review', 'wall'];
const ENTER = {};
async function go(id) {
  hush();
  S.stage = id;
  $('#app').classList.toggle('paper', PAPER.includes(id));
  $('#btnSkip').style.visibility = ['intro', 'checkin', 'quiz', 'flight', 'lobby'].includes(id) ? 'visible' : 'hidden';
  if (id !== 'game') musicStop();
  if (SCENE[id]) await W.show(SCENE[id][0], SCENE[id][1] || {});
  $$('.stage').forEach(s => s.classList.toggle('on', s.id === 's-' + id));
  const sc = $('#s-' + id + ' .scroll'); if (sc) sc.scrollTop = 0;
  (ENTER[id] || (() => {}))();
}
$('#btnSkip').onclick = () => { S.skip = true; go(S.rsvp ? 'wall' : 'checkin'); };

/* ================= 0. VÉ MÁY BAY ================= */
function updateClass() {
  const el = $('#passClass');
  el.className = 'cls-tag ' + (S.cls === 'biz' ? 'cls-biz' : S.cls === 'eco' ? 'cls-eco' : 'cls-none');
  el.textContent = S.cls === 'biz' ? 'THƯƠNG GIA' : S.cls === 'eco' ? 'PHỔ THÔNG' : 'CHƯA XẾP';
  $('#kcClass').textContent = S.cls === 'biz' ? 'Thương gia' : S.cls === 'eco' ? 'Phổ thông' : '—';
}
function renderGuest() {
  $('#hello').textContent = T('{Ban} ơi, Cường tốt nghiệp rồi!');
  $('#helloSub').textContent = G.note || T('Mời {ban} lên chuyến bay TXCC2026 tới lễ tốt nghiệp của Cường. Check-in, qua hải quan, bay một chuyến rồi nhận phòng tại TR007 HOTEL nhé!');
  $('#passName').textContent = G.name.toUpperCase();
  $('#passSeat').textContent = seatOf(G.code);
  $('#kcName').textContent = G.name;
  $('#rvName').value = G.code === 'demo' ? '' : G.name;
  $('#ckQ').textContent = T('{Ban} xác nhận lên chuyến bay chứ?');
  updateClass();
}
ENTER.intro = () => setGuide('Chào {ban}! Đây là vé máy bay của {ban}. Bấm "Đến quầy check-in" để bắt đầu nha ✈️');
(function tilt() {
  const p = $('#pass');
  const move = (x, y) => { p.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 8}deg)`; p.style.setProperty('--sh', (x * 80) + '%'); };
  $('#s-intro').addEventListener('pointermove', e => { const r = p.getBoundingClientRect(); move((e.clientX - r.left) / r.width - .5, (e.clientY - r.top) / r.height - .5); });
  addEventListener('deviceorientation', e => { if (S.stage === 'intro' && e.gamma != null) move(Math.max(-1, Math.min(1, e.gamma / 30)) / 2, Math.max(-1, Math.min(1, (e.beta - 45) / 30)) / 2); });
})();
$('#goCheckin').onclick = () => { audio(); SFX.swoosh(); go('checkin'); };

/* ================= 1. QUẦY CHECK-IN ================= */
const DODGE_SAY = ['Ơ kìa 😏', 'Bấm hụt rồi!', 'Không bắt được đâu 🏃', 'Đi đi mà 🥺', 'Thôi mà…'];
function makeDodger(btn, area, sayEl, fallbackText, onGiveUp) {
  let n = 0, tired = 0;
  const yes = area.querySelector('.btn');
  const reset = () => { n = 0; tired = 0; btn.removeAttribute('style'); btn.textContent = btn.dataset.label; sayEl.textContent = ''; };
  btn.dataset.label = btn.textContent;
  const move = e => {
    if (tired) return;
    e.preventDefault(); e.stopPropagation(); n++;
    if (n > DODGE_SAY.length) {
      tired = Date.now(); Object.assign(btn.style, { left: '0', right: 'auto', top: '72px', width: '100%', fontSize: '13px' });
      btn.textContent = fallbackText; sayEl.textContent = ''; return;
    }
    const a = area.getBoundingClientRect(), b = btn.getBoundingClientRect(), y0 = yes.getBoundingClientRect();
    let x, y;
    for (let i = 0; i < 14; i++) {
      x = Math.random() * (a.width - b.width); y = Math.random() * (a.height - b.height - 24);
      if (x > y0.right - a.left || x + b.width < y0.left - a.left || y > y0.bottom - a.top) break;
    }
    Object.assign(btn.style, { right: 'auto', left: x + 'px', top: y + 'px' });
    sayEl.textContent = DODGE_SAY[n - 1]; SFX.blip(n);
  };
  btn.addEventListener('pointerdown', move);
  btn.addEventListener('click', e => { if (tired && Date.now() - tired > 400) onGiveUp(); });
  return { n: () => n, reset };
}
const noDodger = makeDodger($('#btnNo'), $('#choices'), $('#dodgeSay'), 'Bận thật hả? Gửi lời chúc cho Cường nha 🥲', () => {
  S.rsvp = { go: false }; store.set('rsvp', S.rsvp);
  apiPost({ a: 'rsvp', go: false, n: 0, dodges: noDodger.n() });
  go('review');
});
ENTER.checkin = () => {
  noDodger.reset(); // luôn hiện lại cả 2 nút, kể cả khi đã check-in trước đó
  setTimeout(() => say('NHÂN VIÊN CHECK-IN · CƯỜNG', 'Xin chào {ban}! Mời {ban} xác nhận chuyến bay TXCC2026 ạ ✈️'), 900);
  setGuide('Bấm "Có, đi chứ!" để xác nhận đi lễ. Nút "Không đi" hơi khó bấm đó 😏');
};
$('#btnYes').onclick = () => {
  S.rsvp = { go: true }; store.set('rsvp', S.rsvp);
  apiPost({ a: 'rsvp', go: true, n: 1, dodges: noDodger.n() });
  SFX.win(); confetti(); toast('Check-in thành công ✅');
  say('NHÂN VIÊN CHECK-IN · CƯỜNG', 'Tuyệt vời! Mời {ban} qua cửa hải quan nhé 🛂', 1500);
  setTimeout(() => go(S.skip ? 'wall' : 'quiz'), 1400);
};

/* ================= 2. HẢI QUAN (10 giây / câu) ================= */
let qi = 0, correct = 0, qTimer = 0, qLeft = 0, qLock = false;
ENTER.quiz = () => {
  qi = 0; correct = 0; $('#ppOv').classList.remove('on'); $('#qSheet').style.display = '';
  setGuide('5 câu hỏi, mỗi câu chỉ có 10 giây. Đúng từ 3 câu trở lên là lên hạng Thương gia!');
  say('HẢI QUAN · CƯỜNG', 'Hải quan đây! Trả lời nhanh lên, đồng hồ chạy rồi đó 😎', 3000);
  setTimeout(showQ, 600);
};
function showQ() {
  const q = CFG.quiz[qi]; qLock = false;
  $$('#qdots i').forEach((e, i) => e.classList.toggle('on', i <= qi));
  $('#qNo').textContent = `Hải quan · Câu ${qi + 1}/${CFG.quiz.length}`;
  $('#qText').textContent = T(q.q); $('#qFeed').textContent = '';
  const body = $('#qBody'); body.innerHTML = '';
  if (q.yn) {
    body.innerHTML = '<div class="yn" id="yn"><button class="btn">Có 🧡</button><button class="dodger">Không</button><div class="dodge-say"></div></div>';
    body.querySelector('.btn').onclick = () => answer(true);
    makeDodger(body.querySelector('.dodger'), $('#yn'), body.querySelector('.dodge-say'), 'Thôi được rồi, chọn Không 😤', () => answer(false));
  } else {
    const box = document.createElement('div'); box.className = 'opts';
    shuffle(q.opts.map((o, i) => i)).forEach(i => {
      const b = document.createElement('button'); b.className = 'opt'; b.textContent = q.opts[i];
      b.onclick = () => { b.classList.add(i === q.a ? 'right' : 'wrong'); answer(i === q.a); };
      box.appendChild(b);
    });
    body.appendChild(box);
  }
  startTimer();
}
function startTimer() {
  clearInterval(qTimer); qLeft = CFG.qTime;
  const fg = $('#timerFg'), n = $('#timerN'), tm = $('#timer'), t0 = performance.now();
  let lastSec = qLeft;
  qTimer = setInterval(() => {
    const left = Math.max(0, CFG.qTime - (performance.now() - t0) / 1000);
    fg.style.strokeDashoffset = 138.2 * (1 - left / CFG.qTime);
    const sec = Math.ceil(left); n.textContent = sec; tm.classList.toggle('warn', left <= 3);
    if (sec !== lastSec) { lastSec = sec; if (sec <= 3 && sec > 0) SFX.tick(); }
    if (left <= 0) { clearInterval(qTimer); $('#qFeed').textContent = '⏰ Hết giờ!'; SFX.err(); answer(false, true); }
  }, 50);
}
function answer(ok, timeout = false) {
  if (qLock) return; qLock = true; clearInterval(qTimer);
  if (ok) correct++;
  if (!timeout) { $('#qFeed').textContent = ok ? '✅ Chuẩn luôn!' : '❌ Sai rồi nha'; ok ? SFX.blip(4) : SFX.err(); }
  setTimeout(() => { qi++; qi < CFG.quiz.length ? showQ() : finishQuiz(); }, 750);
}
function finishQuiz() {
  S.cls = correct >= 3 ? 'biz' : 'eco'; store.set('cls', S.cls); updateClass();
  apiPost({ a: 'quiz', score: correct, cls: S.cls });
  $('#qSheet').style.display = 'none'; hush();
  $('#ppName').textContent = G.name.toUpperCase();
  $('#ppScore').textContent = `ĐÚNG ${correct}/${CFG.quiz.length} CÂU`;
  const st = $('#stamp'); st.classList.remove('hit');
  $('#ppBook').style.setProperty('--stampc', S.cls === 'biz' ? '#B45309' : '#1554B8');
  $('#stampText').textContent = S.cls === 'biz' ? '★ BUSINESS CLASS · TXCC2026 ★' : '★ ECONOMY CLASS · TXCC2026 ★';
  $('#ppRes').classList.remove('on'); $('#goFly').hidden = true;
  $('#ppOv').classList.add('on');
  setGuide(S.cls === 'biz' ? 'Hạng Thương gia! Chuyến bay của {ban} có trò nhặt tiền thưởng 💰' : 'Hạng Phổ thông! Chuyến bay sẽ có chướng ngại vật, cẩn thận nha 🌩️');
  setTimeout(() => {
    st.classList.add('hit');
    setTimeout(() => { SFX.stamp(); $('#ppBook').classList.add('shake'); setTimeout(() => $('#ppBook').classList.remove('shake'), 400); }, 260);
    $('#ppRes').innerHTML = S.cls === 'biz' ? '<div class="disp">🥂 HẠNG THƯƠNG GIA</div><p>Hiểu Cường quá trời luôn!</p>' : '<div class="disp">🎒 HẠNG PHỔ THÔNG</div><p>Vẫn được bay, nhưng cần tìm hiểu Cường thêm nha 😆</p>';
    setTimeout(() => { $('#ppRes').classList.add('on'); $('#goFly').hidden = false; if (S.cls === 'biz') confetti(); }, 500);
  }, 900);
}
$('#goFly').onclick = () => go(W.glOK ? 'flight' : 'lobby');

/* ================= 3. GAME MÁY BAY ================= */
let flightApi = null;
ENTER.flight = async () => {
  const biz = S.cls === 'biz';
  $('#fIntro').classList.add('on'); $('#fEnd').classList.remove('on');
  $('#fKick').textContent = biz ? 'Hạng thương gia · 20 giây' : 'Hạng phổ thông · 3 mạng';
  $('#fTitle').textContent = biz ? 'Bay nhặt tiền thưởng 💰' : 'Vượt chướng ngại vật 🌩️';
  $('#fRules').innerHTML = biz
    ? '<div><span>👆</span><div><b>Kéo ngón tay</b> trên màn hình để lái máy bay.</div></div><div><span>🪙</span><div>Nhặt <b>đồng tiền vàng</b>, đồng to được 5 điểm. Điểm sẽ được <b>cộng thêm</b> vào game Audition ở khách sạn.</div></div>'
    : '<div><span>👆</span><div><b>Kéo ngón tay</b> trên màn hình để lái máy bay.</div></div><div><span>❤️</span><div>Né <b>mây giông, khinh khí cầu, đàn chim</b>. Bạn có <b>3 mạng</b>. Còn mạng nào được cộng điểm mạng đó.</div></div>';
  $('#fScore').innerHTML = biz ? '🪙 <b>0</b>' : '<span>❤️❤️❤️</span>';
  $('#fTime').textContent = 20;
  setGuide(biz ? 'Kéo ngón tay để lái, nhặt càng nhiều tiền càng được cộng điểm!' : 'Kéo ngón tay để né chướng ngại vật. Chỉ có 3 mạng thôi nha!', 'CƠ TRƯỞNG · CƯỜNG');
  flightApi = await W.show('flight', {
    mode: biz ? 'coins' : 'obstacles', duration: 20, sfx: { coin: SFX.coin, hit: SFX.hit },
    onHud: h => {
      $('#fTime').textContent = Math.ceil(h.time);
      $('#fScore').innerHTML = h.mode === 'coins' ? `🪙 <b>${h.score}</b>` : `<span>${'❤️'.repeat(h.lives)}${'🖤'.repeat(3 - h.lives)}</span>`;
    },
    onEnd: r => {
      musicStop();
      S.bonus = r.mode === 'coins' ? r.score * 4000 : r.lives * 15000 + (r.survived ? 20000 : 0);
      store.set('bonus', S.bonus);
      $('#fFinal').textContent = r.mode === 'coins' ? `🪙 ${r.score}` : (r.survived ? `❤️ x${r.lives}` : '💥');
      $('#fVerdict').textContent = r.mode === 'coins' ? `+${fmt(S.bonus)} điểm thưởng sẽ cộng vào game ở khách sạn!` : r.survived ? `Hạ cánh an toàn! +${fmt(S.bonus)} điểm thưởng.` : 'Máy bay hơi xóc… nhưng vẫn tới nơi an toàn 😆';
      $('#fEnd').classList.add('on'); SFX.win();
    },
  });
};
$('#fStart').onclick = async () => { $('#fIntro').classList.remove('on'); await musicStart(); flightApi && flightApi.start(); };
$('#fNext').onclick = () => go('cine');

/* ================= 4. CINEMATIC ================= */
let cineDone = false;
ENTER.cine = async () => {
  cineDone = false; $('#pip').classList.add('hide');
  SFX.swoosh(); setTimeout(SFX.swoosh, 2500);
  await W.show('cinematic', { duration: 7.5, onEnd: endCine });
};
function endCine() {
  if (cineDone) return; cineDone = true;
  $('#whiteout').classList.add('on');
  setTimeout(async () => { await go('lobby'); $('#pip').classList.remove('hide'); $('#whiteout').classList.remove('on'); }, 900);
}
$('#cineSkip').onclick = endCine;

/* ================= 5. SẢNH LỄ TÂN ================= */
ENTER.lobby = () => {
  $('#lRules').classList.remove('on'); $('#pip').classList.remove('hide');
  setGuide('Mình đang ở sảnh TR007. Lễ tân sẽ giao nhiệm vụ trước khi nhận phòng.', 'HƯỚNG DẪN · CƯỜNG');
  setTimeout(() => { SFX.ding(); say('LỄ TÂN TR007 · CƯỜNG', 'Chào mừng {ban} tới TR007 HOTEL! Hoàn thành nhiệm vụ để nhận phòng nhé 🗝️', 3400); }, 2600);
  setTimeout(() => { if (S.stage === 'lobby') { $('#lRules').classList.add('on'); setGuide('Đọc luật chơi rồi bấm Bắt đầu. Có nhạc nên nhớ bật tiếng nha 🎵', 'LỄ TÂN · CƯỜNG'); } }, 5600);
};
$('#lStart').onclick = () => go('game');
$('#lSkip').onclick = () => go('door');

/* ================= 6. AUDITION (20 giây, 1→5 mũi tên) ================= */
const ROUNDS = ['Lên ý tưởng', 'Chụp ảnh', 'Viết caption', 'Chạy quảng cáo', 'ĐĂNG BÀI!'];
const ARW = ['↑', '←', '↓', '→'];
const TARGET = .75, ZONES = [.04, .09, .15], GAME_T = 20;
const RATE = [{ t: 'VIRAL 🔥', c: '#FFC27A', v: 60000 }, { t: 'TRENDING 📈', c: '#7CC4FF', v: 34000 }, { t: 'ỔN ÁP 👍', c: '#B9F5C8', v: 16000 }, { t: 'FLOP 💀', c: '#FF8A8A', v: 2500 }];
const GS = { on: false, r: 0, seq: [], pos: 0, views: 0, combo: 0, rStart: 0, locked: false, raf: 0, t0: 0 };
(function drawZones() {
  const zs = $$('#gBeat .zone');
  [ZONES[2], ZONES[1], ZONES[0]].forEach((w, i) => { zs[i].style.left = (TARGET - w) * 100 + '%'; zs[i].style.width = w * 200 + '%'; });
  [.25, .5].forEach(p => { const t = document.createElement('div'); t.className = 'tick'; t.style.left = p * 100 + '%'; $('#gBeat').appendChild(t); });
})();
ENTER.game = () => { startGame(); setGuide('Bấm mũi tên đúng thứ tự, rồi bấm ĐĂNG! khi vạch trắng vào ô cam.', 'LỄ TÂN · CƯỜNG'); };
async function startGame() {
  $('#gEnd').classList.remove('on');
  Object.assign(GS, { on: true, r: -1, views: 0, combo: 0 });
  $('#gViews').textContent = '0'; $('#gRate').textContent = '';
  await musicStart();
  GS.t0 = now();
  nextRound();
  cancelAnimationFrame(GS.raf); GS.raf = requestAnimationFrame(loop);
}
const beatPos = () => ((((now() - MUSIC.t0) % MUSIC.bar) + MUSIC.bar) % MUSIC.bar) / MUSIC.bar;
function nextRound() {
  if (!GS.on) return;
  GS.r++;
  if (GS.r >= ROUNDS.length) return endGame();
  GS.seq = Array.from({ length: GS.r + 1 }, () => Math.floor(Math.random() * 4)); GS.pos = 0; GS.locked = false;
  GS.rStart = now();
  $('#gRound').textContent = `${GS.r + 1}/${ROUNDS.length}`; $('#gStage').textContent = ROUNDS[GS.r];
  $('#gSeq').innerHTML = GS.seq.map(k => `<b>${ARW[k]}</b>`).join('');
}
function loop() {
  if (!GS.on) return;
  $('#gCur').style.left = beatPos() * 100 + '%';
  const left = Math.max(0, GAME_T - (now() - GS.t0));
  $('#gTimeBar').style.width = (left / GAME_T * 100) + '%';
  if (left <= 0) return endGame();
  if (!GS.locked && now() > GS.rStart + MUSIC.bar * 2.2) rate(-1);
  GS.raf = requestAnimationFrame(loop);
}
function press(k) {
  if (!GS.on || GS.locked) return;
  if (k === 'post') {
    if (GS.pos < GS.seq.length) return rate(-1);
    const d = Math.abs(beatPos() - TARGET);
    return rate(d <= ZONES[0] ? 0 : d <= ZONES[1] ? 1 : d <= ZONES[2] ? 2 : 3);
  }
  const cells = $$('#gSeq b');
  if (GS.pos >= GS.seq.length) return;
  if (+k === GS.seq[GS.pos]) { cells[GS.pos].classList.add('done'); GS.pos++; SFX.blip(GS.pos); }
  else { SFX.err(); cells.forEach(c => { c.classList.remove('done'); c.classList.add('err'); }); setTimeout(() => cells.forEach(c => c.classList.remove('err')), 220); GS.pos = 0; }
}
function rate(i) {
  GS.locked = true;
  const el = $('#gRate');
  if (i < 0) { el.textContent = 'MISS 😵'; el.style.color = '#FF8A8A'; GS.combo = 0; SFX.err(); }
  else {
    const R = RATE[i]; el.textContent = R.t; el.style.color = R.c;
    GS.combo = i === 0 ? GS.combo + 1 : i === 1 ? GS.combo : 0;
    GS.views += Math.round(R.v * (GS.seq.length + 1) / 3 * (1 + GS.combo * .25) + Math.random() * 999);
    $('#gViews').textContent = fmt(GS.views);
    i === 0 ? SFX.win() : i < 3 ? SFX.blip(5) : SFX.err();
  }
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  setTimeout(nextRound, 600);
}
function endGame() {
  if (!GS.on) return;
  GS.on = false; cancelAnimationFrame(GS.raf); setTimeout(musicStop, 300);
  const total = GS.views + (S.bonus || 0);
  $('#gFinal').textContent = fmt(total);
  $('#gBreak').textContent = `Audition ${fmt(GS.views)} + thưởng chuyến bay ${fmt(S.bonus || 0)}`;
  $('#gVerdict').textContent = total > 700000 ? 'Chiến dịch triệu view! Thuê làm Marketing Manager ngay 🔥' : total > 300000 ? 'Lên xu hướng rồi! Khá lắm đó 📈' : 'Hơi flop… chơi lại gỡ gạc không? 😆';
  if (total > S.best) { S.best = total; store.set('best', total); }
  apiPost({ a: 'score', views: total });
  $('#gEnd').classList.add('on'); confetti(40);
  setGuide('Xong nhiệm vụ! Bấm "Lên phòng 0812" để nhận phòng nha 🗝️', 'LỄ TÂN · CƯỜNG');
}
$$('.pad button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); press(b.dataset.k); }));
addEventListener('keydown', e => {
  if (S.stage !== 'game') return;
  const m = { ArrowUp: 0, ArrowLeft: 1, ArrowDown: 2, ArrowRight: 3, ' ': 'post', Enter: 'post' }[e.key];
  if (m !== undefined) { e.preventDefault(); press(m); }
});
$('#gNext').onclick = () => go('door');
$('#gAgain').onclick = () => startGame();

/* ================= 7. CỬA PHÒNG ================= */
let doorApi = null, opened = false, zoneRaf = 0;
ENTER.door = () => {
  opened = false; doorApi = W.current();
  const kc = $('#keycard'); kc.style.transform = ''; kc.style.opacity = ''; $('#hand').classList.remove('push');
  setGuide('Kéo thẻ phòng chạm vào ổ khóa bên phải cửa để mở cửa.', 'HƯỚNG DẪN · CƯỜNG');
  cancelAnimationFrame(zoneRaf);
  const place = () => {
    const z = $('#lockzone'), app = $('#app').getBoundingClientRect();
    const r = doorApi && doorApi.lockScreenRect ? doorApi.lockScreenRect() : { x: app.left + app.width * .78, y: app.top + app.height * .45, w: 70, h: 110 };
    Object.assign(z.style, { left: (r.x - app.left) + 'px', top: (r.y - app.top) + 'px', width: r.w + 'px', height: r.h + 'px' });
    if (S.stage === 'door') zoneRaf = requestAnimationFrame(place);
  };
  place();
};
(function keyDrag() {
  const kc = $('#keycard'), zone = $('#lockzone');
  let sx, sy, ly = 0, dragging = false;
  const over = () => { const a = kc.getBoundingClientRect(), b = zone.getBoundingClientRect(); return a.top < b.bottom && a.bottom > b.top && a.right > b.left && a.left < b.right; };
  kc.addEventListener('pointerdown', e => { if (opened) return; dragging = true; sx = e.clientX; sy = e.clientY; kc.classList.remove('back'); ly = e.clientY; try { kc.setPointerCapture(e.pointerId); } catch {} audio(); });
  kc.addEventListener('pointermove', e => {
    if (!dragging) return;
    ly = e.clientY;
    kc.style.transform = `translate(calc(-50% + ${e.clientX - sx}px),${e.clientY - sy}px) rotate(${(e.clientX - sx) / 25}deg) scale(.8)`;
    zone.classList.toggle('hover', over());
  });
  const end = () => {
    if (!dragging) return; dragging = false; zone.classList.remove('hover');
    if (over() || sy - ly > innerHeight * .28) unlock(); else { kc.classList.add('back'); kc.style.transform = ''; }
  };
  kc.addEventListener('pointerup', end); kc.addEventListener('pointercancel', end);
  zone.addEventListener('click', unlock);
})();
function unlock() {
  if (opened) return; opened = true;
  SFX.beep(); doorApi && doorApi.unlock && doorApi.unlock();
  const kc = $('#keycard'); kc.classList.add('back'); kc.style.transform = 'translate(-50%,40px) scale(.9)'; kc.style.opacity = '0';
  setTimeout(() => { $('#hand').classList.add('push'); }, 350);
  setTimeout(() => { doorApi && doorApi.open && doorApi.open(); SFX.swoosh(); }, 900);
  setTimeout(() => { $('#whiteout').classList.add('on'); SFX.win(); }, 1900);
  setTimeout(async () => { await go(store.get('reviewed', false) ? 'wall' : 'review'); setTimeout(() => $('#whiteout').classList.remove('on'), 150); }, 2800);
}

/* ================= 8. REVIEW ================= */
let stars = 5;
(function () {
  const box = $('#stars');
  for (let i = 1; i <= 5; i++) { const b = document.createElement('button'); b.textContent = '⭐'; b.onclick = () => { stars = i; paint(); SFX.blip(i); }; box.appendChild(b); }
  const paint = () => [...box.children].forEach((b, i) => b.classList.toggle('on', i < stars)); paint();
})();
ENTER.review = () => {
  const no = S.rsvp && !S.rsvp.go;
  $('#rvTitle').textContent = no ? 'Tiếc ghê! Gửi Cường lời chúc nha 🥲' : 'Để lại review 5 sao cho Cường nhé ⭐';
  setGuide(no ? 'Không đi được cũng không sao, gửi Cường vài lời chúc nha 🧡' : 'Viết vài lời chúc, sẽ được chiếu lên màn hình trong ngày lễ!');
};
$('#rvSend').onclick = async () => {
  const name = $('#rvName').value.trim(), text = $('#rvText').value.trim();
  if (!name) return toast('Ghi tên giúp Cường nha 😊');
  if (text.length < 2) return toast('Viết vài chữ chúc mừng nha ✍️');
  $('#rvSend').disabled = true; $('#rvSend').textContent = 'Đang gửi…';
  store.set('myReview', { name, stars, text }); store.set('reviewed', true);
  await apiPost({ a: 'review', name, stars, text });
  $('#rvSend').disabled = false; $('#rvSend').textContent = 'Gửi review 💌';
  confetti(); go('wall');
};

/* ================= 9. WALL ================= */
$('#lnkMap').href = CFG.map;
$('#lnkCal').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('🎓 Lễ tốt nghiệp của Cao Cường') +
  '&dates=20261208T080000Z/20261208T100000Z&location=' + encodeURIComponent('Nhà hát Hòa Bình, 240 Đường 3 Tháng 2, TP.HCM') +
  '&details=' + encodeURIComponent('Chuyến bay TXCC2026 – hẹn gặp lúc 15:00!');
ENTER.wall = async () => {
  const no = S.rsvp && !S.rsvp.go;
  $('#wallTitle').textContent = no ? 'Cảm ơn lời chúc của bạn! 🧡' : 'Hẹn gặp lúc 15:00 – 08/12 nhé! 🧡';
  setGuide(no ? 'Cảm ơn {ban} nhiều nha! Cường sẽ đọc lời chúc trong ngày lễ 🧡' : 'Hẹn gặp {ban} lúc 15:00 ngày 08/12 ở Nhà hát Hòa Bình nhé! 🎓');
  let data = null; try { data = await apiGet({ a: 'wall' }); } catch {}
  const mine = store.get('myReview', null);
  let reviews = (data && data.reviews) || [];
  if (mine && !reviews.some(r => r.name === mine.name && r.text === mine.text)) reviews = [mine, ...reviews];
  if (!reviews.length) reviews = [{ name: 'Cường', stars: 5, text: 'Review đầu tiên sẽ là của bạn đó! 😆' }];
  $('#wallRv').innerHTML = reviews.map(r => `<div class="rv"><div class="h"><span>${esc(r.name)}</span><span class="s">${'★'.repeat(Math.max(1, Math.min(5, +r.stars || 5)))}</span></div><p>${esc(r.text)}</p></div>`).join('');
  let lb = (data && data.board) || [];
  if (!data && S.best) lb = [{ name: G.name, views: S.best }];
  $('#wallLb').innerHTML = lb.length ? lb.map((r, i) => `<div class="lbr"><div class="r">${['🥇', '🥈', '🥉'][i] || i + 1}</div><div class="n">${esc(r.name)}</div><div class="v">${fmt(+r.views)}</div></div>`).join('')
    : '<p style="text-align:center;color:var(--muted)">Chưa có ai chơi. Vào chiếm top 1 đi! 🏆</p>';
};
$$('.tabs button').forEach(b => b.onclick = () => {
  $$('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  $('#wallRv').hidden = b.dataset.t !== 'rv'; $('#wallLb').hidden = b.dataset.t !== 'lb';
});
$('#wAgain').onclick = e => { e.preventDefault(); S.skip = false; go('intro'); };
$('#wGame').onclick = e => { e.preventDefault(); go('lobby'); };

/* ================= KHỞI ĐỘNG ================= */
(async function init() {
  W.initGL($('#gl'));
  const k = new URLSearchParams(location.search).get('k');
  if (k) {
    try { const r = await apiGet({ a: 'guest', k }); if (r && r.ok) G = { ...DEMO_GUEST, ...r.guest, code: k }; } catch {}
    if (G === DEMO_GUEST) G = { ...DEMO_GUEST, code: k };
  }
  try { await document.fonts.ready; } catch {}
  renderGuest();
  await go('intro');
  $('#loading').classList.add('off');
  window.__app = { go, S, GS, press, answer, W }; // tiện kiểm thử
})();
