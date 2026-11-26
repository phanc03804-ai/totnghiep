import * as W from './world.js';
import { mountChibi } from './chibi.js';

/* ================= CẤU HÌNH ================= */
const CFG = {
  API: 'https://script.google.com/macros/s/AKfycbyYKIRBcJRA3APnx04jQ56R9HeU1h6EeappjTL5wnRkGikVjYyIOqNAu5V19xpGM8xi/exec',
  quiz: [
    { q: '{Ban} có nhớ ngày sinh của Cường không?', opts: ['20/01/2004', '02/10/2004', '20/10/2003', '21/01/2004'], a: 0 },
    { q: 'Cân nặng hiện tại của Cường là bao nhiêu?', opts: ['80 kg', '68 kg', '74 kg', '90 kg'], a: 0 },
    { q: 'Nhà Cường ở đâu?', opts: ['TP. Hồ Chí Minh', 'Bà Rịa – Vũng Tàu', 'Đồng Nai', 'Bình Dương'], a: 0 },
    { q: '{Ban} có thích Cường không?', yn: true },
    { q: '5 năm nữa {ban} vẫn đồng hành cùng Cường chứ?', yn: true },
  ],
  qTime: 10,
  map: 'https://www.google.com/maps/search/?api=1&query=Nh%C3%A0+h%C3%A1t+H%C3%B2a+B%C3%ACnh+240+%C4%90%C6%B0%E1%BB%9Dng+3+Th%C3%A1ng+2+TP.HCM',
  // Thư cảm ơn sau video kỷ niệm ({ban}/{toi} tự đổi theo từng khách)
  letter: `Gửi {ban},

Cảm ơn {ban} đã đồng hành cùng {toi} suốt những năm tháng ở Kinh tế Đối ngoại – từ những buổi họp Đoàn, những đêm chạy chương trình, đến cả những lúc {toi} vấp ngã rồi đứng dậy.

Tấm bằng này không chỉ của riêng {toi}, mà có một phần rất lớn của {ban}.

Hẹn gặp {ban} lúc 15:00, thứ Ba 08/12/2026 tại Nhà hát Hòa Bình nhé.

Thương,`,
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
const icon = id => `<svg class="ic"><use href="#i-${id}"/></svg>`;
let G = DEMO_GUEST;
const T = s => s.replace(/\{Ban\}/g, cap(G.ban)).replace(/\{ban\}/g, G.ban).replace(/\{Toi\}/g, cap(G.toi)).replace(/\{toi\}/g, G.toi);
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
  coin() { const c = audio(); if (!c) return; const t = c.currentTime; tone(1319, t, .06, 'square', .08); tone(1976, t + .05, .12, 'square', .08); },
  hit() { const c = audio(); if (!c) return; const t = c.currentTime; noise(t, .3, .5, 'lowpass', 600); tone(90, t, .3, 'sawtooth', .25); },
  err() { const c = audio(); if (!c) return; tone(110, c.currentTime, .2, 'sawtooth', .18); },
  tick() { const c = audio(); if (!c) return; tone(1200, c.currentTime, .03, 'square', .05); },
  win() { const c = audio(); if (!c) return; const t = c.currentTime; [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * .08, .25, 'triangle', .22)); },
  swoosh() { const c = audio(); if (!c) return; noise(c.currentTime, .8, .22, 'bandpass', 1000, .7); },
  ding() { const c = audio(); if (!c) return; const t = c.currentTime; tone(2349, t, .9, 'sine', .22); tone(3136, t, .7, 'sine', .08); },
};

// Tiếng động cơ phản lực: tiếng ồn lọc trầm + tiếng ù, tăng giảm mượt
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
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = .3; lg.gain.value = 60; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    ENGINE.nodes = { src, g, hum, lfo };
  }
  ENGINE.nodes.g.gain.cancelScheduledValues(c.currentTime);
  ENGINE.nodes.g.gain.setTargetAtTime(level, c.currentTime, .6);
}
function engineStop(fade = 1) {
  if (!ENGINE.nodes || !AU.ctx) return;
  const { src, g, hum, lfo } = ENGINE.nodes, t = AU.ctx.currentTime;
  g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, fade / 3);
  setTimeout(() => { try { src.stop(); hum.stop(); lfo.stop(); } catch {} }, fade * 1500);
  ENGINE.nodes = null;
}



/* Nhạc: 2 bài riêng – nhạc nền (media/bgm.mp3) và nhạc game (media/game.mp3).
   Chưa có file thì tự phát bản nhạc soạn bằng code để trang không bị im lặng. */
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
// nhạc nền dự phòng: vui tươi, marimba, 116 BPM
function songStep(s, t) {
  const i = s % 16, bar = Math.floor(s / 16), sec = bar % 16, ch = CH[bar % 4], full = sec >= 4 && sec < 12, brk = sec >= 12;
  if (!brk && (i === 0 || i === 8 || (full && i === 10))) drum(t, 'kick', .8);
  if (i === 4 || i === 12) drum(t, 'clap', brk ? .22 : .32);
  if (i % 2 === 1 || full) drum(t, 'hat', i % 4 === 2 ? .1 : .05);
  if (!brk && i % 2 === 0) synthTone('triangle', mtof(ch[0] - 24 + (i % 4 === 2 ? 12 : 0)), t, .18, .42, 700);
  if (i % 2 === 0) { const arp = [ch[0], ch[1], ch[2], ch[0] + 12, ch[2], ch[1], ch[0] + 12, ch[1] + 12]; pluck(mtof(arp[i / 2] + 12), t, brk ? .08 : .13); }
  if (full && i % 2 === 0) { const n = MEL[bar % 4][i / 2]; if (n) { synthTone('triangle', mtof(n), t, .3, .12, 4000); pluck(mtof(n), t, .05, .2); } }
}
// nhạc game dự phòng: house sôi động, 128 BPM
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
const MUS = { cur: null, vol: .5, started: false, want: null };
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
// chuyển bài: 'bgm' | 'game' | null (tắt)
function musicPlay(name, vol = MUS.vol) {
  MUS.vol = vol;
  if (!MUS.started) { MUS.want = name; return; }
  if (MUS.cur === name) { bgmLevel(vol); return; }
  const old = MUS.cur && TRACKS[MUS.cur];
  if (old && hasFile(old.el) && !old.el.paused) fadeEl(old.el, 0, 600, () => old.el.pause());
  synthStop();
  MUS.cur = name; if (!name) return;
  const tr = TRACKS[name];
  if (hasFile(tr.el)) { tr.el.volume = 0; tr.el.play().then(() => fadeEl(tr.el, AU.muted ? 0 : vol, 900)).catch(() => { synthStart(tr); bgmLevel(vol); }); }
  else { synthStart(tr); setTimeout(() => bgmLevel(vol), 50); }
}
function bgmLevel(v, ms = 900) {
  MUS.vol = v; const tr = MUS.cur && TRACKS[MUS.cur]; if (!tr) return;
  if (SYN.fn === tr.fn && SYN.bus && AU.ctx) { SYN.bus.gain.cancelScheduledValues(AU.ctx.currentTime); SYN.bus.gain.setTargetAtTime(v, AU.ctx.currentTime, ms / 3000); }
  else if (hasFile(tr.el)) fadeEl(tr.el, AU.muted ? 0 : v, ms);
}
// trình duyệt chỉ cho phát nhạc sau lần chạm đầu tiên
addEventListener('pointerdown', () => {
  if (MUS.started) return; MUS.started = true; audio();
  const w = MUS.want || 'bgm'; MUS.want = null; musicPlay(w, MUS.vol);
}, { capture: true });

function paintMute() { $('#btnMute').innerHTML = icon(AU.muted ? 'mute' : 'sound'); }
paintMute();
$('#btnMute').onclick = () => {
  AU.muted = !AU.muted; store.set('muted', AU.muted); paintMute();
  if (AU.master) AU.master.gain.value = AU.muted ? 0 : .55;
  $('#memVideo').muted = AU.muted; bgmLevel(MUS.vol, 200);
};

/* ================= CHIBI HƯỚNG DẪN + BONG BÓNG THOẠI ================= */
const guide = mountChibi($('#pipChibi'), 'guide');
let guideTimer = 0;
function setGuide(text, who = 'HƯỚNG DẪN · CƯỜNG') {
  const el = $('#pipTxt'); clearInterval(guideTimer);
  $('#pipWho').textContent = who; el.textContent = '';
  const full = T(text); let i = 0; guide.talk(true);
  guideTimer = setInterval(() => { el.textContent = full.slice(0, ++i); if (i >= full.length) { clearInterval(guideTimer); setTimeout(() => guide.talk(false), 300); } }, 26);
}
function speaker() {
  const a = W.current() && W.current().agent; return a ? { talk: a.userData.talk } : null;
}
let bubbleH = 0;
function say(who, text, ms = 4200) {
  const b = $('#bubble'); $('#bubbleWho').textContent = who; $('#bubbleTxt').textContent = T(text);
  b.classList.add('on'); const a = speaker(); a && a.talk(true);
  clearTimeout(bubbleH); bubbleH = setTimeout(() => { b.classList.remove('on'); a && a.talk(false); }, ms);
}
function hush() { $('#bubble').classList.remove('on'); const a = speaker(); a && a.talk(false); }

/* ================= ĐIỀU HƯỚNG ================= */
const S = { stage: '', rsvp: store.get('rsvp', null), cls: store.get('cls', null), bonus: store.get('bonus', 0), best: store.get('best', 0), skip: false };
const SCENE = { intro: ['airport', { cam: 'wide' }], checkin: ['airport', { variant: 'checkin' }], quiz: ['airport', { variant: 'customs' }] };
const MODE = { review: 'paper', wall: 'paper', memory: 'film' };
const NO_PIP = ['cine', 'memory'];
const ENTER = {}, LEAVE = {};
async function go(id) {
  hush();
  const prev = S.stage; (LEAVE[prev] || (() => {}))();
  S.stage = id;
  const app = $('#app'); app.classList.remove('photo', 'paper', 'film'); if (MODE[id]) app.classList.add(MODE[id]);
  $('#pip').classList.toggle('hide', NO_PIP.includes(id));
  $('#btnSkip').style.visibility = ['intro', 'checkin', 'quiz', 'flight'].includes(id) ? 'visible' : 'hidden';
  if (SCENE[id]) { try { await W.show(SCENE[id][0], SCENE[id][1] || {}); } catch (e) { window.__errs.push(id + ': ' + e); } }
  else if (MODE[id]) W.clear();
  $$('.stage').forEach(s => s.classList.toggle('on', s.id === 's-' + id));
  const sc = $('#s-' + id + ' .scroll'); if (sc) sc.scrollTop = 0;
  (ENTER[id] || (() => {}))();
}
$('#btnSkip').onclick = () => { S.skip = true; go(S.rsvp ? 'wall' : 'checkin'); };

/* ================= 0. VÉ ================= */
function updateClass() {
  const el = $('#passClass');
  el.className = 'cls-tag ' + (S.cls === 'biz' ? 'cls-biz' : S.cls === 'eco' ? 'cls-eco' : 'cls-none');
  el.textContent = S.cls === 'biz' ? 'THƯƠNG GIA' : S.cls === 'eco' ? 'PHỔ THÔNG' : 'CHƯA XẾP';
}
function renderGuest() {
  $('#hello').textContent = T('{Ban} ơi, Cường tốt nghiệp rồi');
  $('#helloSub').textContent = G.note || T('Mời {ban} lên chuyến bay TXCC2026 tới lễ tốt nghiệp của Cường: check-in, qua hải quan, bay một chuyến rồi cùng bay tới lễ tốt nghiệp.');
  $('#passName').textContent = G.name;
  $('#passSeat').textContent = seatOf(G.code);
  $('#rvName').value = G.code === 'demo' ? '' : G.name;
  $('#ckQ').textContent = T('{Ban} xác nhận lên chuyến bay chứ?');
  updateClass();
}
ENTER.intro = () => { musicPlay('bgm', .5); setGuide('Chào {ban}! Đây là vé máy bay của {ban}. Bấm "Đến quầy check-in" để bắt đầu nhé.'); };
(function tilt() {
  const p = $('#pass');
  const move = (x, y) => { p.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 8}deg)`; p.style.setProperty('--sh', (x * 80) + '%'); };
  $('#s-intro').addEventListener('pointermove', e => { const r = p.getBoundingClientRect(); move((e.clientX - r.left) / r.width - .5, (e.clientY - r.top) / r.height - .5); });
  addEventListener('deviceorientation', e => {
    if (e.gamma == null) return;
    const x = Math.max(-1, Math.min(1, e.gamma / 30)) / 2, y = Math.max(-1, Math.min(1, (e.beta - 45) / 30)) / 2;
    if (S.stage === 'intro') move(x, y);
    PAR.tx = x; PAR.ty = y;
  });
})();
$('#goCheckin').onclick = () => { SFX.swoosh(); go('checkin'); };

/* ================= 1. CHECK-IN ================= */
const DODGE_SAY = ['Ơ kìa…', 'Bấm hụt rồi!', 'Không bắt được đâu', 'Đi đi mà', 'Thôi mà…'];
function makeDodger(btn, area, sayEl, fallbackText, onGiveUp) {
  let n = 0, tired = 0;
  const yes = area.querySelector('.btn');
  btn.dataset.label = btn.textContent;
  const reset = () => { n = 0; tired = 0; btn.removeAttribute('style'); btn.textContent = btn.dataset.label; sayEl.textContent = ''; };
  const move = e => {
    if (tired) return;
    e.preventDefault(); e.stopPropagation(); n++;
    if (n > DODGE_SAY.length) {
      tired = Date.now(); Object.assign(btn.style, { left: '0', right: 'auto', top: '70px', width: '100%', fontSize: '13px' });
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
const noDodger = makeDodger($('#btnNo'), $('#choices'), $('#dodgeSay'), 'Bận thật hả? Gửi lời chúc cho Cường nhé', () => {
  S.rsvp = { go: false }; store.set('rsvp', S.rsvp);
  apiPost({ a: 'rsvp', go: false, n: 0, dodges: noDodger.n() });
  go('review');
});
ENTER.checkin = () => {
  noDodger.reset();
  setTimeout(() => say('NHÂN VIÊN CHECK-IN · CƯỜNG', 'Xin chào {ban}! Mời {ban} xác nhận chuyến bay TXCC2026 ạ.'), 900);
  setGuide('Bấm "Có, đi chứ!" để xác nhận đi lễ. Nút "Không đi" hơi khó bấm đó.');
};
$('#btnYes').onclick = () => {
  S.rsvp = { go: true }; store.set('rsvp', S.rsvp);
  apiPost({ a: 'rsvp', go: true, n: 1, dodges: noDodger.n() });
  SFX.win(); confetti(); toast('Check-in thành công');
  say('NHÂN VIÊN CHECK-IN · CƯỜNG', 'Tuyệt vời! Mời {ban} qua cửa hải quan.', 1500);
  setTimeout(() => go(S.skip ? 'wall' : 'quiz'), 1400);
};

/* ================= 2. HẢI QUAN (10 giây / câu) ================= */
let qi = 0, correct = 0, qTimer = 0, qLock = false;
ENTER.quiz = () => {
  qi = 0; correct = 0; $('#ppOv').classList.remove('on'); $('#qSheet').style.display = '';
  setGuide('5 câu hỏi, mỗi câu chỉ có 10 giây. Đúng từ 3 câu trở lên là lên hạng Thương gia.');
  say('HẢI QUAN · CƯỜNG', 'Trả lời nhanh nhé, đồng hồ chạy rồi đó!', 3000);
  setTimeout(showQ, 600);
};
LEAVE.quiz = () => clearInterval(qTimer);
function showQ() {
  const q = CFG.quiz[qi]; qLock = false;
  $$('#qdots i').forEach((e, i) => e.classList.toggle('on', i <= qi));
  $('#qNo').textContent = `Hải quan · Câu ${qi + 1}/${CFG.quiz.length}`;
  $('#qText').textContent = T(q.q); $('#qFeed').textContent = '';
  const body = $('#qBody'); body.innerHTML = '';
  if (q.yn) {
    body.innerHTML = `<div class="yn" id="yn"><button class="btn">${icon('heart')}Có</button><button class="dodger">Không</button><div class="dodge-say"></div></div>`;
    body.querySelector('.btn').onclick = () => answer(true);
    makeDodger(body.querySelector('.dodger'), $('#yn'), body.querySelector('.dodge-say'), 'Thôi được rồi, chọn Không', () => answer(false));
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
  clearInterval(qTimer);
  const fg = $('#timerFg'), n = $('#timerN'), tm = $('#timer'), t0 = performance.now();
  let lastSec = CFG.qTime;
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
function finishQuiz() {
  S.cls = correct >= 3 ? 'biz' : 'eco'; store.set('cls', S.cls); updateClass();
  apiPost({ a: 'quiz', score: correct, cls: S.cls });
  $('#qSheet').style.display = 'none'; hush();
  $('#ppName').textContent = G.name;
  $('#ppScore').textContent = `ĐÚNG ${correct}/${CFG.quiz.length} CÂU`;
  const st = $('#stamp'); st.classList.remove('hit');
  $('#ppBook').style.setProperty('--stampc', S.cls === 'biz' ? '#A0670C' : '#1E5BC4');
  $('#stampText').textContent = S.cls === 'biz' ? '★ BUSINESS CLASS · TXCC2026 ★' : '★ ECONOMY CLASS · TXCC2026 ★';
  $('#ppRes').classList.remove('on'); $('#goFly').hidden = true;
  $('#ppOv').classList.add('on');
  setGuide(S.cls === 'biz' ? 'Hạng Thương gia! Chuyến bay của {ban} có trò nhặt tiền thưởng.' : 'Hạng Phổ thông! Chuyến bay sẽ có chướng ngại vật, cẩn thận nhé.');
  setTimeout(() => {
    st.classList.add('hit');
    setTimeout(() => { SFX.stamp(); $('#ppBook').classList.add('shake'); setTimeout(() => $('#ppBook').classList.remove('shake'), 400); }, 260);
    $('#ppRes').innerHTML = S.cls === 'biz' ? '<h2>Hạng Thương gia</h2><p class="muted">Hiểu Cường quá trời luôn!</p>' : '<h2>Hạng Phổ thông</h2><p class="muted">Vẫn được bay, nhưng cần tìm hiểu Cường thêm nha.</p>';
    setTimeout(() => { $('#ppRes').classList.add('on'); $('#goFly').hidden = false; if (S.cls === 'biz') confetti(); }, 500);
  }, 900);
}
$('#goFly').onclick = () => go(W.glOK ? 'flight' : 'cine');

/* ================= 3. GAME MÁY BAY ================= */
let flightApi = null;
const hearts = n => `<span class="hearts">${[0, 1, 2].map(i => `<i class="${i < n ? '' : 'off'}"></i>`).join('')}</span>`;
ENTER.flight = async () => {
  const biz = S.cls === 'biz';
  $('#s-flight').classList.remove('playing');
  $('#fIntro').classList.add('on'); $('#fEnd').classList.remove('on');
  $('#fKick').textContent = biz ? 'Hạng thương gia · 20 giây' : 'Hạng phổ thông · 3 mạng';
  $('#fTitle').textContent = biz ? 'Bay nhặt tiền thưởng' : 'Vượt chướng ngại vật';
  $('#fRules').innerHTML = biz
    ? `<div>${icon('touch')}<div><b>Kéo nút tròn</b> ở dưới (hoặc kéo ngón tay trên màn hình) để lái máy bay.</div></div><div>${icon('coin')}<div>Nhặt <b>đồng tiền vàng</b> (đồng to được 5 xu). Càng nhiều xu càng lên cao trên <b>bảng xếp hạng</b>.</div></div>`
    : `<div>${icon('touch')}<div><b>Kéo nút tròn</b> ở dưới (hoặc kéo ngón tay trên màn hình) để lái máy bay.</div></div><div>${icon('heart')}<div>Né <b>mây giông, khinh khí cầu, đàn chim</b>. Bạn có <b>3 mạng</b>. Bay càng lâu, còn càng nhiều mạng thì điểm càng cao.</div></div>`;
  $('#fScore').innerHTML = biz ? '<span class="coin"></span><b>0</b>' : hearts(3);
  $('#fTime').textContent = 20;
  setGuide(biz ? 'Kéo nút tròn để lái, nhặt càng nhiều tiền càng được cộng điểm.' : 'Kéo nút tròn để né chướng ngại vật. Chỉ có 3 mạng thôi nhé.', 'CƠ TRƯỞNG · CƯỜNG');
  musicPlay('bgm', .3);
  flightApi = await W.show('flight', {
    mode: biz ? 'coins' : 'obstacles', duration: 20, sfx: { coin: SFX.coin, hit: SFX.hit },
    onHud: h => {
      $('#fTime').textContent = Math.ceil(h.time);
      $('#fScore').innerHTML = h.mode === 'coins' ? `<span class="coin"></span><b>${h.score}</b>` : hearts(h.lives);
    },
    onEnd: r => {
      $('#s-flight').classList.remove('playing'); engineStart(.12); musicPlay('bgm', .4);
      const pts = r.mode === 'coins' ? r.score * 10000 : Math.round(r.time * 8000) + r.lives * 25000;
      if (pts > S.best) { S.best = pts; store.set('best', pts); }
      apiPost({ a: 'score', views: pts });
      $('#fFinal').textContent = r.mode === 'coins' ? `${r.score} xu` : (r.survived ? `Còn ${r.lives} mạng` : 'Hạ cánh khẩn cấp');
      $('#fVerdict').textContent = `${fmt(pts)} điểm · ` + (r.mode === 'coins' ? (r.score >= 30 ? 'Cơ trưởng giàu nhất chuyến bay!' : 'Chơi lại để leo bảng xếp hạng nhé.') : r.survived ? 'Hạ cánh an toàn, tay lái lụa!' : 'Máy bay hơi xóc… nhưng vẫn tới nơi an toàn.');
      $('#fEnd').classList.add('on'); SFX.win();
    },
  });
  engineStart(.14);
};
LEAVE.flight = () => { joyReset(); };
$('#fStart').onclick = () => { $('#fIntro').classList.remove('on'); $('#s-flight').classList.add('playing'); engineStart(.4); musicPlay('game', .45); flightApi && flightApi.start(); };
$('#fNext').onclick = () => {
  // mở khoá video kỷ niệm ngay lúc người dùng bấm, để lát nữa phát được có tiếng
  const v = $('#memVideo'); v.muted = AU.muted; v.play().then(() => { v.pause(); v.currentTime = 0; }).catch(() => {});
  go('cine');
};
// cần gạt ảo
const joy = $('#joy'), knob = $('#knob');
let joyId = null;
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

/* ================= 4. CINEMATIC: bay qua mây → hạ cánh ================= */
let cineDone = false, cineT = [];
ENTER.cine = async () => {
  cineDone = false; $('#cineCap').classList.remove('on');
  engineStart(.42); musicPlay('bgm', .3);
  await W.show('cinematic', { duration: 8, onEnd: () => {} });
  cineT = [
    setTimeout(() => SFX.swoosh(), 1200),
    setTimeout(() => engineStart(.22), 5200),
    setTimeout(() => { $('#cineCap').classList.add('on'); SFX.ding(); engineStop(2.5); }, 7400),
    setTimeout(endCine, 10400),
  ];
};
function endCine() {
  if (cineDone) return; cineDone = true; cineT.forEach(clearTimeout); engineStop(1);
  $('#whiteout').classList.add('on'); bgmLevel(0, 800);
  setTimeout(async () => { await go('memory'); setTimeout(() => $('#whiteout').classList.remove('on'), 200); }, 900);
}
$('#cineSkip').onclick = endCine;

/* ================= 5. VIDEO KỶ NIỆM + THƯ CẢM ƠN (chữ hiện đè lên ảnh) ================= */
const mv = $('#memVideo');
let letterTimer = 0, letterDone = false;
function typeLetter() {
  const el = $('#letterTxt'), box = $('#memLetter'), full = T(CFG.letter);
  const pauses = (full.match(/\n/g) || []).length * 380 + (full.match(/[.,–]/g) || []).length * 200;
  const avail = Math.max(14, (mv.duration || 40) - 6) * 1000;            // chữ chạy xong trước khi video hết ~6 giây
  const per = Math.max(28, Math.min(70, (avail - pauses) / full.length));
  let i = 0; letterDone = false; clearTimeout(letterTimer);
  $('#letterSig').classList.remove('on'); $('#memDone').classList.remove('on');
  el.innerHTML = '<span class="cur"></span>';
  const tick = () => {
    if (S.stage !== 'memory') return;
    if (mv.paused && !mv.ended && mv.currentTime > 0) { letterTimer = setTimeout(tick, 120); return; } // video tạm dừng thì chữ cũng chờ
    i++; const ch = full[i - 1];
    el.innerHTML = esc(full.slice(0, i)) + '<span class="cur"></span>';
    box.scrollTop = box.scrollHeight;
    if (i >= full.length) { letterDone = true; $('#letterSig').classList.add('on'); maybeDone(); return; }
    letterTimer = setTimeout(tick, ch === '\n' ? 380 : (ch === '.' || ch === ',' || ch === '–') ? per + 200 : per);
  };
  letterTimer = setTimeout(tick, 900);
}
function maybeDone() { if (letterDone && (mv.ended || mv.currentTime > mv.duration - 4)) $('#memDone').classList.add('on'); }
ENTER.memory = () => {
  mv.currentTime = 0; mv.muted = AU.muted; musicPlay(null);
  const start = () => { $('#tapPlay').classList.remove('on'); typeLetter(); };
  mv.play().then(start).catch(() => $('#tapPlay').classList.add('on'));
};
LEAVE.memory = () => { mv.pause(); clearTimeout(letterTimer); };
$('#tapPlay').onclick = () => { mv.play().then(() => { $('#tapPlay').classList.remove('on'); typeLetter(); }).catch(() => {}); };
mv.addEventListener('timeupdate', maybeDone);
mv.addEventListener('ended', () => { letterDone ? maybeDone() : null; });
$('#memSkip').onclick = () => go(store.get('reviewed', false) ? 'wall' : 'review');
$('#memDone').onclick = () => go(store.get('reviewed', false) ? 'wall' : 'review');

/* ================= 10. REVIEW ================= */
let stars = 5;
(function () {
  const box = $('#stars');
  for (let i = 1; i <= 5; i++) { const b = document.createElement('button'); b.setAttribute('aria-label', i + ' sao'); b.innerHTML = '<svg viewBox="0 0 24 24"><use href="#i-star"/></svg>'; b.onclick = () => { stars = i; paint(); SFX.blip(i); }; box.appendChild(b); }
  const paint = () => [...box.children].forEach((b, i) => b.classList.toggle('on', i < stars)); paint();
})();
ENTER.review = () => {
  const no = S.rsvp && !S.rsvp.go;
  musicPlay('bgm', .45);
  $('#rvTitle').textContent = no ? 'Tiếc ghê! Gửi Cường một lời chúc nhé' : 'Để lại một lời chúc cho Cường';
  setGuide(no ? 'Không đi được cũng không sao, gửi Cường vài lời chúc nhé.' : 'Viết vài lời chúc, sẽ được chiếu lên màn hình trong ngày lễ.');
};
$('#rvSend').onclick = async () => {
  const name = $('#rvName').value.trim(), text = $('#rvText').value.trim();
  if (!name) return toast('Ghi tên giúp Cường nhé');
  if (text.length < 2) return toast('Viết vài chữ chúc mừng nhé');
  $('#rvSend').disabled = true; $('#rvSend').textContent = 'Đang gửi…';
  store.set('myReview', { name, stars, text }); store.set('reviewed', true);
  await apiPost({ a: 'review', name, stars, text });
  $('#rvSend').disabled = false; $('#rvSend').textContent = 'Gửi lời chúc';
  confetti(); go('wall');
};

/* ================= 11. WALL ================= */
$('#lnkMap').href = CFG.map;
$('#lnkCal').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('Lễ tốt nghiệp của Cao Cường') +
  '&dates=20261208T080000Z/20261208T100000Z&location=' + encodeURIComponent('Nhà hát Hòa Bình, 240 Đường 3 Tháng 2, TP.HCM') +
  '&details=' + encodeURIComponent('Chuyến bay TXCC2026 – hẹn gặp lúc 15:00!');
ENTER.wall = async () => {
  const no = S.rsvp && !S.rsvp.go;
  musicPlay('bgm', .45);
  $('#wallTitle').textContent = no ? 'Cảm ơn lời chúc của bạn' : 'Hẹn gặp lúc 15:00 – 08/12';
  setGuide(no ? 'Cảm ơn {ban} nhiều nhé! Cường sẽ đọc lời chúc trong ngày lễ.' : 'Hẹn gặp {ban} lúc 15:00 ngày 08/12 ở Nhà hát Hòa Bình nhé!');
  let data = null; try { data = await apiGet({ a: 'wall' }); } catch {}
  const mine = store.get('myReview', null);
  let reviews = (data && data.reviews) || [];
  if (mine && !reviews.some(r => r.name === mine.name && r.text === mine.text)) reviews = [mine, ...reviews];
  if (!reviews.length) reviews = [{ name: 'Cường', stars: 5, text: 'Lời chúc đầu tiên sẽ là của bạn đó!' }];
  $('#wallRv').innerHTML = reviews.map(r => `<div class="rv"><div class="h"><span>${esc(r.name)}</span><span class="s">${'★'.repeat(Math.max(1, Math.min(5, +r.stars || 5)))}</span></div><p>${esc(r.text)}</p></div>`).join('');
  let lb = (data && data.board) || [];
  if (!data && S.best) lb = [{ name: G.name, views: S.best }];
  $('#wallLb').innerHTML = lb.length ? lb.map((r, i) => `<div class="lbr"><div class="r">${i + 1}</div><div class="n">${esc(r.name)}</div><div class="v">${fmt(+r.views)}</div></div>`).join('')
    : '<p style="text-align:center;color:var(--muted)">Chưa có ai chơi. Vào chiếm hạng nhất đi!</p>';
};
$$('.tabs button').forEach(b => b.onclick = () => {
  $$('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  $('#wallRv').hidden = b.dataset.t !== 'rv'; $('#wallLb').hidden = b.dataset.t !== 'lb';
});
$('#wAgain').onclick = e => { e.preventDefault(); S.skip = false; go('intro'); };
$('#wGame').onclick = e => { e.preventDefault(); go('flight'); };

/* ================= KHỞI ĐỘNG ================= */
(async function init() {
  const hide = () => $('#loading').classList.add('off');
  setTimeout(hide, 9000);
  try { W.initGL($('#gl')); } catch (e) { window.__errs.push('gl: ' + e); }
  const k = new URLSearchParams(location.search).get('k');
  if (k) {
    G = { ...DEMO_GUEST, code: k };
    try { const r = await Promise.race([apiGet({ a: 'guest', k }), wait(4000)]); if (r && r.ok) G = { ...DEMO_GUEST, ...r.guest, code: k }; } catch {}
  }
  try { await Promise.race([document.fonts.ready, wait(1500)]); } catch {}
  renderGuest();
  try { await Promise.race([go('intro'), wait(5000)]); } catch (e) { window.__errs.push('intro: ' + e); }
  if (!$('#s-intro').classList.contains('on')) { $$('.stage').forEach(s => s.classList.toggle('on', s.id === 's-intro')); S.stage = 'intro'; }
  hide();
  window.__app = { go, S, answer, W };
})();
