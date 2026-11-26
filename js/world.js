// Các cảnh 3D (Three.js): sân bay, game máy bay, cinematic, sảnh TR007, cửa phòng.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { chibiTextures } from './chibi.js';

let renderer = null, canvas = null, cur = null, last = 0;
export let glOK = false;

export function initGL(c) {
  canvas = c;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: c, antialias: devicePixelRatio < 2, powerPreference: 'high-performance' });
  } catch (e) { window.__errs && window.__errs.push('webgl: ' + e); return false; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  addEventListener('resize', resize);
  resize();
  requestAnimationFrame(loop);
  glOK = true;
  return true;
}
function resize() {
  if (!renderer) return;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  if (cur) { cur.camera.aspect = w / h; cur.camera.updateProjectionMatrix(); }
}
function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
  if (!cur) return;
  cur.update(dt, t / 1000);
  renderer.render(cur.scene, cur.camera);
}
export async function show(name, opts = {}) {
  if (!glOK) return null;
  let next;
  try { next = await BUILD[name](opts); }
  catch (e) { console.error('scene', name, e); window.__errs && window.__errs.push('scene ' + name + ': ' + e); return null; }
  if (cur && cur.dispose) cur.dispose();
  cur = next; resize();
  return cur;
}
export function current() { return cur; }
// tạm dừng vẽ 3D khi màn hình đang dùng ảnh thật / video (đỡ tốn pin)
export function clear() { if (cur && cur.dispose) cur.dispose(); cur = null; }

/* ---------------- tiện ích ---------------- */
const FONT = "'Be Vietnam Pro', Arial, sans-serif";
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
const rnd = (a, b) => a + Math.random() * (b - a);
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, ...o });
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

function skyTex(stops) {
  return canvasTex(16, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([p, c]) => gr.addColorStop(p, c));
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
}
function marbleTex(rep) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#F4F2EE'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) {
      g.strokeStyle = `rgba(120,120,130,${rnd(.12, .35)})`; g.lineWidth = rnd(.6, 2.4);
      g.beginPath(); let x = rnd(0, w), y = rnd(-50, 0); g.moveTo(x, y);
      for (let k = 0; k < 6; k++) { const nx = x + rnd(-80, 120), ny = y + rnd(60, 140); g.quadraticCurveTo(x + rnd(-60, 60), (y + ny) / 2, nx, ny); x = nx; y = ny; }
      g.stroke();
    }
  }, rep);
}
function woodTex(rep, base = '#7A4A26', light = '#9C6535') {
  return canvasTex(256, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, base); gr.addColorStop(.5, light); gr.addColorStop(1, base);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(40,20,8,${rnd(.05, .18)})`; g.lineWidth = rnd(.5, 2); const x = rnd(0, w); g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + rnd(-8, 8), h / 3, x + rnd(-8, 8), h * 2 / 3, x + rnd(-6, 6), h); g.stroke(); }
  }, rep);
}
function textTex(lines, { w = 1024, h = 256, bg = null, color = '#fff', size = 120, weight = 800, glow = null, gold = false, align = 'center' } = {}) {
  return canvasTex(w, h, (g) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    const arr = Array.isArray(lines) ? lines : [lines];
    arr.forEach((ln, i) => {
      const s = ln.size || size;
      g.font = `${ln.weight || weight} ${s}px ${FONT}`; g.textAlign = align; g.textBaseline = 'middle';
      if (gold) { const gr = g.createLinearGradient(0, h / 2 - s / 2, 0, h / 2 + s / 2); gr.addColorStop(0, '#FFF1C1'); gr.addColorStop(.5, '#E2B867'); gr.addColorStop(1, '#A97A2C'); g.fillStyle = gr; }
      else g.fillStyle = ln.color || color;
      if (glow) { g.shadowColor = glow; g.shadowBlur = 30; }
      const y = arr.length === 1 ? h / 2 : h * (i + .5) / arr.length;
      g.fillText(ln.text ?? ln, align === 'center' ? w / 2 : 40, y);
    });
  });
}
function planeMesh(w, h, mat) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); }

function makeCloud(scale = 1, color = '#ffffff', opacity = 1) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true, transparent: opacity < 1, opacity });
  const n = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const s = rnd(1, 2.2) * scale;
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), m);
    b.position.set(rnd(-2.4, 2.4) * scale, rnd(-.4, .6) * scale, rnd(-1, 1) * scale); b.scale.y = .7;
    g.add(b);
  }
  return g;
}

// Chibi dạng tấm phẳng trong cảnh 3D: tự chớp mắt, nhép miệng khi nói
async function chibiActor(kind, height) {
  const tx = await chibiTextures(THREE, kind);
  const mat = new THREE.MeshBasicMaterial({ map: tx.normal, transparent: true, alphaTest: .05 });
  const m = planeMesh(height * 400 / 508, height, mat);
  let talking = false, nextBlink = 2, blinkT = 0, mouthT = 0, open = false;
  m.userData.talk = on => { talking = on; };
  m.userData.update = (dt, t) => {
    if (talking) { mouthT += dt; if (mouthT > .13) { mouthT = 0; open = !open; } } else open = false;
    if (t > nextBlink) { blinkT = .12; nextBlink = t + rnd(2.5, 4.5); }
    blinkT -= dt;
    mat.map = blinkT > 0 ? tx.blink : open ? tx.talk : tx.normal;
    m.position.y = m.userData.baseY + Math.sin(t * 2) * .015;
  };
  return m;
}

function baseLights(scene, warm = false) {
  scene.add(new THREE.HemisphereLight(warm ? '#FFF1DC' : '#EAF2FF', '#3A2F28', warm ? .9 : 1.0));
  const d = new THREE.DirectionalLight('#ffffff', warm ? .8 : 1.1); d.position.set(3, 6, 4); scene.add(d);
}

/* ---------------- SÂN BAY: quầy check-in / hải quan ---------------- */
function departureBoard(variant) {
  const rows = variant === 'customs'
    ? [['CỬA', 'KIỂM TRA', 'TRẠNG THÁI'], ['A1', 'HỘ CHIẾU', 'ĐANG MỞ'], ['A2', 'VISA TỐT NGHIỆP', 'ĐANG MỞ'], ['A3', 'HÀNH LÝ KỶ NIỆM', 'MIỄN THUẾ'], ['A4', 'TXCC2026', 'SẴN SÀNG']]
    : [['CHUYẾN', 'ĐIỂM ĐẾN', 'GIỜ', 'TRẠNG THÁI'], ['TXCC2026', 'TỐT NGHIỆP', '15:00', 'CHECK-IN'], ['KLTN007', 'KHOÁ LUẬN', '—', 'ĐÃ HẠ CÁNH'], ['TT2025', 'THỰC TẬP', '—', 'ĐÃ HẠ CÁNH'], ['TACN2023', 'NĂM NHẤT', '—', 'ĐÃ CẤT CÁNH']];
  return canvasTex(1024, 520, (g, w, h) => {
    g.fillStyle = '#0A0F1C'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#FF8000'; g.fillRect(0, 0, w, 70);
    g.font = `800 40px ${FONT}`; g.fillStyle = '#fff'; g.textBaseline = 'middle';
    g.fillText(variant === 'customs' ? 'HẢI QUAN  ·  IMMIGRATION' : 'KHỞI HÀNH  ·  DEPARTURES', 30, 36);
    const cols = rows[0].length === 3 ? [30, 200, 690] : [30, 300, 610, 760];
    rows.forEach((r, i) => {
      const y = 120 + i * 88;
      if (i > 0) { g.fillStyle = i === 1 ? 'rgba(255,128,0,.15)' : 'rgba(255,255,255,.04)'; g.fillRect(14, y - 38, w - 28, 76); }
      r.forEach((c, j) => {
        g.font = `${i === 0 ? 600 : 800} ${i === 0 ? 26 : 38}px ${FONT}`;
        g.fillStyle = i === 0 ? '#8FA3C7' : (j === r.length - 1 ? (i === 1 ? '#3DFF8B' : '#FFB000') : '#FFD27A');
        g.fillText(c, cols[j], y);
      });
    });
  });
}

const BUILD = {};
BUILD.airport = async ({ variant = 'checkin', cam = 'counter' }) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#C9D6EA');
  scene.fog = new THREE.Fog('#C9D6EA', 14, 34);
  const camera = new THREE.PerspectiveCamera(60, 1, .1, 100);
  baseLights(scene);

  // sàn bóng + trần đèn
  const floor = planeMesh(40, 40, std('#D9DEE6', { roughness: .18, metalness: .2, map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#E3E7EE'; g.fillRect(0, 0, w, h); g.strokeStyle = '#C3C9D4'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); }, [20, 20]) }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const ceil = planeMesh(40, 40, std('#F5F7FA')); ceil.rotation.x = Math.PI / 2; ceil.position.y = 6.5; scene.add(ceil);
  for (let i = -3; i <= 3; i++) { const l = box(18, .05, .25, new THREE.MeshBasicMaterial({ color: '#FFFFFF' })); l.position.set(0, 6.45, i * 2.4 - 2); scene.add(l); }

  // tường sau + cửa kính nhìn ra đường băng
  const wall = planeMesh(30, 7, std('#13284F')); wall.position.set(0, 3.25, -6); scene.add(wall);
  const sky = skyTex([[0, '#4E9BE8'], [.65, '#BFE0FF'], [1, '#F2D9B8']]);
  [-1, 1].forEach(s => {
    const win = planeMesh(9, 5.6, new THREE.MeshBasicMaterial({ map: sky }));
    win.position.set(s * 8.6, 3.2, -3); win.rotation.y = -s * Math.PI / 2.6; scene.add(win);
    for (let k = 0; k < 5; k++) { const f = box(.12, 5.6, .12, std('#2B3550')); f.position.copy(win.position); f.rotation.y = win.rotation.y; f.translateX(-4.5 + k * 2.25); scene.add(f); }
  });
  // máy bay ngoài cửa kính
  const jet = makeJet(.9); jet.position.set(-10.5, 2.4, -6.5); jet.rotation.y = .9; scene.add(jet);

  const board = planeMesh(5.2, 2.64, new THREE.MeshBasicMaterial({ map: departureBoard(variant) }));
  board.position.set(0, 4.75, -5.95); scene.add(board);
  const sign = planeMesh(4.2, 0.7, new THREE.MeshBasicMaterial({ map: textTex(variant === 'customs' ? 'HẢI QUAN · IMMIGRATION' : 'TXCC2026 AIRLINES', { size: 84, color: '#FFFFFF', glow: '#E9CF96' }), transparent: true }));
  sign.position.set(0, 3.05, -5.9); scene.add(sign);

  // quầy
  const front = canvasTex(1024, 200, (g, w, h) => {
    g.fillStyle = '#0E2A5C'; g.fillRect(0, 0, w, h); g.fillStyle = '#FF8000'; g.fillRect(0, 140, w, 22);
    g.font = `800 64px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(variant === 'customs' ? 'IMMIGRATION · A2' : 'CHECK-IN · TXCC2026', w / 2, 70);
  });
  const counter = new THREE.Group();
  const body = box(6, 1.15, 1, [std('#0E2A5C'), std('#0E2A5C'), std('#0E2A5C'), std('#0E2A5C'), std('#fff', { map: front }), std('#0E2A5C')]);
  body.position.y = .575; counter.add(body);
  const top = box(6.3, .08, 1.3, std('#fff', { map: marbleTex(), roughness: .15 })); top.position.y = 1.19; counter.add(top);
  const mon = box(.6, .38, .05, std('#1d2333', { roughness: .3 })); mon.position.set(1.9, 1.45, -.2); counter.add(mon);
  const scanner = box(.5, .12, .35, std('#222')); scanner.position.set(-1.6, 1.29, .1); counter.add(scanner);
  const led = box(.3, .02, .06, new THREE.MeshBasicMaterial({ color: '#3DFF8B' })); led.position.set(-1.6, 1.36, .1); counter.add(led);
  counter.position.z = -.6; scene.add(counter);

  // cột xếp hàng + dây cam
  const postM = std('#C0C6D0', { metalness: .8, roughness: .25 });
  [[-3.3, 1.4], [-3.3, 3.4], [3.3, 1.4], [3.3, 3.4]].forEach(([x, z]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1, 12), postM); p.position.set(x, .5, z); scene.add(p);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .04, 20), postM); b.position.set(x, .02, z); scene.add(b);
  });
  [-3.3, 3.3].forEach(x => { const belt = box(.03, .08, 2, std('#FF8000')); belt.position.set(x, .9, 2.4); scene.add(belt); });

  const agent = await chibiActor(variant === 'customs' ? 'customs' : 'agent', 2.3);
  agent.userData.baseY = 1.95; agent.position.set(0, 1.95, -1.55); scene.add(agent);

  const camPos = cam === 'wide' ? new THREE.Vector3(0, 2.3, 8) : new THREE.Vector3(0, 1.8, 4.6);
  const look = new THREE.Vector3(0, cam === 'wide' ? 2.4 : .9, -2);
  camera.position.copy(camPos).add(new THREE.Vector3(0, .3, 2));
  let t0 = 0;
  return {
    scene, camera, agent,
    update(dt, t) {
      t0 += dt;
      const k = Math.min(1, t0 / 1.6);
      camera.position.lerpVectors(camPos.clone().add(new THREE.Vector3(0, .3, 2)), camPos, ease(k));
      camera.position.x += Math.sin(t * .5) * .05; camera.position.y += Math.sin(t * .8) * .02;
      camera.lookAt(look);
      agent.userData.update(dt, t);
      jet.position.x = -10.5 + Math.sin(t * .1) * .4;
    },
  };
};

/* ---------------- máy bay ---------------- */
function makeJet(s = 1, livery = '#FF8000') {
  const g = new THREE.Group();
  const white = std('#F6F7FA', { roughness: .35, metalness: .1 }), navy = std('#0E2A5C', { roughness: .4 }), orange = std(livery, { roughness: .4 });
  const fus = new THREE.Mesh(new THREE.CapsuleGeometry(.42, 3.2, 8, 16), white); fus.rotation.x = Math.PI / 2; g.add(fus);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(.425, .425, 2.6, 16, 1, true), orange); stripe.rotation.x = Math.PI / 2; stripe.scale.set(1, 1, .18); stripe.position.y = -.08; g.add(stripe);
  const cock = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.5), new THREE.MeshStandardMaterial({ color: '#1B2B4A', roughness: .1, metalness: .6 }));
  cock.position.set(0, .2, -1.75); cock.rotation.x = -.9; g.add(cock);
  const wingShape = new THREE.Shape(); wingShape.moveTo(0, 0); wingShape.lineTo(2.8, .9); wingShape.lineTo(2.8, 1.25); wingShape.lineTo(0, 1.2); wingShape.lineTo(0, 0);
  const wg = new THREE.ExtrudeGeometry(wingShape, { depth: .07, bevelEnabled: false });
  [-1, 1].forEach(sd => {
    const w = new THREE.Mesh(wg, white); w.rotation.x = -Math.PI / 2; w.scale.x = sd; w.position.set(0, -.12, .6); g.add(w);
    const tip = box(.06, .3, .3, orange); tip.position.set(sd * 2.8, .02, -.3); g.add(tip);
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(.18, .15, .7, 12), navy); eng.rotation.x = Math.PI / 2; eng.position.set(sd * 1.1, -.35, -.1); g.add(eng);
    const st = box(1, .04, .35, white); st.position.set(sd * .5, .02, 1.85); g.add(st);
  });
  const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.lineTo(.9, 0); fin.lineTo(.55, 1.1); fin.lineTo(.2, 1.1); fin.lineTo(0, 0);
  const f = new THREE.Mesh(new THREE.ExtrudeGeometry(fin, { depth: .06, bevelEnabled: false }), orange);
  f.rotation.y = Math.PI / 2; f.position.set(-.03, .25, 2.05); g.add(f);
  g.scale.setScalar(s);
  return g;
}

/* ---------------- GAME MÁY BAY ---------------- */
// mode 'coins' (hạng thương gia: nhặt tiền) | 'obstacles' (phổ thông: né chướng ngại, 3 mạng)
BUILD.flight = async ({ mode = 'coins', duration = 20, onHud = () => {}, onEnd = () => {}, sfx = {} }) => {
  const scene = new THREE.Scene();
  scene.background = skyTex([[0, '#2F7FE0'], [.55, '#8CC8FF'], [1, '#FFE3BD']]);
  scene.fog = new THREE.Fog('#CFE6FF', 40, 120);
  const camera = new THREE.PerspectiveCamera(62, 1, .1, 200);
  camera.position.set(0, 2.3, 7.5);
  scene.add(new THREE.HemisphereLight('#ffffff', '#88aacc', 1.1));
  const sun = new THREE.DirectionalLight('#FFF3D6', 1.3); sun.position.set(-4, 8, 3); scene.add(sun);

  const jet = makeJet(.55); scene.add(jet);
  const clouds = [];
  for (let i = 0; i < 26; i++) {
    const c = makeCloud(rnd(.8, 2)); const side = Math.random() < .5 ? -1 : 1;
    c.position.set(side * rnd(7, 22), rnd(-9, 9), rnd(-130, 10)); scene.add(c); clouds.push(c);
  }
  const sea = planeMesh(400, 400, std('#5FA8E8', { roughness: .4 })); sea.rotation.x = -Math.PI / 2; sea.position.y = -14; scene.add(sea);

  const coinGeo = new THREE.CylinderGeometry(.55, .55, .14, 28);
  const coinMat = new THREE.MeshStandardMaterial({ color: '#FFC83D', metalness: .9, roughness: .25, emissive: '#7A4A00', emissiveIntensity: .5 });
  const coinFace = canvasTex(128, 128, (g) => { g.fillStyle = '#FFC83D'; g.fillRect(0, 0, 128, 128); g.font = `900 80px ${FONT}`; g.fillStyle = '#B87900'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('₫', 64, 68); });
  const coinFaceMat = new THREE.MeshStandardMaterial({ map: coinFace, metalness: .7, roughness: .3, emissive: '#5A3A00', emissiveIntensity: .4 });
  const stormMat = new THREE.MeshStandardMaterial({ color: '#4A5266', roughness: 1, flatShading: true });
  function makeObstacle() {
    const r = Math.random();
    if (r < .5) { // mây giông + tia sét
      const g = new THREE.Group();
      for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(.6, 1), 0), stormMat); b.position.set(rnd(-.7, .7), rnd(-.3, .3), rnd(-.4, .4)); g.add(b); }
      const bolt = box(.08, .9, .08, new THREE.MeshBasicMaterial({ color: '#FFF06A' })); bolt.position.y = -1; bolt.rotation.z = .3; g.add(bolt);
      g.userData.r = 1.25; return g;
    }
    if (r < .8) { // khinh khí cầu
      const g = new THREE.Group(); const col = ['#E53935', '#8E24AA', '#43A047', '#FB8C00'][Math.floor(rnd(0, 4))];
      const ball = new THREE.Mesh(new THREE.SphereGeometry(.85, 16, 12), std(col, { roughness: .5 })); ball.scale.y = 1.15; g.add(ball);
      const bk = box(.35, .3, .35, std('#7A4A26')); bk.position.y = -1.35; g.add(bk);
      g.userData.r = 1.1; return g;
    }
    // đàn chim
    const g = new THREE.Group(); const m = std('#2B2B33');
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.ConeGeometry(.18, .7, 4), m); b.rotation.x = Math.PI / 2; b.position.set(i * .6 - .6, Math.abs(i - 1) * -.25, Math.abs(i - 1) * .3); const w = box(.9, .03, .2, m); w.position.copy(b.position); g.add(b, w); }
    g.userData.r = 1.0; return g;
  }

  const items = [];
  const target = new THREE.Vector2(0, .6), pos = new THREE.Vector2(0, .6);
  let BX = 4.2; const BYmin = -1.2, BYmax = 3;
  let t = 0, spawnT = 0, score = 0, lives = 3, inv = 0, done = false, shake = 0, started = false;
  const speed = 46;

  // điều khiển: kéo ngón tay / chuột, hoặc phím mũi tên
  const onPtr = e => {
    if (done || (e.pointerType !== 'mouse' && e.buttons === 0 && e.type === 'pointermove')) return;
    const r = canvas.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    target.set(nx * BX * 1.15, THREE.MathUtils.lerp(BYmax, BYmin, (ny + 1) / 2));
  };
  const keys = {}, stickV = new THREE.Vector2();
  const onKey = e => { keys[e.key] = e.type === 'keydown'; };
  const area = document.getElementById('flyArea') || canvas;
  area.addEventListener('pointerdown', onPtr); area.addEventListener('pointermove', onPtr);
  addEventListener('keydown', onKey); addEventListener('keyup', onKey);
  canvas.style.touchAction = 'none';

  const sparks = [];
  function burst(p, color) {
    for (let i = 0; i < 10; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 4), new THREE.MeshBasicMaterial({ color, transparent: true }));
      s.position.copy(p); s.userData.v = new THREE.Vector3(rnd(-4, 4), rnd(-2, 4), rnd(-2, 4)); s.userData.life = .6;
      scene.add(s); sparks.push(s);
    }
  }
  onHud({ time: duration, score, lives, mode });

  return {
    scene, camera,
    start() { started = true; },
    // cần gạt trên màn hình: x, y trong khoảng -1..1
    stick(x, y) { stickV.set(x, y); },
    update(dt, tt) {
      if (!done && started) t += dt;
      // vùng bay vừa với bề ngang màn hình (điện thoại dọc hẹp hơn máy tính)
      BX = Math.min(4.2, Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 7.5 * camera.aspect * .78 / .55);
      if (keys.ArrowLeft) target.x -= 9 * dt; if (keys.ArrowRight) target.x += 9 * dt;
      if (keys.ArrowUp) target.y += 7 * dt; if (keys.ArrowDown) target.y -= 7 * dt;
      target.x += stickV.x * 10 * dt; target.y -= stickV.y * 7.5 * dt;
      target.x = THREE.MathUtils.clamp(target.x, -BX, BX); target.y = THREE.MathUtils.clamp(target.y, BYmin, BYmax);
      const vx = (target.x - pos.x) * 6, vy = (target.y - pos.y) * 6;
      pos.x += vx * dt; pos.y += vy * dt;
      jet.position.set(pos.x, pos.y, 0);
      jet.rotation.z = THREE.MathUtils.clamp(-vx * .09, -.7, .7); jet.rotation.x = THREE.MathUtils.clamp(vy * .05, -.3, .3);
      jet.visible = inv <= 0 || Math.floor(tt * 14) % 2 === 0;
      inv -= dt;
      camera.position.x = pos.x * .45 + (shake > 0 ? rnd(-.15, .15) : 0); camera.position.y = 2.3 + pos.y * .35 + (shake > 0 ? rnd(-.1, .1) : 0);
      camera.lookAt(pos.x * .6, pos.y * .5 + .5, -8); shake -= dt;

      clouds.forEach(c => { c.position.z += speed * .6 * dt; if (c.position.z > 12) c.position.z -= 140; });

      if (!done && started) {
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = mode === 'coins' ? .3 : Math.max(.3, .55 - t * .012);
          let m;
          if (mode === 'coins') {
            m = new THREE.Group(); const c = new THREE.Mesh(coinGeo, [coinMat, coinFaceMat, coinFaceMat]); c.rotation.x = Math.PI / 2; m.add(c); m.userData.r = .95; m.userData.coin = true;
            if (Math.random() < .12) { m.scale.setScalar(1.6); m.userData.big = true; m.userData.r = 1.35; }
          } else m = makeObstacle();
          // ưu tiên rải quanh vị trí người chơi để game có nhịp
          // tiền rải khắp bầu trời (phải lái mới nhặt được); chướng ngại nhắm quanh người chơi
          if (mode === 'coins') m.position.set(rnd(-BX, BX), rnd(BYmin, BYmax), -95);
          else m.position.set(THREE.MathUtils.clamp(pos.x + rnd(-3, 3), -BX, BX), THREE.MathUtils.clamp(pos.y + rnd(-1.5, 1.5), BYmin, BYmax), -95);
          scene.add(m); items.push(m);
        }
      }
      for (let i = items.length - 1; i >= 0; i--) {
        const m = items[i]; m.position.z += speed * dt;
        if (m.userData.coin) m.rotation.y += dt * 4; else m.rotation.y += dt * .6;
        const dz = Math.abs(m.position.z), d = Math.hypot(m.position.x - pos.x, m.position.y - pos.y);
        if (!done && dz < 1.2 && d < m.userData.r) {
          if (m.userData.coin) { score += m.userData.big ? 5 : 1; burst(m.position, '#FFD54F'); sfx.coin && sfx.coin(); }
          else if (inv <= 0) { lives--; inv = 1.4; shake = .4; burst(m.position, '#FF5252'); sfx.hit && sfx.hit(); }
          scene.remove(m); items.splice(i, 1); continue;
        }
        if (m.position.z > 12) { scene.remove(m); items.splice(i, 1); }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]; s.userData.life -= dt; s.position.addScaledVector(s.userData.v, dt); s.material.opacity = s.userData.life / .6;
        if (s.userData.life <= 0) { scene.remove(s); sparks.splice(i, 1); }
      }
      if (!done && started) {
        onHud({ time: Math.max(0, duration - t), score, lives, mode });
        if (t >= duration || lives <= 0) {
          done = true;
          setTimeout(() => onEnd({ mode, score, lives: Math.max(0, lives), survived: lives > 0, time: Math.min(t, duration) }), 900);
        }
      }
    },
    dispose() {
      area.removeEventListener('pointerdown', onPtr); area.removeEventListener('pointermove', onPtr);
      removeEventListener('keydown', onKey); removeEventListener('keyup', onKey);
      canvas.style.touchAction = '';
    },
  };
};

/* ---------------- CINEMATIC: bay qua mây rồi hạ cánh xuống đường băng lúc hoàng hôn ---------------- */
function makeAirport() {
  const g = new THREE.Group();
  const ground = planeMesh(900, 900, std('#1C2A30', { roughness: 1 })); ground.rotation.x = -Math.PI / 2; g.add(ground);
  const RW = 16, RL = 420, z0 = -120;               // đường băng chạy từ z0 về phía trước
  const asphalt = canvasTex(256, 1024, (c, w, h) => {
    c.fillStyle = '#2B2E33'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * .04})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    c.fillStyle = '#E8E8E8'; for (let y = 0; y < h; y += 64) c.fillRect(w / 2 - 3, y, 6, 34);   // vạch tim đứt quãng
    c.fillRect(10, 0, 5, h); c.fillRect(w - 15, 0, 5, h);                                      // vạch biên
  }, [1, 6]);
  const rw = planeMesh(RW, RL, std('#fff', { map: asphalt, roughness: .9 })); rw.rotation.x = -Math.PI / 2; rw.position.set(0, .02, z0 - RL / 2); g.add(rw);
  // vạch ngưỡng đường băng
  for (let k = -6; k <= 6; k++) { if (!k) continue; const b = planeMesh(.8, 10, new THREE.MeshBasicMaterial({ color: '#E8E8E8' })); b.rotation.x = -Math.PI / 2; b.position.set(k * 1.1, .03, z0 - 8); g.add(b); }
  // đèn biên + đèn tiếp cận
  const white = new THREE.MeshBasicMaterial({ color: '#FFF4D6' }), amber = new THREE.MeshBasicMaterial({ color: '#FFB347' }), green = new THREE.MeshBasicMaterial({ color: '#5CFF9D' });
  const bulb = new THREE.SphereGeometry(.22, 8, 6);
  for (let z = z0; z > z0 - RL; z -= 10) [-RW / 2 - .6, RW / 2 + .6].forEach(x => { const m = new THREE.Mesh(bulb, white); m.position.set(x, .25, z); g.add(m); });
  for (let k = -7; k <= 7; k++) { const m = new THREE.Mesh(bulb, green); m.position.set(k * 1.1, .25, z0 + .5); g.add(m); }
  for (let z = z0 + 8; z < z0 + 90; z += 9) for (let k = -2; k <= 2; k++) { const m = new THREE.Mesh(bulb, amber); m.position.set(k * 1.6, .3, z); g.add(m); }
  // đèn thành phố xa xa
  const city = new THREE.Group(), dots = [new THREE.MeshBasicMaterial({ color: '#FFD08A' }), new THREE.MeshBasicMaterial({ color: '#FFE9C4' }), new THREE.MeshBasicMaterial({ color: '#9CC8FF' })];
  const dg = new THREE.SphereGeometry(.35, 6, 4);
  for (let i = 0; i < 420; i++) { const m = new THREE.Mesh(dg, dots[i % 3]); const side = Math.random() < .5 ? -1 : 1; m.position.set(side * rnd(30, 260), .4, rnd(-560, 60)); city.add(m); }
  g.add(city);
  // nhà ga có chữ TXCC2026
  const term = box(70, 9, 18, std('#3A4656', { roughness: .6 })); term.position.set(-58, 4.5, z0 - 170); g.add(term);
  const glass = planeMesh(66, 5, new THREE.MeshBasicMaterial({ color: '#FFD9A0' })); glass.rotation.y = Math.PI / 2; glass.position.set(-22.9, 4.2, z0 - 170); g.add(glass);
  const sign = planeMesh(26, 3.2, new THREE.MeshBasicMaterial({ map: textTex('TXCC2026 · GRADUATION', { size: 96, color: '#FFFFFF', glow: '#E9CF96' }), transparent: true }));
  sign.rotation.y = Math.PI / 2; sign.position.set(-22.8, 11, z0 - 170); g.add(sign);
  const tower = new THREE.Group(); const tb = box(3, 22, 3, std('#4A5566')); tb.position.y = 11; const tc = box(6, 3, 6, new THREE.MeshBasicMaterial({ color: '#9FD3FF' })); tc.position.y = 23.5; tower.add(tb, tc); tower.position.set(-40, 0, z0 - 230); g.add(tower);
  return { g, z0 };
}

BUILD.cinematic = async ({ duration = 8, onEnd = () => {} }) => {
  const scene = new THREE.Scene();
  scene.background = skyTex([[0, '#131F52'], [.42, '#5E4691'], [.72, '#EE8448'], [1, '#FFD39A']]);
  scene.fog = new THREE.Fog('#C9786A', 80, 520);
  const camera = new THREE.PerspectiveCamera(60, 1, .1, 1200);
  scene.add(new THREE.HemisphereLight('#FFD6B0', '#2A2A48', 1.0));
  const sun = new THREE.DirectionalLight('#FFB070', 1.3); sun.position.set(30, 18, -120); scene.add(sun);
  for (let i = 0; i < 70; i++) {
    const c = makeCloud(rnd(1.5, 4), i % 3 ? '#FFF4EA' : '#FFD9C2');
    c.position.set(rnd(-50, 50), rnd(30, 60), rnd(-260, 20)); scene.add(c);
  }
  const ap = makeAirport(); scene.add(ap.g);
  const jet = makeJet(.9); scene.add(jet);
  const TD = ap.z0 - 25;                              // điểm chạm bánh
  let t = 0, ended = false;
  return {
    scene, camera,
    update(dt) {
      t += dt; const k = Math.min(1, t / duration);
      // máy bay: hạ độ cao từ trên mây xuống, chạm bánh ở ~78% thời gian rồi lăn bánh
      const kd = Math.min(1, k / .78), e = ease(kd);
      const jz = THREE.MathUtils.lerp(40, TD, kd) - Math.max(0, k - .78) * 120;
      const jy = k < .78 ? THREE.MathUtils.lerp(48, .9, e) : .9;
      jet.position.set(Math.sin(t * .7) * 2 * (1 - kd), jy, jz);
      jet.rotation.set(k < .7 ? -.07 : k < .78 ? .08 : 0, 0, Math.sin(t * .7) * .12 * (1 - kd));
      // camera bám phía sau – trên máy bay, cuối cảnh lùi lại nhìn máy bay lăn trên đường băng
      const back = THREE.MathUtils.lerp(16, 22, k), up = THREE.MathUtils.lerp(6, 3.2, k);
      camera.position.set(jet.position.x * .4 + (k > .8 ? (k - .8) * 30 : 0), jy + up, jz + back);
      camera.lookAt(jet.position.x, jy + .5, jz - 30);
      if (!ended && t >= duration) { ended = true; onEnd(); }
    },
  };
};
