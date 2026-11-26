// Chibi Cao Cường – vẽ bằng SVG, dùng cho DOM (có hoạt ảnh CSS) và làm texture cho cảnh 3D.
// Đặc điểm lấy từ ảnh thật: tóc đen vuốt cao lệch sang phải, mặt trái xoan, da ngăm sáng, khuyên tai trái.

const SKIN = '#EDB98F', SKIN_SH = '#D99D72', HAIR = '#17171F', HAIR_HI = '#3B3B4D';

const OUTFITS = {
  // nhân viên check-in hãng bay: vest navy, khăn cam
  agent: { body: '#0E2A5C', trim: '#FF8000', shirt: '#FFFFFF', badge: 'wing', hat: null, tag: 'TXCC2026' },
  // hải quan: áo xanh, cầu vai vàng, mũ kê-pi
  customs: { body: '#1E4FA8', trim: '#E9B949', shirt: '#DCE8FF', badge: 'star', hat: 'officer', tag: 'HẢI QUAN' },
  // lễ tân TR007: sơ mi trắng, gile nâu, nơ
  reception: { body: '#6B4226', trim: '#D9823B', shirt: '#FFFFFF', badge: 'bow', hat: null, tag: 'TR007' },
  // hướng dẫn viên: áo Đoàn
  guide: { body: '#1F5BC4', trim: '#E53935', shirt: '#1F5BC4', badge: 'doan', hat: null, tag: 'CƯỜNG' },
  // phi công
  pilot: { body: '#10203F', trim: '#E9B949', shirt: '#FFFFFF', badge: 'wing', hat: 'pilot', tag: 'CAPTAIN' },
};

function hat(kind) {
  if (kind === 'officer') return `
    <path d="M42 70 Q100 10 158 70 L156 80 Q100 66 44 80 Z" fill="#14244A"/>
    <path d="M44 78 Q100 64 156 78 L156 88 Q100 76 44 88 Z" fill="#E9B949"/>
    <path d="M58 86 Q100 104 142 86 Q120 98 100 98 Q80 98 58 86Z" fill="#0A1430"/>
    <circle cx="100" cy="56" r="10" fill="#E9B949"/><path d="M100 49 l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z" fill="#14244A"/>`;
  if (kind === 'pilot') return `
    <path d="M40 72 Q100 16 160 72 L158 82 Q100 70 42 82 Z" fill="#fff"/>
    <path d="M42 80 Q100 68 158 80 L158 90 Q100 78 42 90 Z" fill="#10203F"/>
    <path d="M58 88 Q100 106 142 88 Q120 100 100 100 Q80 100 58 88Z" fill="#0A1430"/>
    <path d="M86 58 h28 l-4 8 h-20z" fill="#E9B949"/>`;
  return '';
}

function badge(o) {
  switch (o.badge) {
    case 'wing': return `<path d="M114 196 q10-6 22-2 q-6 6-22 4z M114 196 q-2 4 0 6" fill="#E9B949"/><circle cx="114" cy="197" r="3" fill="#E9B949"/>`;
    case 'star': return `<rect x="46" y="176" width="22" height="7" rx="3" fill="${o.trim}"/><rect x="132" y="176" width="22" height="7" rx="3" fill="${o.trim}"/><path d="M124 196 l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z" fill="${o.trim}"/>`;
    case 'bow': return `<path d="M88 172 l12 6 12-6 v14 l-12-6-12 6z" fill="#2B1A10"/><circle cx="100" cy="179" r="3" fill="#D9823B"/>`;
    case 'doan': return `<circle cx="124" cy="200" r="8" fill="#E53935"/><path d="M124 194 l1.8 3.8 4.2.6-3 2.9.7 4.1-3.7-2-3.7 2 .7-4.1-3-2.9 4.2-.6z" fill="#FFD54F"/>`;
  }
  return '';
}

export function chibiSVG(kind = 'guide', { talk = false, blink = false, wave = false } = {}) {
  const o = OUTFITS[kind] || OUTFITS.guide;
  const vest = kind === 'reception';
  const eyes = blink
    ? `<path d="M72 112 q8 5 16 0" stroke="#2A1D18" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M112 112 q8 5 16 0" stroke="#2A1D18" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
    : `<g class="ch-eyes"><ellipse cx="80" cy="111" rx="7.5" ry="9.5" fill="#2A1D18"/><ellipse cx="120" cy="111" rx="7.5" ry="9.5" fill="#2A1D18"/>
       <circle cx="77.5" cy="107" r="2.8" fill="#fff"/><circle cx="117.5" cy="107" r="2.8" fill="#fff"/><circle cx="82" cy="114" r="1.2" fill="#fff"/><circle cx="122" cy="114" r="1.2" fill="#fff"/></g>`;
  const mouthClosed = `<path d="M88 134 Q100 145 112 134" stroke="#7A3B2A" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
  const mouthOpen = `<path d="M89 132 Q100 150 111 132 Z" fill="#7A2A22"/><path d="M93 140 Q100 146 107 140 Q100 137 93 140Z" fill="#E57373"/>`;
  const mouth = talk ? mouthOpen : `<g class="ch-m-closed">${mouthClosed}</g><g class="ch-m-open">${mouthOpen}</g>`;
  const armR = wave
    ? `<g class="ch-wave" style="transform-origin:150px 196px"><path d="M146 196 Q176 176 182 146" stroke="${o.body}" stroke-width="20" stroke-linecap="round" fill="none"/><circle cx="183" cy="140" r="11" fill="${SKIN}"/></g>`
    : `<path d="M150 200 Q168 214 166 236" stroke="${o.body}" stroke-width="20" stroke-linecap="round" fill="none"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -14 200 254" class="chibi-svg">
  <!-- thân -->
  <path d="M100 254 L36 254 C36 204 60 172 100 170 C140 172 164 204 164 254 Z" fill="${vest ? o.shirt : o.body}"/>
  ${vest ? `<path d="M52 254 C52 214 66 186 88 176 L100 206 L112 176 C134 186 148 214 148 254Z" fill="${o.body}"/>` : ''}
  <path d="M84 168 L100 196 L116 168 Z" fill="${o.shirt}"/>
  ${kind === 'agent' ? `<path d="M90 172 L100 188 L110 172 L106 204 L100 212 L94 204Z" fill="${o.trim}"/>` : ''}
  ${kind === 'guide' ? `<path d="M80 166 L100 186 L120 166 L116 176 L100 192 L84 176Z" fill="#174AA6"/>` : ''}
  ${kind === 'pilot' ? `<path d="M96 176 h8 l3 28 -7 6 -7-6z" fill="#10203F"/><rect x="40" y="226" width="120" height="5" fill="${o.trim}"/>` : ''}
  ${badge(o)}
  <rect x="64" y="208" width="34" height="11" rx="3" fill="#fff" opacity=".92"/><text x="81" y="216.5" font-family="Arial,sans-serif" font-size="7" font-weight="700" text-anchor="middle" fill="#0B1F4D">${o.tag}</text>
  <path d="M50 200 Q32 214 34 236" stroke="${vest ? o.shirt : o.body}" stroke-width="20" stroke-linecap="round" fill="none"/>
  ${armR}
  <!-- cổ + đầu -->
  <rect x="88" y="150" width="24" height="24" rx="8" fill="${SKIN_SH}"/>
  <ellipse cx="44" cy="112" rx="10" ry="13" fill="${SKIN}"/><ellipse cx="156" cy="112" rx="10" ry="13" fill="${SKIN}"/>
  <circle cx="42" cy="125" r="3.2" fill="#1a1a1a"/>
  <ellipse cx="100" cy="106" rx="57" ry="56" fill="${SKIN}"/>
  <path d="M46 120 Q60 158 100 162 Q140 158 154 120 Q150 150 100 160 Q52 150 46 120Z" fill="${SKIN_SH}" opacity=".45"/>
  <!-- tóc vuốt -->
  <path d="M42 104 C36 58 64 30 104 30 C142 28 166 52 160 100 C152 80 140 68 122 64 C106 70 84 68 66 74 C56 82 48 92 42 104Z" fill="${HAIR}"/>
  ${o.hat ? '' : `<path d="M62 52 C66 14 112 2 148 18 C136 18 128 22 122 28 C142 22 164 32 170 52 C156 44 136 44 122 52 C110 46 84 44 62 52Z" fill="${HAIR}"/>
  <path d="M82 34 C96 18 124 14 142 22" stroke="${HAIR_HI}" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M120 40 C134 36 150 40 160 50" stroke="${HAIR_HI}" stroke-width="3" fill="none" stroke-linecap="round"/>`}
  <path d="M42 104 C42 92 44 84 48 78 L50 104Z" fill="${HAIR}"/><path d="M158 102 C158 92 156 84 152 78 L150 102Z" fill="${HAIR}"/>
  ${hat(o.hat)}
  <!-- mặt -->
  <path d="M68 96 Q80 89 92 94" stroke="#1A1414" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M108 94 Q120 89 132 96" stroke="#1A1414" stroke-width="5" fill="none" stroke-linecap="round"/>
  ${eyes}
  <path d="M98 120 q3 4 6 0" stroke="${SKIN_SH}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="68" cy="128" rx="9" ry="5" fill="#F48FB1" opacity=".35"/><ellipse cx="132" cy="128" rx="9" ry="5" fill="#F48FB1" opacity=".35"/>
  ${mouth}
</svg>`;
}

// Gắn chibi động vào một phần tử DOM
export function mountChibi(el, kind, { wave = false } = {}) {
  el.classList.add('chibi');
  el.innerHTML = chibiSVG(kind, { wave });
  return {
    talk(on) { el.classList.toggle('talking', on); },
  };
}

// Tạo 3 texture (thường / nói / chớp mắt) cho cảnh Three.js
export async function chibiTextures(THREE, kind) {
  const blank = () => { const c = document.createElement('canvas'); c.width = c.height = 4; return new THREE.CanvasTexture(c); };
  const load = svg => new Promise(res => {
    const img = new Image();
    const to = setTimeout(() => res(blank()), 4000);
    img.onerror = () => { clearTimeout(to); res(blank()); };
    img.onload = () => {
      clearTimeout(to);
      const c = document.createElement('canvas'); c.width = 400; c.height = 508;
      c.getContext('2d').drawImage(img, 0, 0, 400, 508);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; res(t);
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  const [normal, talk, blink] = await Promise.all([
    load(chibiSVG(kind, { wave: true })), load(chibiSVG(kind, { talk: true, wave: true })), load(chibiSVG(kind, { blink: true, wave: true })),
  ]);
  return { normal, talk, blink };
}
