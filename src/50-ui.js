/* =========================================================================
   UI — HUD, minimap, compass, audio, controls wiring
   ========================================================================= */

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

let toastTimer = 0;
function showToast(msg, ms) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms || 3200);
}

function toggleHud() {
  document.body.classList.toggle('nohud');
  const hidden = document.body.classList.contains('nohud');
  showToast(hidden ? 'UI hidden — press H to bring it back' : 'UI restored');
}

function fmtHour(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return String(hh).padStart(2, '0') + ':' + String(mm === 60 ? 0 : mm).padStart(2, '0');
}

function setHour(h) {
  h = clamp(h, 15, 22);
  const slider = $('#timeSlider');
  if (slider) slider.value = h;
  const lbl = $('#timeLabel');
  if (lbl) lbl.textContent = fmtHour(h);
  $$('.presets button').forEach(b => b.classList.toggle('on', Math.abs(parseFloat(b.dataset.hour) - h) < 0.35));
  updateSky(h);
}
function onHourChanged(h) {
  const lbl = $('#timeLabel');
  if (lbl) lbl.textContent = fmtHour(h);
  // night emissives
  for (const e of EMISSIVE_NIGHT) {
    if (e.keepColor) {
      e.mat.emissiveIntensity = e.max * S.night;
    } else {
      if (!e._set) { e.mat.emissive.setHex(e.color); e._set = true; }
      e.mat.emissiveIntensity = 0.02 + e.max * S.night;
    }
  }
  if (MATS.metroWindow) MATS.metroWindow.emissiveIntensity = 1.3 * S.night;
  if (MATS.city) MATS.city.emissiveIntensity = 0.2 * S.night;
  for (const g of nightGlow) g.obj.material.opacity = g.base * S.night;
  if (S.ready && typeof updateTimeChip === 'function') updateTimeChip(h);
}

/* ------------------------------ loader ------------------------------ */
function setLoad(pct, step) {
  const bar = $('#loadBar');
  if (bar) bar.style.width = pct + '%';
  const s = $('#loadStep');
  if (s && step) s.textContent = step;
}

/* ------------------------------- HUD ------------------------------- */
const compassCtx = $('#compassCanvas').getContext('2d');
function drawCompass(heading) {
  const c = compassCtx, W = 720, H = 68;
  c.clearRect(0, 0, W, H);
  c.save();
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const pxPerDeg = 6;
  for (let a = 0; a < 360; a += 5) {
    let dx = ((a - heading + 540) % 360) - 180;
    const x = W / 2 + dx * pxPerDeg;
    if (x < -20 || x > W + 20) continue;
    const major = a % 45 === 0;
    const card = a % 90 === 0;
    c.strokeStyle = card ? 'rgba(255,210,31,.9)' : major ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.18)';
    c.lineWidth = card ? 2 : 1;
    c.beginPath();
    c.moveTo(x, card ? 40 : 46);
    c.lineTo(x, 56);
    c.stroke();
    if (card) {
      const names = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
      c.fillStyle = '#ffd21f';
      c.font = '600 19px ui-sans-serif, system-ui';
      c.fillText(names[a], x, 26);
    } else if (a % 15 === 0) {
      c.fillStyle = 'rgba(255,255,255,.5)';
      c.font = '500 13px ui-sans-serif, system-ui';
      c.fillText(String(a), x, 30);
    }
  }
  // center pointer
  c.fillStyle = '#fff';
  c.beginPath(); c.moveTo(W / 2, 2); c.lineTo(W / 2 - 7, 13); c.lineTo(W / 2 + 7, 13); c.closePath(); c.fill();
  c.restore();
}

const mapCtx = $('#minimap').getContext('2d');
function drawMinimap() {
  const c = mapCtx, W = 372, H = 280;
  const R = 240;                 // metres shown from centre
  const sc = Math.min(W, H) / (R * 2);
  const cx = W / 2, cz = H / 2;
  const px = (x) => cx + x * sc;
  const pz = (z) => cz + z * sc;

  c.clearRect(0, 0, W, H);
  c.fillStyle = '#0b1116';
  c.fillRect(0, 0, W, H);
  // grid
  c.strokeStyle = 'rgba(255,255,255,.045)';
  c.lineWidth = 1;
  for (let g = -R; g <= R; g += 40) {
    c.beginPath(); c.moveTo(px(g), 0); c.lineTo(px(g), H); c.stroke();
    c.beginPath(); c.moveTo(0, pz(g)); c.lineTo(W, pz(g)); c.stroke();
  }
  // ring road
  c.strokeStyle = 'rgba(255,255,255,.14)';
  c.lineWidth = 5;
  ovalPath(c, 133, 113, px, pz); c.stroke();
  // metro
  c.strokeStyle = 'rgba(90,170,220,.55)';
  c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(px(196), 0); c.lineTo(px(196), H); c.stroke();
  // stadium footprint
  c.fillStyle = 'rgba(255,210,31,.10)';
  ovalPath(c, 111, 91, px, pz); c.fill();
  c.strokeStyle = 'rgba(255,210,31,.75)';
  c.lineWidth = 2;
  ovalPath(c, 111, 91, px, pz); c.stroke();
  ovalPath(c, 68, 48, px, pz); c.stroke();
  // pitch
  c.fillStyle = 'rgba(47,150,70,.75)';
  c.fillRect(px(-52.5), pz(-34), 105 * sc, 68 * sc);
  c.strokeStyle = 'rgba(255,255,255,.55)';
  c.lineWidth = 1;
  c.strokeRect(px(-52.5), pz(-34), 105 * sc, 68 * sc);
  c.beginPath(); c.moveTo(px(0), pz(-34)); c.lineTo(px(0), pz(34)); c.stroke();
  c.beginPath(); c.arc(px(0), pz(0), 9.15 * sc, 0, TAU); c.stroke();

  // camera + view cone
  const cxp = px(camera.position.x), czp = pz(camera.position.z);
  const dir = camera.getWorldDirection(new THREE.Vector3());
  const ang = Math.atan2(dir.z, dir.x);
  const fov = camera.fov * DEG;
  const grad = c.createRadialGradient(cxp, czp, 0, cxp, czp, 70);
  grad.addColorStop(0, 'rgba(255,210,31,.42)');
  grad.addColorStop(1, 'rgba(255,210,31,0)');
  c.fillStyle = grad;
  c.beginPath();
  c.moveTo(cxp, czp);
  c.arc(cxp, czp, 70, ang - fov / 2, ang + fov / 2);
  c.closePath();
  c.fill();
  c.fillStyle = '#ffd21f';
  c.beginPath(); c.arc(cxp, czp, 4.5, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,210,31,.9)'; c.lineWidth = 1.5;
  c.beginPath(); c.arc(cxp, czp, 8, 0, TAU); c.stroke();

  // north marker
  c.fillStyle = 'rgba(255,255,255,.55)';
  c.font = '600 12px ui-monospace, monospace';
  c.fillText('N', 10, 18);
  const co = $('#mapCoord');
  if (co) co.textContent = ((camera.position.x / 100).toFixed(1)) + ' / ' + ((camera.position.z / 100).toFixed(1));
}
function ovalPath(c, A, B, px, pz) {
  c.beginPath();
  for (let i = 0; i <= 90; i++) {
    const t = i / 90 * TAU;
    const [x, z] = ovalPoint(t, A, B);
    if (i === 0) c.moveTo(px(x), pz(z)); else c.lineTo(px(x), pz(z));
  }
  c.closePath();
}

/* ------------------------------- audio ------------------------------- */
let audioCtx = null, crowdGain = null, crowdFilter = null;
function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const sr = audioCtx.sampleRate;
  const buf = audioCtx.createBuffer(1, sr * 5, sr);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buf; src.loop = true;
  crowdFilter = audioCtx.createBiquadFilter();
  crowdFilter.type = 'bandpass';
  crowdFilter.frequency.value = 620;
  crowdFilter.Q.value = 0.55;
  const hp = audioCtx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 180;
  crowdGain = audioCtx.createGain();
  crowdGain.gain.value = 0.0;
  src.connect(crowdFilter).connect(hp).connect(crowdGain).connect(audioCtx.destination);
  src.start();

  // slow swell LFO
  const lfo = audioCtx.createOscillator();
  lfo.frequency.value = 0.055;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 0.022;
  lfo.connect(lfoGain).connect(crowdGain.gain);
  lfo.start();
}
function setSound(on) {
  S.sound = on;
  try {
    if (on) {
      initAudio();
      audioCtx.resume();
      crowdGain.gain.cancelScheduledValues(audioCtx.currentTime);
      crowdGain.gain.linearRampToValueAtTime(0.085, audioCtx.currentTime + 1.2);
    } else if (crowdGain) {
      crowdGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 0.5);
    }
  } catch (e) { /* audio unavailable */ }
}

/* ----------------------------- wiring ----------------------------- */
function initUI() {
  $$('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  $('#timeSlider').addEventListener('input', (e) => setHour(parseFloat(e.target.value)));
  $$('.presets button').forEach(b => b.addEventListener('click', () => {
    setHour(parseFloat(b.dataset.hour));
    showToast(b.textContent.toUpperCase() + ' LIGHTING · ' + fmtHour(parseFloat(b.dataset.hour)));
  }));

  $('#tCrowd').addEventListener('click', (e) => {
    S.crowd = !S.crowd;
    if (typeof setCrowdVisible === 'function') setCrowdVisible(S.crowd);
    else if (crowdMesh) crowdMesh.visible = S.crowd;
    e.currentTarget.classList.toggle('on', S.crowd);
    showToast(S.crowd ? 'Crowd on — 12,000 of the Manjappada in the house' : 'Crowd off — empty stadium');
  });
  $('#tMatch').addEventListener('click', (e) => {
    S.match = !S.match;
    players.forEach(p => p.obj.visible = S.match);
    if (ball) ball.visible = S.match;
    if (typeof ballShadow !== 'undefined' && ballShadow) ballShadow.visible = S.match;
    e.currentTarget.classList.toggle('on', S.match);
    showToast(S.match ? 'Match on — Blasters vs Mohun Bagan' : 'Match paused');
  });
  $('#tSound').addEventListener('click', (e) => {
    setSound(!S.sound);
    e.currentTarget.classList.toggle('on', S.sound);
    showToast(S.sound ? 'Stadium ambience on' : 'Muted');
  });
  $('#tGfx').addEventListener('click', (e) => {
    const hd = !e.currentTarget.classList.contains('on');
    e.currentTarget.classList.toggle('on', hd);
    renderer.setPixelRatio(hd ? DPR_CAP : 1);
    renderer.shadowMap.enabled = hd;
    sun.castShadow = hd;
    scene.traverse(o => { if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => m.needsUpdate = true); } });
    if (typeof perf !== 'undefined') {
      perf.level = hd ? 0 : 2;
      perf.acc = 0; perf.frames = 0;
      if (crowdMesh) crowdMesh.count = hd ? crowdMesh.instanceMatrix.count : Math.floor(crowdMesh.instanceMatrix.count * 0.4);
    }
    e.currentTarget.querySelector('.lbl').textContent = hd ? 'HD' : 'Lite';
    showToast(hd ? 'High quality' : 'Performance mode');
  });

  $$('.vbtn-row button').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));

  const info = $('#infoPanel');
  $('#bInfo').addEventListener('click', () => info.classList.toggle('hidden'));
  $('#infoClose').addEventListener('click', () => info.classList.add('hidden'));
  document.addEventListener('keydown', (e) => { if (e.code === 'Escape') info.classList.add('hidden'); });

  $('#bReset').addEventListener('click', resetCamera);
  $('#bHud').addEventListener('click', toggleHud);
  $('#bFull').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
  });
  $('#bShot').addEventListener('click', () => {
    document.body.classList.add('shotmode');
    renderer.render(scene, camera);
    const url = renderer.domElement.toDataURL('image/png');
    document.body.classList.remove('shotmode');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kaloor-stadium-' + Date.now() + '.png';
    a.click();
    showToast('Screenshot saved');
  });

  updateHints();
  collapseHints(11000);

  // touch d-pad
  if (IS_TOUCH) document.body.classList.add('touch');
  $$('#touchpad button').forEach(b => {
    const code = b.dataset.key;
    const on = (e) => { e.preventDefault(); keys[code] = true; };
    const off = (e) => { e.preventDefault(); keys[code] = false; };
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off);
    b.addEventListener('pointerleave', off);
    b.addEventListener('pointercancel', off);
  });
}

/* --------------------------- per-frame HUD --------------------------- */
let hudTick = 0;
const _prevCamPos = new THREE.Vector3();
const _hintWrap = $('#hint');
let hintCollapsed = false;
function updateHints() {
  if (hintCollapsed || !_hintWrap) return;
  const mode = S.mode;
  let html;
  if (mode === 'drone') html = '<span>MOVE</span><b>W A S D</b><span>LOOK</span><b>DRAG</b><span>ALTITUDE</span><b>SPACE / C</b><span>BOOST</span><b>SHIFT</b><span>UI</span><b>H</b>';
  else if (mode === 'orbit') html = '<span>ROTATE</span><b>DRAG</b><span>ZOOM</span><b>SCROLL</b><span>BACK</span><b>1</b><span>UI</span><b>H</b>';
  else html = '<span>CINEMATIC TOUR</span><b>AUTO</b><span>TAKE OVER</span><b>1</b><span>UI</span><b>H</b>';
  _hintWrap.innerHTML = html;
}
function collapseHints(delay) {
  setTimeout(() => {
    hintCollapsed = true;
    if (_hintWrap) {
      _hintWrap.style.transition = 'opacity .8s, transform .8s';
      _hintWrap.style.transform = 'translate(-50%, 8px)';
      _hintWrap.style.opacity = '0';
    }
  }, delay || 9000);
}
function updateHUD(dt) {
  hudTick++;
  const dir = camera.getWorldDirection(new THREE.Vector3());
  const heading = ((-Math.atan2(-dir.x, -dir.z)) * 180 / Math.PI + 360) % 360;
  const spd = _prevCamPos.lengthSq() ? _prevCamPos.distanceTo(camera.position) / Math.max(dt, 0.001) : 0;
  _prevCamPos.copy(camera.position);

  if (hudTick % 2 === 0) {
    const alt = Math.max(0, camera.position.y);
    $('#tAlt').textContent = alt.toFixed(0);
    $('#tAltBar').style.width = clamp(alt / 320 * 100, 0, 100) + '%';
    $('#tSpd').textContent = spd.toFixed(0);
    $('#tSpdBar').style.width = clamp(spd / 80 * 100, 0, 100) + '%';
    $('#tHdg').textContent = String(Math.round(heading) % 360).padStart(3, '0');
    drawCompass(heading);
  }
  if (hudTick % 3 === 0) drawMinimap();

  const lbl = $('#shotLabel');
  if (S.mode === 'tour') {
    lbl.textContent = CAM.shot;
    lbl.classList.add('show');
  } else {
    lbl.classList.remove('show');
  }
}
