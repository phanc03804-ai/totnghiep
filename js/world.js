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

/* ---------------- đồ hoạ "thật": bầu trời shader, mây mềm, máy bay chi tiết, thành phố ---------------- */
// Bầu trời: dải màu theo độ cao + đĩa mặt trời + quầng sáng + sương mù chân trời
function makeSkyDome({ top = '#2E6FD8', mid = '#8FC4F5', horizon = '#FFE2BC', bottom = '#6B8FB0', sun = new THREE.Vector3(-.35, .22, -1), sunColor = '#FFF1D0' } = {}) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, mid: { value: new THREE.Color(mid) }, hor: { value: new THREE.Color(horizon) }, bot: { value: new THREE.Color(bottom) }, sunDir: { value: sun.clone().normalize() }, sunCol: { value: new THREE.Color(sunColor) } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vDir; uniform vec3 top, mid, hor, bot, sunDir, sunCol;
      void main(){
        float y = vDir.y;
        vec3 c = y > 0.0 ? mix(hor, mid, smoothstep(0.0, .22, y)) : mix(hor, bot, smoothstep(0.0, -.25, y));
        c = mix(c, top, smoothstep(.22, .9, y));
        float d = max(dot(normalize(vDir), sunDir), 0.0);
        c += sunCol * (pow(d, 900.0) * 6.0 + pow(d, 60.0) * .55 + pow(d, 8.0) * .18);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), mat);
}
// Bản đồ phản chiếu môi trường từ chính bầu trời (để kim loại / sơn bóng phản chiếu trời)
function envFromSky(sky) {
  const pm = new THREE.PMREMGenerator(renderer); const sc = new THREE.Scene(); sc.add(sky.clone());
  const env = pm.fromScene(sc, .02).texture; pm.dispose(); return env;
}
// Mây mềm: nhiều mảng sương vẽ bằng canvas ghép thành đám
let _cloudTex = null;
function cloudTex() {
  if (_cloudTex) return _cloudTex;
  _cloudTex = canvasTex(256, 256, (g, w, h) => {
    for (let i = 0; i < 26; i++) {
      const x = w / 2 + rnd(-60, 60), y = h / 2 + rnd(-30, 34), r = rnd(34, 78);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(.55, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
  });
  return _cloudTex;
}
function makeSoftCloud(size = 30, tint = '#FFFFFF', shade = '#C9D3E6', opacity = .95) {
  const g = new THREE.Group(), tex = cloudTex();
  const n = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < n; i++) {
    const m = new THREE.SpriteMaterial({ map: tex, color: i < n / 2 ? shade : tint, transparent: true, opacity, depthWrite: false, fog: true });
    const sp = new THREE.Sprite(m); const k = rnd(.55, 1.1) * size;
    sp.scale.set(k * 1.6, k, 1); sp.position.set(rnd(-.6, .6) * size, (i < n / 2 ? -.12 : .1) * size + rnd(-.08, .08) * size, rnd(-.3, .3) * size);
    g.add(sp);
  }
  return g;
}
// Máy bay chi tiết: thân tiện tròn, sơn TXCC2026, cửa sổ, động cơ có cánh quạt, cánh xuôi + winglet
function liveryTex() {
  // u = vòng quanh thân (0/1 = bụng, .5 = lưng), v = dọc thân (dưới = mũi, trên = đuôi)
  return canvasTex(512, 1024, (g, w, h) => {
    g.fillStyle = '#F7F8FB'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0B1F4D'; g.fillRect(0, 0, w * .17, h); g.fillRect(w * .83, 0, w * .17, h);
    g.fillStyle = '#C9A35B'; g.fillRect(w * .17, 0, w * .025, h); g.fillRect(w * .805, 0, w * .025, h);
    g.fillStyle = '#1B2A44';
    for (let y = h * .2; y < h * .82; y += 20) [w * .31, w * .69].forEach(x => { g.beginPath(); g.ellipse(x, y, 7, 5, 0, 0, Math.PI * 2); g.fill(); });
    g.save(); g.font = `800 58px ${FONT}`; g.fillStyle = '#0B1F4D'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.translate(w * .4, h * .5); g.rotate(Math.PI / 2); g.fillText('TXCC2026', 0, 0); g.restore();
    g.save(); g.font = `800 58px ${FONT}`; g.fillStyle = '#0B1F4D'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.translate(w * .6, h * .5); g.rotate(-Math.PI / 2); g.fillText('TXCC2026', 0, 0); g.restore();
  });
}
function makeJetHD(scale = 1, env = null) {
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: liveryTex(), metalness: .25, roughness: .32, clearcoat: .8, clearcoatRoughness: .15, envMap: env, envMapIntensity: 1.1 });
  const white = new THREE.MeshPhysicalMaterial({ color: '#F2F4F8', metalness: .25, roughness: .35, clearcoat: .6, envMap: env });
  const navy = new THREE.MeshPhysicalMaterial({ color: '#0B1F4D', metalness: .3, roughness: .35, clearcoat: .6, envMap: env });
  const gold = new THREE.MeshPhysicalMaterial({ color: '#C9A35B', metalness: .8, roughness: .25, envMap: env });
  const metal = new THREE.MeshStandardMaterial({ color: '#9AA3AF', metalness: .9, roughness: .3, envMap: env });
  // thân: tiện từ biên dạng (mũi tròn → thân → đuôi vuốt)
  const prof = [[0, -2.6], [.16, -2.55], [.3, -2.4], [.4, -2.15], [.45, -1.8], [.46, 1.2], [.42, 1.8], [.3, 2.35], [.12, 2.7], [0, 2.75]];
  const fus = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 40), paint);
  fus.rotation.x = Math.PI / 2; g.add(fus);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(.28, 20, 10, 0, Math.PI * 2, 0, Math.PI / 3), new THREE.MeshPhysicalMaterial({ color: '#0E1A30', metalness: .6, roughness: .05, clearcoat: 1, envMap: env }));
  glass.position.set(0, .22, -2.12); glass.rotation.x = -1.05; g.add(glass);
  // cánh xuôi có độ vểnh + winglet
  const ws = new THREE.Shape(); ws.moveTo(0, 0); ws.lineTo(3.1, 1.15); ws.lineTo(3.2, 1.5); ws.lineTo(0, 1.35); ws.lineTo(0, 0);
  const wg = new THREE.ExtrudeGeometry(ws, { depth: .06, bevelEnabled: true, bevelSize: .03, bevelThickness: .03, bevelSegments: 2 });
  [-1, 1].forEach(sd => {
    const w = new THREE.Mesh(wg, white); w.rotation.set(Math.PI / 2, sd * -.06, 0); w.scale.x = sd; w.position.set(0, -.14, -.45); g.add(w);
    const wl = new THREE.Mesh(new THREE.BoxGeometry(.05, .42, .32), navy); wl.position.set(sd * 3.18, .12, .88); wl.rotation.z = sd * -.25; g.add(wl);
    // động cơ: vỏ + quạt
    const nac = new THREE.Mesh(new THREE.CylinderGeometry(.21, .17, .95, 24, 1, true), white); nac.rotation.x = Math.PI / 2; nac.position.set(sd * 1.15, -.42, -.15); g.add(nac);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(.2, .03, 8, 24), metal); lip.position.set(sd * 1.15, -.42, -.62); g.add(lip);
    const fan = new THREE.Mesh(new THREE.CircleGeometry(.18, 24), new THREE.MeshStandardMaterial({ color: '#20242C', metalness: .7, roughness: .4 })); fan.position.set(sd * 1.15, -.42, -.6); fan.rotation.y = Math.PI; g.add(fan);
    const pyl = new THREE.Mesh(new THREE.BoxGeometry(.06, .22, .55), white); pyl.position.set(sd * 1.15, -.27, -.05); g.add(pyl);
    // cánh đuôi ngang
    const st = new THREE.Shape(); st.moveTo(0, 0); st.lineTo(1.1, .45); st.lineTo(1.12, .7); st.lineTo(0, .62);
    const stm = new THREE.Mesh(new THREE.ExtrudeGeometry(st, { depth: .04, bevelEnabled: false }), white); stm.rotation.x = Math.PI / 2; stm.scale.x = sd; stm.position.set(0, .12, 1.95); g.add(stm);
  });
  // đuôi đứng sơn navy + logo vàng
  const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.lineTo(1.05, 0); fin.lineTo(1.2, 1.25); fin.lineTo(.75, 1.25); fin.lineTo(0, 0);
  const f = new THREE.Mesh(new THREE.ExtrudeGeometry(fin, { depth: .05, bevelEnabled: true, bevelSize: .02, bevelThickness: .02, bevelSegments: 1 }), navy);
  f.rotation.y = -Math.PI / 2; f.position.set(.035, .28, 1.55); g.add(f);
  const logo = new THREE.Mesh(new THREE.CircleGeometry(.16, 20), gold); logo.position.set(.065, 1.0, 2.35); logo.rotation.y = Math.PI / 2; g.add(logo);
  const logo2 = logo.clone(); logo2.position.x = -.065; logo2.rotation.y = -Math.PI / 2; g.add(logo2);
  // đèn nháy đầu cánh
  const red = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#FF3B3B' })); red.position.set(-3.2, .05, .75); g.add(red);
  const grn = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#3DFF8B' })); grn.position.set(3.2, .05, .75); g.add(grn);
  g.userData.strobe = [red, grn];
  g.scale.setScalar(scale);
  return g;
}
// Thành phố ven sông (lặp vô tận): mặt đất, đường, sông, nhà cao tầng có cửa sổ
function windowTex() {
  return canvasTex(64, 128, (g, w, h) => {
    g.fillStyle = '#7B8696'; g.fillRect(0, 0, w, h);
    for (let y = 4; y < h; y += 8) for (let x = 3; x < w; x += 8) { const lit = Math.random(); g.fillStyle = lit > .7 ? '#FFE3A8' : lit > .4 ? '#A9C4E0' : '#46505E'; g.fillRect(x, y, 5, 5); }
  }, [1, 1]);
}
function groundTex() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#6E7B5C'; g.fillRect(0, 0, w, h);
    const cols = ['#7E8A63', '#5F6E4E', '#8C8A6A', '#76806A', '#9A9478'];
    for (let i = 0; i < 160; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(rnd(0, w), rnd(0, h), rnd(20, 70), rnd(20, 70)); }
    g.strokeStyle = 'rgba(210,205,190,.75)'; g.lineWidth = 5;
    for (let x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y <= h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  });
}
function makeCityTile(L = 500, Wd = 700, env = null, river = false) {
  const g = new THREE.Group();
  const gt = groundTex(); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(Wd / 160, L / 160);
  const ground = planeMesh(Wd, L, new THREE.MeshStandardMaterial({ map: gt, roughness: 1 })); ground.rotation.x = -Math.PI / 2; g.add(ground);
  if (river) {
    const rv = planeMesh(70, L * 1.05, new THREE.MeshStandardMaterial({ color: '#3E6E86', metalness: .3, roughness: .12, envMap: env, envMapIntensity: 1.3 }));
    rv.rotation.x = -Math.PI / 2; rv.rotation.z = .35; rv.position.set(40, .3, 0); g.add(rv);
  }
  const N = 260, geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, .5, 0);
  const mat = new THREE.MeshStandardMaterial({ map: windowTex(), roughness: .55, metalness: .2, envMap: env, envMapIntensity: .6 });
  const inst = new THREE.InstancedMesh(geo, mat, N); const m4 = new THREE.Matrix4(), col = new THREE.Color();
  for (let i = 0; i < N; i++) {
    let x = rnd(-Wd / 2, Wd / 2); if (river && Math.abs(x - 40 - 0) < 45) x += 90;
    const z = rnd(-L / 2, L / 2), far = Math.min(1, Math.abs(x) / 220);
    const h = rnd(6, 16) + (Math.random() < .14 ? rnd(8, 14 + 40 * far) : 0);   // gần đường bay thì thấp, xa mới có cao ốc
    const w = rnd(8, 18), d = rnd(8, 18);
    m4.compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion(), new THREE.Vector3(w, h, d)); inst.setMatrixAt(i, m4);
    inst.setColorAt(i, col.setHSL(rnd(.55, .62), rnd(.05, .15), rnd(.75, 1)));
  }
  g.add(inst);
  return g;
}

/* ---------------- GAME MÁY BAY ---------------- */
// mode 'coins' (hạng thương gia: nhặt tiền) | 'obstacles' (phổ thông: né chướng ngại, 3 mạng)
BUILD.flight = async ({ mode = 'coins', duration = 20, onHud = () => {}, onEnd = () => {}, sfx = {} }) => {
  const scene = new THREE.Scene();
  const SUN = new THREE.Vector3(-.45, .16, -1).normalize();
  const sky = makeSkyDome({ top: '#2A62C9', mid: '#86B9EE', horizon: '#FFE0B8', bottom: '#8FA9C2', sun: SUN });
  scene.add(sky);
  const env = envFromSky(sky); scene.environment = env;
  scene.fog = new THREE.Fog('#D9D2C8', 120, 620);
  const camera = new THREE.PerspectiveCamera(62, 1, .1, 1500);
  camera.position.set(0, 2.3, 7.5);
  scene.add(new THREE.HemisphereLight('#DCEBFF', '#6A6450', .9));
  const sun = new THREE.DirectionalLight('#FFE7C2', 2.1); sun.position.copy(SUN).multiplyScalar(100); scene.add(sun);

  const jet = makeJetHD(.55, env); scene.add(jet);
  // thành phố + sông bên dưới, cuộn liên tục
  const GROUND_Y = -46, TL = 500, tiles = [];
  for (let k = 0; k < 3; k++) { const tile = makeCityTile(TL, 900, env, k === 1); tile.position.set(0, GROUND_Y, -k * TL + 120); scene.add(tile); tiles.push(tile); }
  // mây mềm: lớp dưới thân máy bay + vài đám bay ngang tầm mắt
  const clouds = [];
  for (let i = 0; i < 26; i++) {
    const low = i < 16, c = makeSoftCloud(low ? rnd(28, 46) : rnd(10, 18), '#FFFFFF', low ? '#D7DEEA' : '#E3E8F2', low ? .85 : .7);
    const side = Math.random() < .5 ? -1 : 1;
    c.position.set(low ? rnd(-160, 160) : side * rnd(9, 40), low ? rnd(-30, -16) : rnd(-6, 12), rnd(-560, 20));
    c.userData.spd = low ? .9 : 1; scene.add(c); clouds.push(c);
  }
  // vệt gió tốc độ
  const streakGeo = new THREE.BufferGeometry(), SN = 60, sp = new Float32Array(SN * 6);
  for (let i = 0; i < SN; i++) { const x = rnd(-14, 14), y = rnd(-6, 9), z = rnd(-90, 10); sp.set([x, y, z, x, y, z + 3.5], i * 6); }
  streakGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const streaks = new THREE.LineSegments(streakGeo, new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .22 }));
  scene.add(streaks);
  // quầng sáng mặt trời
  const flareTex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,240,210,.9)'); gr.addColorStop(.25, 'rgba(255,220,170,.35)'); gr.addColorStop(1, 'rgba(255,200,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
  flare.scale.set(260, 260, 1); flare.position.copy(SUN).multiplyScalar(800); scene.add(flare);
  const glowTex = flareTex;

  const coinGeo = new THREE.CylinderGeometry(.55, .55, .14, 28);
  const coinMat = new THREE.MeshStandardMaterial({ color: '#FFD24A', metalness: .85, roughness: .2, envMap: env, emissive: '#B07600', emissiveIntensity: .55 });
  const coinFace = canvasTex(128, 128, (g) => { g.fillStyle = '#FFC83D'; g.fillRect(0, 0, 128, 128); g.font = `900 80px ${FONT}`; g.fillStyle = '#B87900'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('₫', 64, 68); });
  const coinFaceMat = new THREE.MeshStandardMaterial({ map: coinFace, metalness: .8, roughness: .22, envMap: env, emissive: '#A06A00', emissiveIntensity: .5 });
  const stormMat = new THREE.MeshStandardMaterial({ color: '#4A5266', roughness: 1, flatShading: true });
  function makeObstacle() {
    const r = Math.random();
    if (r < .5) { // mây giông + tia sét
      const g = makeSoftCloud(2.6, '#7C8597', '#4B5366', 1);
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1.6, 4), new THREE.MeshBasicMaterial({ color: '#FFF6A0' })); bolt.position.y = -1.3; bolt.rotation.z = .35; g.add(bolt);
      g.userData.bolt = bolt; g.userData.r = 1.25; return g;
    }
    if (r < .8) { // khinh khí cầu
      const g = new THREE.Group(); const col = ['#E53935', '#8E24AA', '#43A047', '#FB8C00'][Math.floor(rnd(0, 4))];
      const ball = new THREE.Mesh(new THREE.SphereGeometry(.85, 24, 16), new THREE.MeshPhysicalMaterial({ color: col, roughness: .45, clearcoat: .4, envMap: env })); ball.scale.y = 1.15; g.add(ball);
      for (let k = 0; k < 4; k++) { const rope = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .7, 3), std('#3A2A1A')); rope.position.set(Math.cos(k * 1.57) * .22, -.95, Math.sin(k * 1.57) * .22); g.add(rope); }
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

      clouds.forEach(c => { c.position.z += speed * c.userData.spd * dt; if (c.position.z > 40) c.position.z -= 600; });
      tiles.forEach(tl => { tl.position.z += speed * .55 * dt; if (tl.position.z > TL * 1.1) tl.position.z -= TL * 3; });
      const pa = streakGeo.attributes.position;
      for (let i = 0; i < SN; i++) { let z = pa.getZ(i * 2) + speed * 1.6 * dt; if (z > 12) z -= 100; pa.setZ(i * 2, z); pa.setZ(i * 2 + 1, z + 3.5); }
      pa.needsUpdate = true; streaks.material.opacity = started && !done ? .22 : .08;
      const blink = Math.floor(tt * 1.5) % 2 === 0 && (tt * 1.5) % 1 < .12; jet.userData.strobe.forEach(m => m.scale.setScalar(blink ? 2.2 : 1));
      camera.fov = THREE.MathUtils.lerp(camera.fov, started && !done ? 66 : 62, .03); camera.updateProjectionMatrix();

      if (!done && started) {
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = mode === 'coins' ? .3 : Math.max(.3, .55 - t * .012);
          let m;
          if (mode === 'coins') {
            m = new THREE.Group(); const c = new THREE.Mesh(coinGeo, [coinMat, coinFaceMat, coinFaceMat]); c.rotation.x = Math.PI / 2; m.add(c); m.userData.r = .95; m.userData.coin = true;
            const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#FFD27A', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .8 })); gl.scale.set(2.6, 2.6, 1); m.add(gl);
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
        if (m.userData.coin) m.rotation.y += dt * 4; else if (!m.userData.bolt) m.rotation.y += dt * .6;
        if (m.userData.bolt) m.userData.bolt.visible = Math.random() < .3;
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
  const SUN = new THREE.Vector3(.25, .06, -1).normalize();
  const sky = makeSkyDome({ top: '#18265E', mid: '#6A4E96', horizon: '#F49A58', bottom: '#3A2E44', sun: SUN, sunColor: '#FFC48A' });
  scene.add(sky); const env = envFromSky(sky); scene.environment = env;
  scene.fog = new THREE.Fog('#C9786A', 80, 520);
  const camera = new THREE.PerspectiveCamera(60, 1, .1, 2000);
  scene.add(new THREE.HemisphereLight('#FFD6B0', '#2A2A48', 1.0));
  const sun = new THREE.DirectionalLight('#FFB070', 1.3); sun.position.set(30, 18, -120); scene.add(sun);
  for (let i = 0; i < 70; i++) {
    const c = makeSoftCloud(rnd(14, 30), i % 3 ? '#FFE6D2' : '#FFD0B0', '#B98A8E', .9);
    c.position.set(rnd(-70, 70), rnd(26, 62), rnd(-280, 30)); scene.add(c);
  }
  const ap = makeAirport(); scene.add(ap.g);
  const jet = makeJetHD(.9, env); scene.add(jet);
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
