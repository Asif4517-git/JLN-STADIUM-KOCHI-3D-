/* =========================================================================
   CAMERA — drone flight, orbit, cinematic tour
   ========================================================================= */

const CAM = {
  pos: new THREE.Vector3(10, 64, 192),
  vel: new THREE.Vector3(),
  yaw: Math.PI * 0.02,
  pitch: -0.235,
  roll: 0,
  fov: 62,
  orbit: { theta: 0.9, phi: 0.95, dist: 320, tx: 0, ty: 14, tz: 0 },
  tour: { i: 0, t: 0, blend: 0 },
  speedBase: 26,
  dragging: false,
  lastX: 0, lastY: 0,
  pinchDist: 0,
  shake: 0,
  shot: ''
};

const keys = Object.create(null);
const DRONE_SPEED = 30;

addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyR') resetCamera();
  if (e.code === 'Digit1') setMode('drone');
  if (e.code === 'Digit2') setMode('orbit');
  if (e.code === 'Digit3') setMode('tour');
  if (e.code === 'KeyH') toggleHud();
  if (S.mode === 'tour' && ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyC', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    setMode('drone');
  }
  if (e.code === 'KeyN') { setHour(S.hour > 19 ? 17 : 20.2); }
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

/* look / drag */
canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  CAM.dragging = true;
  CAM.lastX = e.clientX; CAM.lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
  document.body.classList.add('grabbing');
});
canvas.addEventListener('pointermove', (e) => {
  if (!CAM.dragging) return;
  const dx = e.clientX - CAM.lastX, dy = e.clientY - CAM.lastY;
  CAM.lastX = e.clientX; CAM.lastY = e.clientY;
  const k = 0.0026;
  if (S.mode === 'drone') {
    CAM.yaw -= dx * k;
    CAM.pitch = clamp(CAM.pitch - dy * k, -1.45, 1.35);
  } else if (S.mode === 'orbit') {
    CAM.orbit.theta -= dx * k * 1.2;
    CAM.orbit.phi = clamp(CAM.orbit.phi - dy * k * 1.1, 0.12, 1.48);
  } else {
    CAM.yaw -= dx * k * 0.6;
  }
});
const endDrag = () => { CAM.dragging = false; document.body.classList.remove('grabbing'); };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (S.mode === 'orbit') {
    CAM.orbit.dist = clamp(CAM.orbit.dist * (1 + Math.sign(e.deltaY) * 0.09), 90, 800);
  } else {
    CAM.fov = clamp(CAM.fov + Math.sign(e.deltaY) * 2.5, 24, 88);
    camera.fov = CAM.fov; camera.updateProjectionMatrix();
  }
}, { passive: false });
canvas.addEventListener('dblclick', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
});

/* ------------------------- safety envelope ------------------------- */
function ovalRadiusAt(x, z) {
  // A such that the superellipse through (x,z) passes: |x/A|^n + |z/(A-off)|^n = 1
  let lo = 20, hi = 400;
  const n = 3.2, off = STAD.off;
  for (let i = 0; i < 34; i++) {
    const mid = (lo + hi) / 2;
    const v = Math.pow(Math.abs(x) / mid, n) + Math.pow(Math.abs(z) / (mid - off), n);
    if (v > 1) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
function deckHeight(A) {
  const s = STAD;
  if (A < s.A_in) return 0.12;
  if (A < s.lowerEndA) return s.y0 + (A - s.A_in) / s.lowerDepth * s.lowerRise;
  if (A < s.concEndA) return s.concY;
  if (A < s.topA) return s.concY + (A - s.concEndA) / s.upperDepth * s.upperRise;
  return s.backTop;
}
function minAltitude(x, z) {
  const A = ovalRadiusAt(x, z);
  if (A < STAD.A_in) return 1.65;
  if (A < STAD.topA) return deckHeight(A) + 2.2;
  if (A < 110) return 29.5;
  return 1.65;
}

/* ------------------------------ updating ------------------------------ */
const _v = new THREE.Vector3();
const _r = new THREE.Vector3();
const _f = new THREE.Vector3();

function updateDrone(dt, t) {
  const boost = keys.ShiftLeft || keys.ShiftRight ? 2.6 : 1;
  const speed = DRONE_SPEED * boost * (1 + CAM.fov / 200);

  _f.set(-Math.sin(CAM.yaw) * Math.cos(CAM.pitch), Math.sin(CAM.pitch), -Math.cos(CAM.yaw) * Math.cos(CAM.pitch));
  _r.set(Math.cos(CAM.yaw), 0, -Math.sin(CAM.yaw));

  _v.set(0, 0, 0);
  if (keys.KeyW || keys.ArrowUp) _v.add(_f);
  if (keys.KeyS || keys.ArrowDown) _v.sub(_f);
  if (keys.KeyD || keys.ArrowRight) _v.add(_r);
  if (keys.KeyA || keys.ArrowLeft) _v.sub(_r);
  if (keys.Space) _v.y += 1;
  if (keys.KeyC || keys.ControlLeft || keys.ControlRight) _v.y -= 1;

  if (_v.lengthSq() > 0) _v.normalize().multiplyScalar(speed);
  CAM.vel.x = damp(CAM.vel.x, _v.x, 4.2, dt);
  CAM.vel.y = damp(CAM.vel.y, _v.y, 4.2, dt);
  CAM.vel.z = damp(CAM.vel.z, _v.z, 4.2, dt);

  CAM.pos.addScaledVector(CAM.vel, dt);
  CAM.pos.x = clamp(CAM.pos.x, -900, 900);
  CAM.pos.z = clamp(CAM.pos.z, -900, 900);
  CAM.pos.y = clamp(CAM.pos.y, -20, 520);
  const minY = minAltitude(CAM.pos.x, CAM.pos.z);
  if (CAM.pos.y < minY) { CAM.pos.y = damp(CAM.pos.y, minY, 12, dt); if (CAM.pos.y < minY) CAM.pos.y = minY; }
  if (CAM.pos.y > 480) CAM.pos.y = damp(CAM.pos.y, 480, 3, dt);

  // gentle drone bob + bank into strafes
  const bobY = Math.sin(t * 1.6) * 0.06 + Math.sin(t * 0.73) * 0.05;
  const strafe = (CAM.vel.dot(_r)) / Math.max(1, speed);
  CAM.roll = damp(CAM.roll, -strafe * 0.09, 3.5, dt);
  const fwd = CAM.vel.dot(_f) / Math.max(1, speed);
  CAM.shake = damp(CAM.shake, clamp(Math.abs(fwd) * 0.5 + Math.abs(strafe) * 0.4, 0, 1), 3, dt);

  camera.position.copy(CAM.pos);
  camera.position.y += bobY;
  camera.rotation.set(
    CAM.pitch + Math.sin(t * 0.9) * 0.0016 + (Math.random() - 0.5) * 0.0012 * CAM.shake,
    CAM.yaw + Math.sin(t * 0.61) * 0.0016,
    CAM.roll
  );
}

function updateOrbit(dt, t) {
  const o = CAM.orbit;
  const x = o.tx + Math.cos(o.theta) * Math.sin(o.phi) * o.dist;
  const z = o.tz + Math.sin(o.theta) * Math.sin(o.phi) * o.dist;
  const y = o.ty + Math.cos(o.phi) * o.dist;
  CAM.pos.x = damp(CAM.pos.x, x, 3.4, dt);
  CAM.pos.y = damp(CAM.pos.y, Math.max(y, 8), 3.4, dt);
  CAM.pos.z = damp(CAM.pos.z, z, 3.4, dt);
  camera.position.copy(CAM.pos);
  camera.lookAt(o.tx, o.ty, o.tz);
  if (!CAM.dragging) o.theta += dt * 0.035;
}

/* ------------------------------- tour ------------------------------- */
const TOUR = [
  { p: [4, 105, 300], l: [0, 12, 0], d: 9.0, n: 'APPROACH · KALOOR' },
  { p: [128, 62, 190], l: [0, 12, 0], d: 8.0, n: 'SOUTH-EAST ORBIT' },
  { p: [166, 30, 28], l: [0, 20, 0], d: 7.5, n: 'ROOF LINE' },
  { p: [96, 12.5, 96], l: [0, 2, 0], d: 7.0, n: 'OVER THE BOWL' },
  { p: [-62, 3.6, 24], l: [52, 2.2, 0], d: 7.5, n: 'TOUCHLINE RUN' },
  { p: [-30, 2.2, -8], l: [0, 2.0, 0], d: 6.0, n: 'PITCH LEVEL' },
  { p: [0, 6, -46], l: [0, 20, -10], d: 6.5, n: 'NORTH STAND' },
  { p: [-88, 30, -52], l: [0, 18, 0], d: 7.0, n: 'FLOODLIGHT MAST' },
  { p: [0, 168, 330], l: [0, 0, 0], d: 9.0, n: 'KALOOR FROM ABOVE' }
];

function updateTour(dt, t) {
  const T = CAM.tour;
  const seg = TOUR[T.i];
  T.t += dt;
  const k = clamp(T.t / seg.d, 0, 1);
  const e = easeIO(k);
  const nxt = TOUR[(T.i + 1) % TOUR.length];
  const P = new THREE.Vector3().fromArray(seg.p);
  const N = new THREE.Vector3().fromArray(nxt.p);
  const L = new THREE.Vector3().fromArray(seg.l);
  const L2 = new THREE.Vector3().fromArray(nxt.l);

  // ease between the two keyframes across the last 12% of the segment
  const blend = smooth(clamp((k - 0.88) / 0.12, 0, 1));
  const pos = P.clone().lerp(N, blend * 0.15);
  const look = L.clone().lerp(L2, blend * 0.15);

  // subtle drift while dwelling
  pos.x += Math.sin(t * 0.23) * 1.4;
  pos.y += Math.sin(t * 0.31) * 0.8;
  pos.z += Math.cos(t * 0.19) * 1.4;

  CAM.pos.lerp(pos, 1 - Math.exp(-6 * dt));
  camera.position.copy(CAM.pos);
  const lookSmooth = new THREE.Vector3(look.x, look.y, look.z);
  camera.lookAt(lookSmooth);
  CAM.shot = seg.n;

  if (k >= 1) {
    T.i = (T.i + 1) % TOUR.length;
    T.t = 0;
  }
}

/* ------------------------------ switching ------------------------------ */
function setMode(m) {
  if (m === S.mode && S.ready) return;
  const prev = S.mode;
  S.mode = m;
  if (m === 'drone') {
    CAM.yaw = Math.atan2(-(camera.getWorldDirection(new THREE.Vector3()).x), -(camera.getWorldDirection(new THREE.Vector3()).z));
    const d = camera.getWorldDirection(new THREE.Vector3());
    CAM.pitch = Math.asin(clamp(d.y, -1, 1));
    CAM.pos.copy(camera.position);
    CAM.vel.set(0, 0, 0);
  }
  if (m === 'orbit') {
    const dx = camera.position.x, dz = camera.position.z;
    CAM.orbit.dist = Math.max(120, Math.hypot(dx, dz));
    CAM.orbit.theta = Math.atan2(dz, dx);
    CAM.orbit.phi = clamp(Math.acos(clamp((camera.position.y - 14) / CAM.orbit.dist, -0.9, 0.95)), 0.25, 1.4);
  }
  if (m === 'tour') { CAM.tour.i = 0; CAM.tour.t = 0; }
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  document.body.dataset.mode = m;
  if (typeof updateHints === 'function') updateHints();
  showToast(
    m === 'drone' ? 'DRONE POV — drag to look, WASD to fly, SPACE/C for altitude'
      : m === 'orbit' ? 'ORBIT — drag to rotate, scroll to zoom'
        : 'CINEMATIC TOUR — sit back, relax'
  );
}

function resetCamera() {
  const narrow = innerWidth / innerHeight < 0.85;
  CAM.pos.set(10, narrow ? 96 : 64, narrow ? 268 : 192);
  CAM.yaw = Math.PI * 0.02;
  CAM.pitch = -0.235;
  CAM.vel.set(0, 0, 0);
  CAM.fov = baseFov(); camera.fov = baseFov(); camera.updateProjectionMatrix();
  if (S.mode !== 'drone') setMode('drone');
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === 'drone'));
}

/* -------------------------- preset viewpoints -------------------------- */
const VIEWS = {
  drone:  { p: [10, 64, 192],   l: [0, 12, 0],   mode: 'drone' },
  aerial: { p: [0, 178, 322],   l: [0, 0, 0],    mode: 'drone' },
  roof:   { p: [126, 52, 118],  l: [0, 14, -6],  mode: 'drone' },
  pitch:  { p: [-34, 3.2, 24],  l: [40, 2.4, -6], mode: 'drone' },
  stand:  { p: [2, 17.5, 74],   l: [0, 1, -24],  mode: 'drone' },
  kaloor: { p: [214, 12, 236],  l: [10, 20, 0],  mode: 'drone' }
};
function setView(name) {
  const v = VIEWS[name];
  if (!v) return;
  if (S.mode !== v.mode) setMode(v.mode);
  const p = new THREE.Vector3().fromArray(v.p);
  const l = new THREE.Vector3().fromArray(v.l);
  CAM.pos.copy(p);
  CAM.vel.set(0, 0, 0);
  const d = l.clone().sub(p).normalize();
  CAM.yaw = Math.atan2(-d.x, -d.z);
  CAM.pitch = Math.asin(clamp(d.y, -1, 1));
  camera.position.copy(p);
  camera.rotation.set(CAM.pitch, CAM.yaw, 0);
  const names = { drone: 'Drone establishing shot', aerial: 'Stadium from above', roof: 'Roof canopy flyby', pitch: 'Pitch level', stand: 'South stand view', kaloor: 'Kaloor junction' };
  showToast(names[name] || name);
}

function updateCamera(dt, t) {
  if (S.mode === 'drone') updateDrone(dt, t);
  else if (S.mode === 'orbit') updateOrbit(dt, t);
  else updateTour(dt, t);
}
