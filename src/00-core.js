/* =========================================================================
   KALOOR — JAWAHARLAL NEHRU STADIUM, KOCHI
   Interactive drone-POV simulation  (three.js r149, fully self-contained)
   ========================================================================= */
'use strict';

const TAU  = Math.PI * 2;
const DEG  = Math.PI / 180;
const IS_TOUCH = matchMedia('(pointer: coarse)').matches;
const LOW_POWER = IS_TOUCH;
const DPR_CAP  = Math.min(window.devicePixelRatio || 1, LOW_POWER ? 1.35 : 1.6);
const Q = {
  seatSpacing: LOW_POWER ? 0.82 : 0.64,
  crowdScale: LOW_POWER ? 0.55 : 1,
  shadows: !LOW_POWER,
  shadowSize: LOW_POWER ? 1024 : 2048,
  aniso: LOW_POWER ? 4 : 16
};

/* ------------------------------- helpers ------------------------------- */
const clamp  = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp   = (a, b, t) => a + (b - a) * t;
const invLerp= (a, b, v) => (v - a) / (b - a);
const smooth = t => t * t * (3 - 2 * t);
const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const damp   = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20241107);

/* rounded-rectangle ("stadium") outline — superellipse */
function ovalPoint(t, A, B, n) {
  n = n || 3.2;
  const c = Math.cos(t), s = Math.sin(t);
  return [
    A * Math.sign(c) * Math.pow(Math.abs(c), 2 / n),
    B * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)
  ];
}
function ovalTangent(t, A, B, n) {
  const d = 0.002;
  const p1 = ovalPoint(t - d, A, B, n), p2 = ovalPoint(t + d, A, B, n);
  const dx = p2[0] - p1[0], dz = p2[1] - p1[1];
  const l = Math.hypot(dx, dz) || 1;
  return [dx / l, dz / l];
}

/* merge simple indexed geometries (position/normal/uv) */
function mergeGeoms(list) {
  let vCount = 0, iCount = 0;
  for (const g of list) { vCount += g.attributes.position.count; iCount += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(vCount * 3), nor = new Float32Array(vCount * 3), uv = new Float32Array(vCount * 2);
  const idx = new Uint32Array(iCount);
  let vo = 0, io = 0;
  for (const g of list) {
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      pos[(vo + i) * 3] = p.getX(i); pos[(vo + i) * 3 + 1] = p.getY(i); pos[(vo + i) * 3 + 2] = p.getZ(i);
      if (n) { nor[(vo + i) * 3] = n.getX(i); nor[(vo + i) * 3 + 1] = n.getY(i); nor[(vo + i) * 3 + 2] = n.getZ(i); }
      if (u) { uv[(vo + i) * 2] = u.getX(i); uv[(vo + i) * 2 + 1] = u.getY(i); }
    }
    if (g.index) {
      const gi = g.index;
      for (let i = 0; i < gi.count; i++) idx[io + i] = gi.getX(i) + vo;
      io += gi.count;
    } else {
      for (let i = 0; i < p.count; i++) idx[io + i] = i + vo;
      io += p.count;
    }
    vo += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}

/* ----------------------------- canvas utils ----------------------------- */
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function canvasTex(canvas, opts) {
  opts = opts || {};
  const t = new THREE.CanvasTexture(canvas);
  if (opts.srgb !== false) t.encoding = THREE.sRGBEncoding;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opts.repeat[0], opts.repeat[1]); }
  t.anisotropy = Math.min(Q.aniso, renderer.capabilities.getMaxAnisotropy());
  t.needsUpdate = true;
  return t;
}
function glowTexture(inner, outer) {
  const [c, x] = makeCanvas(128, 128);
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner || 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,.55)');
  g.addColorStop(1, outer || 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return canvasTex(c, { srgb: false });
}

/* ------------------------------- renderer ------------------------------- */
const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({
  canvas, antialias: true, powerPreference: 'high-performance',
  preserveDrawingBuffer: true, alpha: false
});
renderer.setPixelRatio(DPR_CAP);
renderer.setSize(innerWidth, innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.shadowMap.enabled = Q.shadows;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xc9d9e2, 520, 3000);

function baseFov() {
  const a = innerWidth / innerHeight;
  return a < 0.85 ? 78 : a < 1.15 ? 70 : 62;
}
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.35, 6000);
camera.rotation.order = 'YXZ';

const world = new THREE.Group();
scene.add(world);

/* --------------------------------- state -------------------------------- */
const glowTex = glowTexture();     // shared radial glow sprite
const EMISSIVE_NIGHT = [];   // {mat, max, color}
const AD_BOARDS = [];        // scrolling LED textures
const MATS = {};

const S = {
  hour: 17.25,          // 15:00 → 22:00
  mode: 'drone',        // drone | orbit | tour
  crowd: true,
  match: true,
  sound: false,
  hud: true,
  fov: 62,
  night: 0,
  ready: false,
  droneLight: 0,
  t: 0
};

/* --------------------------------- sky ---------------------------------- */
const skyUniforms = {
  uTop:     { value: new THREE.Color('#2a6aa8') },
  uHorizon: { value: new THREE.Color('#cfe0ea') },
  uBottom:  { value: new THREE.Color('#9aa885') },
  uSunDir:  { value: new THREE.Vector3(0.4, 0.4, 0.6) },
  uSunCol:  { value: new THREE.Color('#fff3dd') },
  uSunSize: { value: 1.0 },
  uNight:   { value: 0 }
};
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(3800, 44, 26),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: skyUniforms,
    vertexShader: `
      varying vec3 vDir;
      void main(){
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }`,
    fragmentShader: `
      uniform vec3 uTop, uHorizon, uBottom, uSunCol, uSunDir;
      uniform float uNight, uSunSize;
      varying vec3 vDir;
      void main(){
        float h = clamp(vDir.y*1.02, -1.0, 1.0);
        vec3 col;
        if (h > 0.0) col = mix(uHorizon, uTop, pow(h, 0.62));
        else col = mix(uHorizon, uBottom, pow(-h, 0.45));
        float sd = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
        col += uSunCol * pow(sd, 900.0) * 2.2;
        col += uSunCol * pow(sd, 18.0) * 0.16 * (1.0 - uNight*0.6);
        col += uSunCol * pow(sd, 3.0) * 0.05;
        gl_FragColor = vec4(col, 1.0);
      }`
  })
);
sky.renderOrder = -10;
scene.add(sky);

/* stars */
const starGeo = new THREE.BufferGeometry();
{
  const n = 1100, p = new Float32Array(n * 3), s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const th = rand() * TAU, ph = Math.acos(rand() * 0.92 + 0.04);
    const r = 3400;
    p[i * 3] = r * Math.sin(ph) * Math.cos(th);
    p[i * 3 + 1] = r * Math.cos(ph) * 0.92;
    p[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    s[i] = 0.6 + rand() * 1.9;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(s, 1));
}
const starMat = new THREE.PointsMaterial({
  color: 0xdfe9ff, size: 5.5, sizeAttenuation: true,
  transparent: true, opacity: 0, depthWrite: false, fog: false
});
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

/* clouds */
const cloudTex = (() => {
  const [c, x] = makeCanvas(512, 256);
  x.clearRect(0, 0, 512, 256);
  for (let i = 0; i < 30; i++) {
    const cx = 90 + rand() * 332, cy = 128 + (rand() - 0.5) * 52, r = 26 + rand() * 46;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(255,255,255,.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.beginPath(); x.ellipse(cx, cy, r * 2.1, r * 0.72, 0, 0, TAU); x.fill();
  }
  return canvasTex(c, { srgb: false });
})();
const cloudGroup = new THREE.Group();
for (let i = 0; i < 18; i++) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(420 + rand() * 520, 120 + rand() * 110),
    new THREE.MeshBasicMaterial({
      map: cloudTex, transparent: true, opacity: 0.20, depthWrite: false, fog: false,
      blending: THREE.AdditiveBlending, toneMapped: false
    })
  );
  const a = rand() * TAU, r = 1100 + rand() * 1300;
  m.position.set(Math.cos(a) * r, 230 + rand() * 260, Math.sin(a) * r);
  m.lookAt(0, m.position.y * 0.35, 0);
  cloudGroup.add(m);
}
scene.add(cloudGroup);

/* ------------------------------- lighting ------------------------------- */
const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x6f6d62, 0.55);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff2de, 2.4);
sun.castShadow = Q.shadows;
sun.shadow.mapSize.set(Q.shadowSize, Q.shadowSize);
sun.shadow.camera.near = 60;
sun.shadow.camera.far = 700;
sun.shadow.camera.left = -240;
sun.shadow.camera.right = 240;
sun.shadow.camera.top = 240;
sun.shadow.camera.bottom = -240;
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.9;
scene.add(sun);
scene.add(sun.target);

const moon = new THREE.DirectionalLight(0x94aee0, 0.0);
moon.position.set(-220, 190, -140);
scene.add(moon);

const ambient = new THREE.AmbientLight(0xb9c6d8, 0.18);
scene.add(ambient);

/* warm bounce from the floodlit pitch — night only */
const pitchGlow = new THREE.PointLight(0xdfeab4, 0, 260, 1.4);
pitchGlow.position.set(0, 16, 0);
scene.add(pitchGlow);
const standWash = new THREE.DirectionalLight(0xdfe7f2, 0);
standWash.position.set(0, 90, 30);
scene.add(standWash);

/* floodlight rigs get filled in later */
const floodLights = [];

/* ------------------------- time-of-day key frames ----------------------- */
const LIGHT_KEYS = [
  { h: 15.0, top: '#1f5f9e', hor: '#cfe2ec', bot: '#93a284', sun: '#fff8ea', sunI: 3.0, hemi: 0.42, amb: 0.10, exp: 0.98, fog: '#b9cdd8', star: 0.0 },
  { h: 16.6, top: '#205c96', hor: '#ecd6b2', bot: '#958f70', sun: '#ffe7bd', sunI: 2.9, hemi: 0.44, amb: 0.15, exp: 1.00, fog: '#d3cfb6', star: 0.0 },
  { h: 17.5, top: '#1c5083', hor: '#f5ab6d', bot: '#8a8266', sun: '#ffb877', sunI: 2.75, hemi: 0.37, amb: 0.14, exp: 1.0, fog: '#c9a184', star: 0.0 },
  { h: 18.25, top: '#16233f', hor: '#d9693c', bot: '#45443e', sun: '#ff8f4f', sunI: 0.7, hemi: 0.19, amb: 0.09, exp: 1.04, fog: '#7d6058', star: 0.2 },
  { h: 19.1, top: '#060e1b', hor: '#20304c', bot: '#101519', sun: '#8fa6cc', sunI: 0.05, hemi: 0.085, amb: 0.045, exp: 1.02, fog: '#1a2434', star: 0.85 },
  { h: 22.0, top: '#02050b', hor: '#0e1626', bot: '#080b10', sun: '#7d93c0', sunI: 0.03, hemi: 0.08, amb: 0.04, exp: 1.04, fog: '#0c1220', star: 1.0 }
];

function updateSky(hour) {
  S.hour = hour;
  let a = LIGHT_KEYS[0], b = LIGHT_KEYS[LIGHT_KEYS.length - 1];
  for (let i = 0; i < LIGHT_KEYS.length - 1; i++) {
    if (hour >= LIGHT_KEYS[i].h && hour <= LIGHT_KEYS[i + 1].h) { a = LIGHT_KEYS[i]; b = LIGHT_KEYS[i + 1]; break; }
  }
  const t = smooth(clamp(invLerp(a.h, b.h, hour), 0, 1));
  const C = (k) => new THREE.Color(a[k]).lerp(new THREE.Color(b[k]), t);

  skyUniforms.uTop.value.copy(C('top'));
  skyUniforms.uHorizon.value.copy(C('hor'));
  skyUniforms.uBottom.value.copy(C('bot'));
  skyUniforms.uSunCol.value.copy(C('sun'));
  starMat.opacity = lerp(a.star, b.star, t);
  stars.visible = starMat.opacity > 0.02;

  sun.color.copy(C('sun'));
  sun.intensity = lerp(a.sunI, b.sunI, t);
  hemi.intensity = lerp(a.hemi, b.hemi, t);
  ambient.intensity = lerp(a.amb, b.amb, t);
  scene.fog.color.copy(C('fog'));
  renderer.toneMappingExposure = lerp(a.exp, b.exp, t);

  // sun position: sweeps W and dips below horizon at ~18.2
  const elev = clamp((18.2 - hour) * 12.5, -9, 66) * DEG;
  const azim = (255 + (hour - 17.0) * 16) * DEG;
  const dir = new THREE.Vector3(
    Math.sin(azim) * Math.cos(elev),
    Math.sin(elev),
    Math.cos(azim) * Math.cos(elev)
  );
  skyUniforms.uSunDir.value.copy(dir);
  sun.position.copy(dir).multiplyScalar(420);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = elev > 1.5 * DEG;

  // night factor & floodlights
  S.night = clamp((hour - 17.9) / 1.2, 0, 1);
  const floodOn = smooth(clamp((hour - 17.55) / 0.7, 0, 1));
  S.flood = floodOn;
  for (const f of floodLights) {
    f.spot.intensity = 0.8 * floodOn;
    f.panelMat.emissiveIntensity = 0.15 + 2.6 * floodOn;
    f.cone.material.opacity = 0.055 * floodOn;
    f.glow.material.opacity = 0.9 * floodOn;
  }
  moon.intensity = 0.16 * S.night;
  pitchGlow.intensity = 0.35 * S.night;
  standWash.intensity = 0.10 * S.night;
  if (typeof onHourChanged === 'function') onHourChanged(hour);
}

/* resize */
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.fov = baseFov();
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LOW_POWER ? 1.35 : 1.6));
});

/* clock */
const clock = new THREE.Clock();
