// Các cảnh 3D (Three.js): sân bay, game máy bay, cinematic, sảnh TR007, cửa phòng.
import * as THREE from 'three';
import { chibiTextures } from './chibi.js';

let renderer = null, canvas = null, cur = null, last = 0;
export let glOK = false;

export function initGL(c) {
  canvas = c;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { return false; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
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
  const next = await BUILD[name](opts);
  if (cur && cur.dispose) cur.dispose();
  cur = next; resize();
  return cur;
}
export function current() { return cur; }

/* ---------------- tiện ích ---------------- */
const FONT = 'Montserrat, Arial, sans-serif';
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
  const sign = planeMesh(4.2, 0.7, new THREE.MeshBasicMaterial({ map: textTex(variant === 'customs' ? '🛂 HẢI QUAN' : '✈ TXCC2026 AIRLINES', { size: 92, color: '#FFFFFF', glow: '#FF8000' }), transparent: true }));
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
  const BX = 4.2, BYmin = -1.2, BYmax = 3;
  let t = 0, spawnT = 0, score = 0, lives = 3, inv = 0, done = false, shake = 0, started = false;
  const speed = 46;

  // điều khiển: kéo ngón tay / chuột, hoặc phím mũi tên
  const onPtr = e => {
    if (done) return;
    const r = canvas.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    target.set(nx * BX * 1.15, THREE.MathUtils.lerp(BYmax, BYmin, (ny + 1) / 2));
  };
  const keys = {};
  const onKey = e => { keys[e.key] = e.type === 'keydown'; };
  canvas.addEventListener('pointerdown', onPtr); canvas.addEventListener('pointermove', onPtr);
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
    update(dt, tt) {
      if (!done && started) t += dt;
      if (keys.ArrowLeft) target.x -= 9 * dt; if (keys.ArrowRight) target.x += 9 * dt;
      if (keys.ArrowUp) target.y += 7 * dt; if (keys.ArrowDown) target.y -= 7 * dt;
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
          setTimeout(() => onEnd({ mode, score, lives: Math.max(0, lives), survived: lives > 0 }), 900);
        }
      }
    },
    dispose() {
      canvas.removeEventListener('pointerdown', onPtr); canvas.removeEventListener('pointermove', onPtr);
      removeEventListener('keydown', onKey); removeEventListener('keyup', onKey);
      canvas.style.touchAction = '';
    },
  };
};

/* ---------------- CINEMATIC bay qua mây tới khách sạn ---------------- */
function archShape(w, h) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h - w / 2); s.absarc(0, h - w / 2, w / 2, Math.PI, 0, true); s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0);
  return s;
}
function makeHotel() {
  const g = new THREE.Group();
  const white = std('#F3F1EC', { roughness: .8 });
  const tower = box(8, 24, 7, white); tower.position.y = 12; g.add(tower);
  const glow = new THREE.MeshBasicMaterial({ color: '#FFD28A' });
  const rim = new THREE.MeshBasicMaterial({ color: '#FFF0C8' });
  [4.2, 9.6, 15, 20.2].forEach((y, i) => {
    const w = i === 0 ? 5.4 : 4.4, h = i === 0 ? 4.6 : 4.2;
    const ring = archShape(w + .5, h + .3); ring.holes.push(archShape(w, h));
    const rm = new THREE.Mesh(new THREE.ExtrudeGeometry(ring, { depth: .15, bevelEnabled: false }), rim); rm.position.set(i % 2 ? .6 : -.4, y - h / 2, 3.52); g.add(rm);
    const win = new THREE.Mesh(new THREE.ShapeGeometry(archShape(w, h)), glow); win.position.set(rm.position.x, y - h / 2, 3.51); g.add(win);
    const sm = planeMesh(1.1, 1.6, glow); sm.position.set(i % 2 ? -3 : 3, y, 3.51); g.add(sm);
  });
  const sign = planeMesh(5.6, 1, new THREE.MeshBasicMaterial({ map: textTex('TR007 HOTEL', { size: 150, color: '#FFFFFF', glow: '#FFD28A' }), transparent: true }));
  sign.position.set(0, 1.9, 3.6); g.add(sign);
  const lobby = planeMesh(6, 1.6, new THREE.MeshBasicMaterial({ color: '#FFE0A8' })); lobby.position.set(0, .8, 3.52); g.add(lobby);
  const ground = planeMesh(300, 300, std('#24323A', { roughness: 1 })); ground.rotation.x = -Math.PI / 2; g.add(ground);
  for (let i = 0; i < 18; i++) {
    const tr = new THREE.Mesh(new THREE.ConeGeometry(rnd(.8, 1.4), rnd(2.5, 4), 7), std('#1E4A2E')); const sd = Math.random() < .5 ? -1 : 1;
    tr.position.set(sd * rnd(6, 30), 1.5, rnd(-20, 30)); g.add(tr);
  }
  const lamp = new THREE.PointLight('#FFC873', 40, 30); lamp.position.set(0, 4, 7); g.add(lamp);
  return g;
}

BUILD.cinematic = async ({ duration = 7.5, onEnd = () => {} }) => {
  const scene = new THREE.Scene();
  scene.background = skyTex([[0, '#16245E'], [.45, '#6A4C9C'], [.75, '#F2864A'], [1, '#FFD39A']]);
  scene.fog = new THREE.Fog('#E9967A', 60, 230);
  const camera = new THREE.PerspectiveCamera(58, 1, .1, 500);
  scene.add(new THREE.HemisphereLight('#FFD6B0', '#30305A', 1.0));
  const sun = new THREE.DirectionalLight('#FFB070', 1.4); sun.position.set(10, 6, -20); scene.add(sun);
  for (let i = 0; i < 70; i++) {
    const c = makeCloud(rnd(1.5, 4), i % 3 ? '#FFF4EA' : '#FFD9C2');
    c.position.set(rnd(-40, 40), rnd(6, 34), rnd(-200, 0)); scene.add(c);
  }
  const hotel = makeHotel(); hotel.position.set(0, 0, -250); scene.add(hotel);
  const jet = makeJet(.6); scene.add(jet);
  let t = 0, ended = false;
  return {
    scene, camera,
    update(dt) {
      t += dt; const k = Math.min(1, t / duration), e = ease(k);
      const z = THREE.MathUtils.lerp(10, -228, e), y = THREE.MathUtils.lerp(26, 8, ease(Math.max(0, (k - .35) / .65)));
      camera.position.set(Math.sin(t * .6) * 2 * (1 - k), y, z);
      const lk = new THREE.Vector3(0, THREE.MathUtils.lerp(20, 9, k), z - 40);
      if (k > .5) lk.lerp(new THREE.Vector3(0, 10, -246), (k - .5) * 2);
      camera.lookAt(lk);
      jet.position.set(Math.sin(t * .9) * 1.5, y - 1.6, z - 9 - k * 10);
      jet.rotation.z = Math.sin(t * .9) * .3; jet.rotation.x = -.05;
      jet.visible = k < .78;
      if (!ended && t >= duration) { ended = true; onEnd(); }
    },
  };
};

/* ---------------- SẢNH TR007 (mô phỏng sảnh Troy) ---------------- */
BUILD.lobby = async () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2A1C12');
  const camera = new THREE.PerspectiveCamera(64, 1, .1, 100);
  scene.add(new THREE.HemisphereLight('#FFF0DA', '#4A3424', .75));
  const spot = new THREE.SpotLight('#FFE2B0', 60, 20, .7, .5); spot.position.set(0, 6.5, 2); spot.target.position.set(0, 1, -5); scene.add(spot, spot.target);
  const fill = new THREE.PointLight('#FFD9A0', 25, 14); fill.position.set(0, 3.5, -2); scene.add(fill);

  const W = 12, H = 6.2, D = 18;
  const floor = planeMesh(W, D, std('#EDE6DA', { roughness: .2, metalness: .05, map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#EFE8DC'; g.fillRect(0, 0, w, h); g.strokeStyle = '#D8CDBB'; g.lineWidth = 4; g.strokeRect(0, 0, w, h); g.strokeStyle = 'rgba(150,140,120,.25)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 60); g.bezierCurveTo(80, 90, 160, 30, 256, 110); g.stroke(); }, [6, 9]) }));
  floor.rotation.x = -Math.PI / 2; floor.position.z = -D / 2 + 6; scene.add(floor);
  // thảm hoa văn trước sofa như ảnh thật
  const rug = planeMesh(3.2, 2.2, std('#fff', { map: canvasTex(256, 176, (g, w, h) => { g.fillStyle = '#F2EEE6'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 22) for (let y = 0; y < h; y += 22) { g.fillStyle = (x / 22 + y / 22) % 2 ? '#2E3A44' : '#C9C2B4'; g.beginPath(); g.moveTo(x + 11, y); g.lineTo(x + 22, y + 11); g.lineTo(x + 11, y + 22); g.lineTo(x, y + 11); g.fill(); } g.strokeStyle = '#B8963E'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); }) }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(-3.4, .01, .6); scene.add(rug);
  const ceil = planeMesh(W, D, std('#F6F1EA')); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, -D / 2 + 6); scene.add(ceil);
  const cove = box(W - 1, .05, .12, new THREE.MeshBasicMaterial({ color: '#FFE7B8' })); cove.position.set(0, H - .3, -5.9); scene.add(cove);
  for (let i = -1; i <= 1; i++) for (let j = 0; j < 3; j++) { const dl = new THREE.Mesh(new THREE.CircleGeometry(.12, 16), new THREE.MeshBasicMaterial({ color: '#FFF6E0' })); dl.rotation.x = Math.PI / 2; dl.position.set(i * 3, H - .01, -4 + j * 3); scene.add(dl); }

  // tường sau: gỗ hai bên, nền kem giữa
  const back = planeMesh(W, H, std('#E9DCC6', { roughness: .8 })); back.position.set(0, H / 2, -6); scene.add(back);
  const wood = woodTex([3, 1]);
  [-1, 1].forEach(s => {
    const p = box(2.6, H, .2, std('#fff', { map: wood, roughness: .55 })); p.position.set(s * 4.7, H / 2, -5.85); scene.add(p);
    const side = planeMesh(D, H, std(s < 0 ? '#E9DCC6' : '#fff', s < 0 ? { roughness: .8 } : { map: woodTex([8, 1]), roughness: .55 })); side.rotation.y = -s * Math.PI / 2; side.position.set(s * W / 2, H / 2, -D / 2 + 6); scene.add(side);
  });

  // vòm sau quầy: viền vàng phát sáng + lam gỗ dọc
  const AW = 4.6, AH = 4.3;
  const ringShape = archShape(AW + .36, AH + .18); ringShape.holes.push(archShape(AW, AH));
  const ring = new THREE.Mesh(new THREE.ExtrudeGeometry(ringShape, { depth: .14, bevelEnabled: true, bevelSize: .03, bevelThickness: .03, bevelSegments: 2 }), new THREE.MeshStandardMaterial({ color: '#E8C27A', metalness: .9, roughness: .25, emissive: '#FFB84D', emissiveIntensity: .9 }));
  ring.position.set(0, .6, -5.88); scene.add(ring);
  const inner = new THREE.Mesh(new THREE.ShapeGeometry(archShape(AW, AH)), std('#C8A06A', { roughness: .7 })); inner.position.set(0, .6, -5.89); scene.add(inner);
  const slatM = std('#D8B27A', { roughness: .5, map: woodTex([1, 1], '#C9A06A', '#E2BE86') });
  for (let x = -AW / 2 + .14; x <= AW / 2 - .1; x += .2) {
    const r = AW / 2, cy = AH - r;
    const top = Math.abs(x) < r ? cy + Math.sqrt(r * r - x * x) - .08 : cy;
    const sl = box(.09, top, .12, slatM); sl.position.set(x, .6 + top / 2, -5.8); scene.add(sl);
  }
  const signT = planeMesh(3.6, .9, new THREE.MeshBasicMaterial({ map: textTex('TR007 HOTEL', { size: 150, gold: true, glow: 'rgba(255,200,100,.6)' }), transparent: true }));
  signT.position.set(0, 3.55, -5.68); scene.add(signT);
  const emblemTex = await new THREE.TextureLoader().loadAsync('img/troy-emblem.png'); emblemTex.colorSpace = THREE.SRGBColorSpace;
  const emblem = planeMesh(.95, .95, new THREE.MeshBasicMaterial({ map: emblemTex, color: '#F2CD84', transparent: true }));
  emblem.position.set(0, 4.35, -5.68); scene.add(emblem);
  // đồng hồ vàng
  const clock = new THREE.Group();
  clock.add(new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .06, 32), std('#E8C27A', { metalness: .9, roughness: .2 })));
  const face = new THREE.Mesh(new THREE.CircleGeometry(.34, 32), std('#FFF8E8')); face.rotation.x = -Math.PI / 2; face.position.y = .035; clock.add(face);
  const hh = box(.03, .01, .2, std('#333')); hh.position.set(0, .04, -.08); clock.add(hh);
  const mh = box(.02, .01, .28, std('#333')); mh.position.set(.08, .04, 0); mh.rotation.y = 1.2; clock.add(mh);
  clock.rotation.x = Math.PI / 2; clock.position.set(-2.9, 4.6, -5.8); scene.add(clock);

  // quầy đá trắng + 2 màn hình
  const marble = marbleTex([2, 1]);
  const ctr = box(5.6, 1.2, 1.1, std('#fff', { map: marble, roughness: .12, metalness: .05 })); ctr.position.set(0, .6, -3.6); scene.add(ctr);
  const ctop = box(5.9, .1, 1.35, std('#fff', { map: marble, roughness: .1 })); ctop.position.set(0, 1.25, -3.6); scene.add(ctop);
  [-1.75, 1.75].forEach(x => { const m = box(.75, .45, .05, std('#151515', { roughness: .3 })); m.position.set(x, 1.55, -3.85); m.rotation.y = -x * .12; scene.add(m); const st = box(.06, .2, .06, std('#222')); st.position.set(x, 1.35, -3.88); scene.add(st); });
  const bell = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), std('#E8C27A', { metalness: .9, roughness: .2 })); bell.position.set(.2, 1.3, -3.2); scene.add(bell);

  // lan hồ điệp trong bình vàng
  function orchid(x, z, s, col) {
    const g = new THREE.Group();
    const vase = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [.32, .05], [.42, .45], [.3, .85], [.34, 1]].map(p => new THREE.Vector2(p[0], p[1])), 24), std('#E2B867', { metalness: .9, roughness: .25 }));
    g.add(vase);
    const leaf = std('#2E6B3A');
    for (let i = 0; i < 4; i++) { const l = box(.9, .02, .22, leaf); l.position.set(0, 1.02, 0); l.rotation.set(0, i * Math.PI / 2 + .4, -.35); l.translateX(.35); g.add(l); }
    const petal = std(col, { roughness: .6 }), petal2 = std('#F3D6F2', { roughness: .6 });
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2;
      for (let j = 0; j < 7; j++) {
        const f = new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), j % 3 ? petal : petal2); f.scale.z = .45;
        const r = .15 + j * .11; f.position.set(Math.cos(a) * r, 1.4 + j * .16 - j * j * .022, Math.sin(a) * r); g.add(f);
      }
    }
    g.position.set(x, 0, z); g.scale.setScalar(s); return g;
  }
  const o1 = orchid(2.45, -3.45, .62, '#8E2C8E'); o1.position.y = 1.3; const o2 = orchid(-4.3, -4.9, 1.3, '#B04FB4');
  scene.add(o1, o2);
  // sofa trắng viền đen bên trái
  const sofa = new THREE.Group();
  const sb = box(2.4, .45, .9, std('#EDE7DC')); sb.position.y = .45; sofa.add(sb);
  const sback = box(2.4, .7, .18, std('#EDE7DC')); sback.position.set(0, .95, -.38); sofa.add(sback);
  [-1, 1].forEach(s => { const a = box(.14, .75, .9, std('#1C1C1C', { roughness: .3 })); a.position.set(s * 1.25, .55, 0); sofa.add(a); });
  sofa.position.set(-4.4, 0, .8); sofa.rotation.y = Math.PI / 2; scene.add(sofa);

  const rc = await chibiActor('reception', 2.3);
  rc.userData.baseY = 2.3; rc.position.set(0, 2.3, -4.45); scene.add(rc);

  const from = new THREE.Vector3(0, 1.8, 11), to = new THREE.Vector3(0, 1.75, 4.6);
  let t = 0;
  return {
    scene, camera, agent: rc,
    update(dt, tt) {
      t += dt; const k = Math.min(1, t / 3.2), e = ease(k);
      camera.position.lerpVectors(from, to, e);
      camera.position.y += Math.sin(t * 7) * .03 * (1 - k); // nhịp bước chân
      camera.position.x = Math.sin(tt * .4) * .08;
      camera.lookAt(0, 1.55, -5);
      rc.userData.update(dt, tt);
      ring.material.emissiveIntensity = .8 + Math.sin(tt * 2) * .15;
    },
  };
};

/* ---------------- CỬA PHÒNG 0812 ---------------- */
BUILD.door = async () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#120C08');
  const camera = new THREE.PerspectiveCamera(64, 1, .1, 60);
  scene.add(new THREE.HemisphereLight('#FFE6C8', '#20140C', .5));
  const down = new THREE.SpotLight('#FFD9A0', 50, 12, .55, .6); down.position.set(0, 5.5, -1); down.target.position.set(0, 1.5, -3); scene.add(down, down.target);

  const wallM = std('#fff', { map: woodTex([6, 1], '#3D2416', '#5A3622'), roughness: .6 });
  const wall = planeMesh(14, 6, wallM); wall.position.set(0, 3, -3.05); scene.add(wall);
  const floor = planeMesh(14, 10, std('#2A1E1A', { roughness: .9 })); floor.rotation.x = -Math.PI / 2; floor.position.z = 1; scene.add(floor);
  [-1, 1].forEach(s => { const sc = box(.18, .5, .1, new THREE.MeshBasicMaterial({ color: '#FFD28A' })); sc.position.set(s * 2.4, 2.6, -2.98); scene.add(sc); const pl = new THREE.PointLight('#FFC873', 6, 4); pl.position.set(s * 2.4, 2.6, -2.6); scene.add(pl); });

  // khung cửa + lỗ sáng phía sau
  const frameM = std('#E2B867', { metalness: .8, roughness: .3 });
  const fl = box(.12, 4.4, .25, frameM); fl.position.set(-1.16, 2.2, -3); const fr = fl.clone(); fr.position.x = 1.16; const ft = box(2.44, .12, .25, frameM); ft.position.set(0, 4.4, -3);
  scene.add(fl, fr, ft);
  const lightM = new THREE.MeshBasicMaterial({ color: '#FFF6E2' });
  const behind = planeMesh(2.2, 4.3, lightM); behind.position.set(0, 2.15, -3.4); scene.add(behind);
  const roomLight = new THREE.PointLight('#FFF0D0', 0, 18); roomLight.position.set(0, 2.2, -3.6); scene.add(roomLight);

  const pivot = new THREE.Group(); pivot.position.set(-1.1, 0, -3); scene.add(pivot);
  const doorTex = canvasTex(256, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#2E1A0E'); gr.addColorStop(.5, '#4A2C18'); gr.addColorStop(1, '#2E1A0E'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(0,0,0,${rnd(.08, .2)})`; const x = rnd(0, w); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + rnd(-6, 6), h); g.stroke(); }
    g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 6; [60, 150, 240, 330, 420].forEach(y => { g.beginPath(); g.moveTo(24, y); g.lineTo(w - 24, y); g.stroke(); });
  });
  const door = box(2.2, 4.3, .12, std('#fff', { map: doorTex, roughness: .45 })); door.position.set(1.1, 2.15, 0); pivot.add(door);
  const plate = planeMesh(.9, .45, new THREE.MeshBasicMaterial({ map: textTex([{ text: '0812', size: 150 }, { text: 'TR007 HOTEL', size: 50, weight: 700 }], { w: 512, h: 256, gold: true, bg: '#1A0F08' }) }));
  plate.position.set(1.1, 3.4, .07); pivot.add(plate);
  const handle = box(.45, .06, .08, frameM); handle.position.set(1.85, 1.95, .12); pivot.add(handle);

  const lock = new THREE.Group();
  lock.add(box(.26, .55, .06, std('#111', { roughness: .2, metalness: .5 })));
  const led = new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 8), new THREE.MeshBasicMaterial({ color: '#FF3B3B' })); led.position.set(0, .2, .04); lock.add(led);
  const ico = planeMesh(.16, .16, new THREE.MeshBasicMaterial({ map: textTex('))))', { w: 128, h: 128, size: 70, color: '#8FB4FF' }), transparent: true })); ico.position.set(0, -.05, .035); lock.add(ico);
  lock.position.set(1.52, 1.75, -2.98); scene.add(lock);

  camera.position.set(0, 1.85, 5.2);
  let opening = -1, camT = 0;
  const camFrom = camera.position.clone();
  return {
    scene, camera,
    lockScreenRect() {
      const v = lock.getWorldPosition(new THREE.Vector3()).project(camera);
      const r = canvas.getBoundingClientRect();
      const x = (v.x + 1) / 2 * r.width + r.left, y = (1 - v.y) / 2 * r.height + r.top;
      return { x, y, w: Math.max(56, r.width * .12), h: Math.max(90, r.height * .12) };
    },
    unlock() { led.material.color.set('#3DFF8B'); },
    open() { opening = 0; },
    update(dt, tt) {
      camT += dt;
      camera.position.x = camFrom.x + Math.sin(tt * .5) * .05;
      if (opening >= 0) {
        opening += dt;
        const k = Math.min(1, opening / 1.6), e = ease(k);
        pivot.rotation.y = e * 1.75;
        roomLight.intensity = e * 120;
        camera.position.z = THREE.MathUtils.lerp(camFrom.z, -1.4, ease(Math.min(1, opening / 2.2)));
      }
      camera.lookAt(0, 1.45, -3.5);
    },
  };
};
