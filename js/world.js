// Các cảnh 3D (Three.js): sân bay (check-in, thủ tục), ống lồng, cất cánh, chặng bay, phim hạ cánh.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

let renderer = null, canvas = null, cur = null, last = 0, paused = false;
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
  if (!paused) cur.update(dt, t / 1000);
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
// tạm dừng: vẫn vẽ khung hình hiện tại nhưng không cập nhật cảnh
export function setPaused(p) { paused = p; }
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

// Cường bằng ảnh thật đã tách nền, dựng như một tấm đứng trong cảnh; khi nói thì nhún nhẹ
let _cuongTex = null;
async function photoActor(height = 2.4, mirror = false) {
  if (!_cuongTex) { _cuongTex = await new THREE.TextureLoader().loadAsync('img/cuong.webp'); _cuongTex.colorSpace = THREE.SRGBColorSpace; }
  const mat = new THREE.MeshBasicMaterial({ map: _cuongTex, transparent: true, alphaTest: .35, color: '#F4F1EC' });
  const m = planeMesh(height * 499 / 826, height, mat);
  if (mirror) m.scale.x = -1;
  let talking = false;
  m.userData.talk = on => { talking = on; };
  m.userData.update = (dt, t) => {
    m.position.y = m.userData.baseY + Math.sin(t * 1.6) * .008 + (talking ? Math.abs(Math.sin(t * 7)) * .012 : 0);
    m.rotation.z = talking ? Math.sin(t * 2.3) * .006 : 0;
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
BUILD.airport = async ({ variant = 'checkin', cam = 'counter', onArrive = () => {} }) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#C9D6EA');
  scene.fog = new THREE.Fog('#C9D6EA', 18, 46);
  const camera = new THREE.PerspectiveCamera(60, 1, .1, 100);
  baseLights(scene);

  // sàn bóng + trần đèn
  const floor = planeMesh(60, 60, std('#D9DEE6', { roughness: .18, metalness: .2, map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#E3E7EE'; g.fillRect(0, 0, w, h); g.strokeStyle = '#C3C9D4'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); }, [20, 20]) }));
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

  const agent = await photoActor(2.5, variant === 'customs');
  agent.userData.baseY = 1.95; agent.position.set(variant === 'customs' ? .25 : -.15, 1.95, -1.55); scene.add(agent);

  if (variant === 'customs') { // cổng soi chiếu an ninh camera sẽ đi xuyên qua
    const arch = new THREE.Group(), am = std('#B9C2CF', { metalness: .6, roughness: .3 });
    const l = box(.25, 2.4, .5, am); l.position.set(-.95, 1.2, 0); const r = l.clone(); r.position.x = .95; const tp = box(2.15, .3, .5, am); tp.position.y = 2.45;
    const glow = box(1.6, .05, .05, new THREE.MeshBasicMaterial({ color: '#3DFF8B' })); glow.position.set(0, 2.28, .27);
    arch.add(l, r, tp, glow); arch.position.z = 6.8; scene.add(arch);
    const belt = box(1.1, .8, 4, std('#2A3140', { roughness: .4 })); belt.position.set(2.6, .4, 7); scene.add(belt);
  }

  // camera: 'wide' = đứng xa nhìn tổng thể; còn lại = bước từ xa tới quầy (có nhịp bước chân)
  const camPos = cam === 'wide' ? new THREE.Vector3(0, 2.3, 8) : new THREE.Vector3(0, 1.75, 4.4);
  const start = cam === 'wide' ? camPos.clone().add(new THREE.Vector3(0, .3, 2)) : new THREE.Vector3(variant === 'customs' ? .3 : -1.2, 1.75, variant === 'customs' ? 12 : 15);
  const look = new THREE.Vector3(0, cam === 'wide' ? 2.4 : 1.25, -2);
  const walkT = cam === 'wide' ? 1.6 : 4.2;
  camera.position.copy(start);
  let t0 = 0, arrived = false;
  return {
    scene, camera, agent,
    update(dt, t) {
      t0 += dt;
      const k = Math.min(1, t0 / walkT), e = cam === 'wide' ? ease(k) : 1 - Math.pow(1 - k, 2.2);
      camera.position.lerpVectors(start, camPos, e);
      const moving = k < 1 && cam !== 'wide';
      camera.position.y += moving ? Math.abs(Math.sin(t0 * 7.5)) * .05 : Math.sin(t * .8) * .015;
      camera.position.x += moving ? Math.sin(t0 * 3.75) * .03 : Math.sin(t * .5) * .04;
      const lk = look.clone(); if (moving) lk.x += Math.sin(t0 * 1.2) * .6 * (1 - k);
      camera.lookAt(lk);
      agent.userData.update(dt, t);
      jet.position.x = -10.5 + Math.sin(t * .1) * .4;
      if (!arrived && k >= 1) { arrived = true; onArrive(); }
    },
  };
};

/* ---------------- ỐNG LỒNG lên máy bay ---------------- */
BUILD.boarding = async ({ onArrive = () => {} }) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1A2233');
  const camera = new THREE.PerspectiveCamera(62, 1, .1, 200);
  scene.add(new THREE.HemisphereLight('#EAF2FF', '#2A2622', .9));
  const L = 34;
  const carpet = planeMesh(3, L, std('#2D3A55', { roughness: 1, map: canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#2D3A55'; g.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .05})`; g.fillRect(Math.random() * w, Math.random() * h, 1, 1); } }, [3, 30]) }));
  carpet.rotation.x = -Math.PI / 2; carpet.position.z = -L / 2 + 4; scene.add(carpet);
  const wallM = std('#C8CDD6', { roughness: .5 });
  [-1, 1].forEach(sd => { const w = planeMesh(L, 2.6, wallM); w.rotation.y = -sd * Math.PI / 2; w.position.set(sd * 1.5, 1.3, -L / 2 + 4); scene.add(w); });
  const ceil = planeMesh(3, L, std('#E4E7EC')); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 2.6, -L / 2 + 4); scene.add(ceil);
  const sky = skyTex([[0, '#6FB2F2'], [.7, '#D8ECFF'], [1, '#F6E2C4']]);
  for (let z = 2; z > -L + 6; z -= 3.2) {
    const wl = planeMesh(1.6, .9, new THREE.MeshBasicMaterial({ map: sky })); wl.rotation.y = Math.PI / 2; wl.position.set(-1.49, 1.55, z); scene.add(wl);
    const lt = box(1.2, .03, .25, new THREE.MeshBasicMaterial({ color: '#FFFFFF' })); lt.position.set(0, 2.58, z); scene.add(lt);
  }
  // cửa máy bay ở cuối ống lồng
  const door = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 8, 40, 1, true, -.6, 1.2), std('#F4F5F8', { roughness: .35, side: THREE.DoubleSide }));
  hull.rotation.z = Math.PI / 2; hull.position.set(0, 1.3, -3.1); door.add(hull);
  const open = planeMesh(1.05, 1.9, new THREE.MeshBasicMaterial({ color: '#FFE7BF' })); open.position.set(0, 1.05, .01 - .02); door.add(open);
  const stripe = planeMesh(8, .12, new THREE.MeshBasicMaterial({ color: '#C9A35B' })); stripe.position.set(0, .2, .02); door.add(stripe);
  const glow = new THREE.PointLight('#FFE0B0', 30, 8); glow.position.set(0, 1.3, -1); door.add(glow);
  door.position.z = -L + 5; scene.add(door);
  // chỉ 3 bước là tới cửa máy bay
  const end = new THREE.Vector3(0, 1.62, -L + 7.2), start = end.clone().setZ(end.z + 2.6), WALK = 1.6;
  camera.position.copy(start);
  let t0 = 0, arrived = false;
  return {
    scene, camera,
    update(dt) {
      t0 += dt; const k = Math.min(1, t0 / WALK), e = 1 - Math.pow(1 - k, 2);
      camera.position.lerpVectors(start, end, e);
      camera.position.y += k < 1 ? Math.abs(Math.sin(t0 * Math.PI * 3 / WALK)) * .045 : 0;
      camera.lookAt(0, 1.4, camera.position.z - 6);
      if (!arrived && k >= 1) { arrived = true; onArrive(); }
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
    const wl = new THREE.Mesh(new THREE.BoxGeometry(.04, .34, .26), gold); wl.position.set(sd * 3.18, .12, .88); wl.rotation.z = sd * -.25; g.add(wl);
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

/* ---------------- CẤT CÁNH: nhìn qua cửa sổ khoang khách ---------------- */
const SKY = {
  morning: { top: '#3A7FE0', mid: '#9CCCF5', horizon: '#FFE7C6', bottom: '#9FB6CA', sun: new THREE.Vector3(.5, .12, -1), sunColor: '#FFF0D2', fog: '#DCE6EE' },
  storm: { top: '#1A2030', mid: '#2C3446', horizon: '#4A5262', bottom: '#20252F', sun: new THREE.Vector3(0, -1, 0), sunColor: '#000000', fog: '#363D4C' },
  sunset: { top: '#18265E', mid: '#6A4E96', horizon: '#F49A58', bottom: '#3A2E44', sun: new THREE.Vector3(.25, .06, -1), sunColor: '#FFC48A', fog: '#C9786A' },
};
BUILD.takeoff = async ({ duration = 7, onEnd = () => {} }) => {
  const scene = new THREE.Scene(), P = SKY.morning;
  const sky = makeSkyDome({ ...P, sun: P.sun.clone().normalize() }); scene.add(sky);
  const env = envFromSky(sky); scene.environment = env;
  scene.fog = new THREE.Fog(P.fog, 120, 700);
  scene.add(new THREE.HemisphereLight('#E6F0FF', '#5D6450', 1));
  const sun = new THREE.DirectionalLight('#FFF1D6', 1.8); sun.position.set(40, 30, -60); scene.add(sun);
  const ap = makeAirport(); scene.add(ap.g);
  const jet = makeJetHD(1, env); scene.add(jet);
  const camera = new THREE.PerspectiveCamera(55, 1, .05, 2000);
  let t = 0, ended = false;
  return {
    scene, camera,
    update(dt) {
      t += dt;
      const z = ap.z0 - 10 - 3.2 * t * t, climb = Math.max(0, t - 4.3), y = .9 + climb * climb * 3.2;
      jet.position.set(0, y, z); jet.rotation.x = Math.min(.22, climb * .18);
      // camera ngồi cạnh cửa sổ bên trái, nhìn ra cánh
      const cp = new THREE.Vector3(-.56, .26, -.2).applyEuler(jet.rotation).add(jet.position);
      camera.position.copy(cp).add(new THREE.Vector3(0, Math.sin(t * 40) * .004 * (t < 4.3 ? t / 4 : .3), 0));
      const lookAt = new THREE.Vector3(-4, -.15, -2.4).applyEuler(jet.rotation).add(jet.position);
      camera.lookAt(lookAt);
      if (!ended && t >= duration) { ended = true; onEnd(); }
    },
  };
};

/* ---------------- CHẶNG BAY ----------------
   mode 'memories' : trời trong, nhặt xu + lần lượt từng vật phẩm kỷ niệm. Ăn đúng vật phẩm thì game dừng (onItem), app gọi resume()
   mode 'storm'    : giông bão chỉ để xem (mưa, chớp); calm(k) làm trời quang dần khi khách chạm giữ */
let _glowTex = null;
function glowTexture() {
  return _glowTex || (_glowTex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,240,210,.9)'); gr.addColorStop(.3, 'rgba(255,220,170,.35)'); gr.addColorStop(1, 'rgba(255,200,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }));
}
function emojiTex(ch) {
  return canvasTex(128, 128, (g) => { g.font = '92px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 64, 72); });
}
BUILD.flight = async ({ mode = 'memories', items: ITEMS = [], onHud = () => {}, onItem = () => {}, onFlash = () => {}, sfx = {} }) => {
  const scene = new THREE.Scene();
  const P = SKY[mode === 'storm' ? 'storm' : 'morning'];
  const sky = makeSkyDome({ ...P, sun: P.sun.clone().normalize() }); scene.add(sky);
  const env = envFromSky(sky); scene.environment = env;
  scene.fog = new THREE.Fog(P.fog, mode === 'storm' ? 30 : 120, mode === 'storm' ? 260 : 620);
  const camera = new THREE.PerspectiveCamera(62, 1, .1, 1500);
  camera.position.set(0, 2.3, 7.5);
  const hemi = new THREE.HemisphereLight(mode === 'storm' ? '#8090B0' : '#DCEBFF', '#5A5448', mode === 'storm' ? .55 : .9); scene.add(hemi);
  const sunL = new THREE.DirectionalLight('#FFE7C2', mode === 'storm' ? .5 : 2); sunL.position.copy(P.sun).multiplyScalar(100).setY(60); scene.add(sunL);

  const jet = makeJetHD(.55, env); scene.add(jet);
  const speed = 46;

  // mặt đất: thành phố cuộn
  const GROUND_Y = -46, TL = 500, tiles = [];
  for (let k = 0; k < 3; k++) { const tile = makeCityTile(TL, 900, env, k === 1); tile.position.set(0, GROUND_Y, -k * TL + 120); scene.add(tile); tiles.push(tile); }

  // mây
  const clouds = [];
  const nC = mode === 'storm' ? 34 : 24;
  for (let i = 0; i < nC; i++) {
    const low = i < nC * .6;
    const c = mode === 'storm' ? makeSoftCloud(low ? rnd(30, 50) : rnd(12, 22), '#5A6273', '#2E3442', .95)
      : makeSoftCloud(low ? rnd(28, 46) : rnd(10, 18), '#FFFFFF', '#D7DEEA', low ? .85 : .7);
    const side = Math.random() < .5 ? -1 : 1;
    c.position.set(low ? rnd(-160, 160) : side * rnd(9, 40), low ? rnd(-30, -16) : rnd(-6, 14), rnd(-560, 20));
    scene.add(c); clouds.push(c);
  }
  // mưa
  let rain = null;
  if (mode === 'storm') {
    const RN = 500, rp = new Float32Array(RN * 6);
    for (let i = 0; i < RN; i++) { const x = rnd(-16, 16), y = rnd(-8, 14), z = rnd(-60, 8); rp.set([x, y, z, x + .15, y - 1.4, z + .9], i * 6); }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
    rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#A8B8D8', transparent: true, opacity: .45 })); scene.add(rain);
  }
  const streakGeo = new THREE.BufferGeometry(), SN = 60, sp = new Float32Array(SN * 6);
  for (let i = 0; i < SN; i++) { const x = rnd(-14, 14), y = rnd(-6, 9), z = rnd(-90, 10); sp.set([x, y, z, x, y, z + 3.5], i * 6); }
  streakGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const streaks = new THREE.LineSegments(streakGeo, new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .2 })); scene.add(streaks);
  const glowTex = glowTexture();
  if (mode !== 'storm') { const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false })); fl.scale.set(260, 260, 1); fl.position.copy(P.sun).normalize().multiplyScalar(800); scene.add(fl); }

  // trời quang dần (chặng giông bão): nội suy màu trời, sương, mây, mưa
  const calmFrom = { top: new THREE.Color(P.top), mid: new THREE.Color(P.mid), hor: new THREE.Color(P.horizon), bot: new THREE.Color(P.bottom), fog: new THREE.Color(P.fog) };
  const calmTo = { top: new THREE.Color('#4A86DA'), mid: new THREE.Color('#A9CDEE'), hor: new THREE.Color('#FFE3BC'), bot: new THREE.Color('#9FB6CA'), fog: new THREE.Color('#E6DCCB') };
  const cloudMats = clouds.flatMap(c => c.children.map(s => ({ m: s.material, from: s.material.color.clone() })));
  const white = new THREE.Color('#FFFFFF');
  let calmK = 0;
  function calm(k) {
    calmK = k; const u = sky.material.uniforms;
    u.top.value.lerpColors(calmFrom.top, calmTo.top, k); u.mid.value.lerpColors(calmFrom.mid, calmTo.mid, k);
    u.hor.value.lerpColors(calmFrom.hor, calmTo.hor, k); u.bot.value.lerpColors(calmFrom.bot, calmTo.bot, k);
    scene.fog.color.lerpColors(calmFrom.fog, calmTo.fog, k); scene.fog.near = 30 + 90 * k; scene.fog.far = 260 + 360 * k;
    cloudMats.forEach(o => o.m.color.lerpColors(o.from, white, k * .85));
    sunL.intensity = .5 + 1.5 * k;
    if (rain) rain.material.opacity = .45 * (1 - k);
  }

  // vật thể
  const coinGeo = new THREE.CylinderGeometry(.55, .55, .14, 28);
  const coinMat = new THREE.MeshStandardMaterial({ color: '#FFD24A', metalness: .85, roughness: .2, envMap: env, emissive: '#B07600', emissiveIntensity: .55 });
  const coinFace = canvasTex(128, 128, (g) => { g.fillStyle = '#FFC83D'; g.fillRect(0, 0, 128, 128); g.font = `900 80px ${FONT}`; g.fillStyle = '#B87900'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('₫', 64, 68); });
  const coinFaceMat = new THREE.MeshStandardMaterial({ map: coinFace, metalness: .8, roughness: .22, envMap: env, emissive: '#A06A00', emissiveIntensity: .5 });
  function makeCoin() { const m = new THREE.Group(); const c = new THREE.Mesh(coinGeo, [coinMat, coinFaceMat, coinFaceMat]); c.rotation.x = Math.PI / 2; m.add(c); const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#FFD27A', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .8 })); gl.scale.set(2.6, 2.6, 1); m.add(gl); m.userData = { kind: 'coin', r: .95 }; return m; }
  const itemTex = ITEMS.map(it => emojiTex(it.emoji || '⭐'));
  function makeItem(k) {
    const m = new THREE.Group();
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#FFE9A8', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); gl.scale.set(5.5, 5.5, 1); m.add(gl);
    const s1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: itemTex[k], transparent: true, depthWrite: false })); s1.scale.set(2.3, 2.3, 1); m.add(s1);
    m.userData = { kind: 'item', r: 1.5, k, ph: rnd(0, 6) }; return m;
  }

  const items = [], Y0 = .6, target = new THREE.Vector2(0, Y0), pos = new THREE.Vector2(0, Y0);
  let BX = 4.2;
  let spawnT = 0, itemT = .8, score = 0, got = 0, started = false, paused = false, flashT = rnd(1.5, 3);

  // kéo ngón tay sang trái / phải: máy bay bám theo vị trí ngón tay
  const onPtr = e => {
    if (e.pointerType !== 'mouse' && e.buttons === 0 && e.type === 'pointermove') return;
    const r = canvas.getBoundingClientRect();
    target.x = (((e.clientX - r.left) / r.width) * 2 - 1) * BX * 1.15;
  };
  const keys = {};
  const onKey = e => { keys[e.key] = e.type === 'keydown'; };
  const area = document.getElementById('flyArea') || canvas;
  area.addEventListener('pointerdown', onPtr); area.addEventListener('pointermove', onPtr);
  addEventListener('keydown', onKey); addEventListener('keyup', onKey);

  const sparks = [];
  function burst(p, color) {
    for (let i = 0; i < 12; i++) {
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 4), new THREE.MeshBasicMaterial({ color, transparent: true }));
      s2.position.copy(p); s2.userData.v = new THREE.Vector3(rnd(-4, 4), rnd(-2, 4), rnd(-2, 4)); s2.userData.life = .6; scene.add(s2); sparks.push(s2);
    }
  }
  const hud = () => onHud({ score, got, total: ITEMS.length });
  hud();
  function spawn(m, x, y) { m.position.set(x, y, -95); scene.add(m); items.push(m); }

  return {
    scene, camera,
    start() { started = true; },
    resume() { paused = false; },
    calm,
    update(dt, tt) {
      BX = Math.min(4.2, Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 7.5 * camera.aspect * .78 / .55);
      if (keys.ArrowLeft) target.x -= 9 * dt; if (keys.ArrowRight) target.x += 9 * dt;
      target.x = THREE.MathUtils.clamp(target.x, -BX, BX);
      const vx = (target.x - pos.x) * 6, vy = (target.y - pos.y) * 6;
      pos.x += vx * dt; pos.y += vy * dt;
      const turb = mode === 'storm' ? (Math.sin(tt * 23) * .04 + Math.sin(tt * 37) * .03) * (1 - calmK) : 0;
      jet.position.set(pos.x, pos.y + turb + Math.sin(tt * 1.3) * .05, 0);
      jet.rotation.z = THREE.MathUtils.clamp(-vx * .09, -.7, .7) + turb * 2; jet.rotation.x = 0;
      const sh = mode === 'storm' ? .03 * (1 - calmK) : 0;
      camera.position.x = pos.x * .45 + rnd(-sh, sh); camera.position.y = 2.3 + pos.y * .35 + rnd(-sh, sh) * .7;
      camera.lookAt(pos.x * .6, pos.y * .5 + .5, -8);
      camera.fov = THREE.MathUtils.lerp(camera.fov, started && !paused ? 66 : 62, .03); camera.updateProjectionMatrix();

      const sf = paused ? .2 : 1;   // lúc mở kỷ niệm: cảnh trôi chậm lại
      clouds.forEach(c => { c.position.z += speed * sf * dt; if (c.position.z > 40) c.position.z -= 600; });
      tiles.forEach(tl => { tl.position.z += speed * .55 * sf * dt; if (tl.position.z > TL * 1.1) tl.position.z -= TL * 3; });
      const pa = streakGeo.attributes.position;
      for (let i = 0; i < SN; i++) { let z = pa.getZ(i * 2) + speed * 1.6 * sf * dt; if (z > 12) z -= 100; pa.setZ(i * 2, z); pa.setZ(i * 2 + 1, z + 3.5); }
      pa.needsUpdate = true;
      if (rain) {
        const ra = rain.geometry.attributes.position;
        for (let i = 0; i < ra.count / 2; i++) {
          let y = ra.getY(i * 2) - 26 * dt, z = ra.getZ(i * 2) + speed * .8 * dt;
          if (y < -8 || z > 8) { y = rnd(6, 14); z = rnd(-60, 0); const x = rnd(-16, 16); ra.setX(i * 2, x); ra.setX(i * 2 + 1, x + .15); }
          ra.setY(i * 2, y); ra.setY(i * 2 + 1, y - 1.4); ra.setZ(i * 2, z); ra.setZ(i * 2 + 1, z + .9);
        }
        ra.needsUpdate = true;
        flashT -= dt;
        if (flashT <= 0 && calmK < .05) { flashT = rnd(2.5, 5); hemi.intensity = 3.2; onFlash(); sfx.thunder && setTimeout(sfx.thunder, rnd(80, 400)); }
        const base = .55 + calmK * .6;
        hemi.intensity += (base - hemi.intensity) * Math.min(1, dt * 6);
      }

      if (mode === 'memories' && started && !paused && got < ITEMS.length) {
        spawnT -= dt; itemT -= dt;
        if (spawnT <= 0) { spawnT = .42; spawn(makeCoin(), rnd(-BX, BX), Y0 + rnd(-.5, .5)); }
        // mỗi lượt chỉ có một loại vật phẩm bay tới, lặp lại tới khi ăn được
        if (itemT <= 0) { itemT = 1.25; spawn(makeItem(got), THREE.MathUtils.clamp(pos.x + rnd(-3, 3), -BX * .9, BX * .9), Y0 + rnd(-.3, .4)); }
      }
      for (let i = items.length - 1; i >= 0; i--) {
        const m = items[i]; const u = m.userData;
        if (!paused) m.position.z += speed * dt;
        if (u.kind === 'coin') m.rotation.y += dt * 4;
        if (u.kind === 'item') m.children[1].position.y = Math.sin(tt * 3 + u.ph) * .12;
        const dz = Math.abs(m.position.z), d = Math.hypot(m.position.x - pos.x, m.position.y - pos.y);
        if (started && !paused && dz < 1.2 && d < u.r) {
          if (u.kind === 'coin') { score += 1000; burst(m.position, '#FFD54F'); sfx.coin && sfx.coin(); }
          else if (u.kind === 'item' && u.k === got) {
            got++; score += 10000; burst(m.position, '#FFF2B0'); sfx.star && sfx.star();
            for (let j = items.length - 1; j >= 0; j--) if (items[j] !== m && items[j].userData.kind === 'item') { scene.remove(items[j]); items.splice(j, 1); }
            paused = true; onItem(u.k, got);
          }
          scene.remove(m); items.splice(items.indexOf(m), 1); hud();
          if (paused) break; continue;
        }
        if (m.position.z > 12) { scene.remove(m); items.splice(i, 1); }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s2 = sparks[i]; s2.userData.life -= dt; s2.position.addScaledVector(s2.userData.v, dt); s2.material.opacity = s2.userData.life / .6;
        if (s2.userData.life <= 0) { scene.remove(s2); sparks.splice(i, 1); }
      }
    },
    dispose() {
      area.removeEventListener('pointerdown', onPtr); area.removeEventListener('pointermove', onPtr);
      removeEventListener('keydown', onKey); removeEventListener('keyup', onKey);
    },
  };
};

/* ---------------- HẠ CÁNH: đoạn phim nhiều góc máy, hoàng hôn ---------------- */
BUILD.landing = async ({ duration = 12, onTouch = () => {}, onEnd = () => {} }) => {
  const scene = new THREE.Scene(), P = SKY.sunset;
  const sky = makeSkyDome({ ...P, sun: P.sun.clone().normalize() }); scene.add(sky);
  const env = envFromSky(sky); scene.environment = env;
  scene.fog = new THREE.Fog(P.fog, 160, 900);
  scene.add(new THREE.HemisphereLight('#FFE2C8', '#4A3E48', .95));
  const sun = new THREE.DirectionalLight('#FFB27A', 2.2); sun.position.set(30, 20, -100); scene.add(sun);
  const ap = makeAirport(); scene.add(ap.g);
  const jet = makeJetHD(1, env); scene.add(jet);
  const glowTex = glowTexture();
  const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false })); fl.scale.set(300, 300, 1); fl.position.copy(P.sun).normalize().multiplyScalar(850); scene.add(fl);
  // đèn hạ cánh ở mũi máy bay
  const lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#FFF4DA', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); lamp.scale.set(3, 3, 1); lamp.position.set(0, -.25, -2.75); jet.add(lamp);
  for (let i = 0; i < 18; i++) { const c = makeSoftCloud(rnd(30, 60), '#FFE0CC', '#C59A9A', .8); c.position.set(rnd(-320, 320), rnd(45, 110), rnd(-700, 120)); scene.add(c); }
  const camera = new THREE.PerspectiveCamera(50, 1, .1, 2000);

  const TD = 7, V = 30, zTD = ap.z0 - 25;   // chạm bánh ở giây thứ 7, ngay sau vạch ngưỡng
  const at = t => {
    const a = TD - t;
    if (a > 0) return { z: zTD + a * V, y: .9 + 1.6 * Math.pow(a, 1.2), pitch: .04 + .1 * Math.max(0, 1 - a / 1.5) };
    const b = Math.min(-a, V / 3.8); return { z: zTD - (V * b - 1.9 * b * b), y: .9, pitch: Math.max(0, .14 - b * .25) };
  };
  // các góc máy: [bắt đầu, kết thúc, đặt camera]
  const v3 = new THREE.Vector3();
  const shots = [
    [0, 3.2, p => { camera.position.set(-34, 10, 30); camera.fov = 38; camera.lookAt(p); }],
    [3.2, 5.8, p => { camera.position.set(p.x + 4, p.y + 1.8, p.z + 13); camera.fov = 55; camera.lookAt(p.x, p.y, p.z - 12); }],
    [5.8, 8.6, p => { camera.position.set(-22, 2.6, zTD - 24); camera.fov = 36; camera.lookAt(p); }],
    [8.6, 1e9, p => { camera.position.set(7, 2.2, zTD - 150); camera.fov = 30; camera.lookAt(p.x, p.y + .4, p.z); }],
  ];
  const puffs = [], ptex = cloudTex();
  let t = 0, touched = false, ended = false, shake = 0;
  return {
    scene, camera,
    update(dt) {
      t += dt;
      const s = at(t);
      jet.position.set(0, s.y, s.z); jet.rotation.set(s.pitch, 0, 0);
      jet.userData.strobe.forEach(m => { m.visible = Math.floor(t * 1.6) % 2 === 0; });
      if (!touched && t >= TD) {
        touched = true; shake = .35; onTouch();
        [-1.6, 1.6].forEach(x => { for (let i = 0; i < 4; i++) { const p = new THREE.Sprite(new THREE.SpriteMaterial({ map: ptex, color: '#D9D2CC', transparent: true, opacity: .7, depthWrite: false })); p.position.set(x + rnd(-.3, .3), .3, s.z + 1 + i * .6); p.userData.life = 1.6; scene.add(p); puffs.push(p); } });
      }
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i]; p.userData.life -= dt; const k = 1 - p.userData.life / 1.6;
        p.scale.setScalar(1 + k * 6); p.material.opacity = .7 * (1 - k); p.position.y += dt * .6;
        if (p.userData.life <= 0) { scene.remove(p); puffs.splice(i, 1); }
      }
      v3.set(0, s.y, s.z);
      shots.find(([a, b]) => t >= a && t < b)[2](v3);
      if (shake > 0) { shake -= dt; camera.position.y += rnd(-.06, .06); camera.position.x += rnd(-.06, .06); }
      camera.updateProjectionMatrix();
      if (!ended && t >= duration) { ended = true; onEnd(); }
    },
  };
};

/* ---------------- SÂN BAY (dùng cho cất cánh và hạ cánh) ---------------- */
function makeAirport() {
  const g = new THREE.Group();
  const ground = planeMesh(900, 900, std('#4F6A45', { roughness: 1, map: groundTex() })); ground.material.map.wrapS = ground.material.map.wrapT = THREE.RepeatWrapping; ground.material.map.repeat.set(5, 5); ground.rotation.x = -Math.PI / 2; g.add(ground);
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
