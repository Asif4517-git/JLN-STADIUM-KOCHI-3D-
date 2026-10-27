/* =========================================================================
   BOOT + RENDER LOOP
   ========================================================================= */

const nextFrame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));

const BUILD_STEPS = [
  ['Surveying Kaloor from OpenStreetMap', () => buildGround()],
  ['Laying the ring road & approaches', () => { buildLand(); buildWater(); buildRoads(); }],
  ['Raising the real Kochi skyline', () => buildBuildings()],
  ['Running the metro viaduct', () => buildMetro()],
  ['Planting palms along the avenues', () => buildPalms()],
  ['Street lighting & road signs', () => { buildStreetLamps(); buildRoadSigns(); }],
  ['Parking the Kaloor traffic', () => buildCars()],
  ['Laying the forecourt', () => { buildForecourt(); buildHorizon(); }],
  ['Pouring the bowl', () => { buildApron(); buildBowl(); }],
  ['Facade & structural fins', () => buildFacade()],
  ['Tensioning the membrane roof', () => buildRoof()],
  ['Erecting floodlight masts', () => buildFloodlights()],
  ['Rolling out the pitch', () => { buildPitch(); buildPitchFurniture(); }],
  ['Installing the big screen', () => buildScreen()],
  ['Hanging the Manjappada banners', () => buildBanners()],
  ['Filling the stands', () => { buildCrowd(); buildPlayers(); }],
  ['Suspending pitch dust', () => buildDust()],
  ['Setting the Kochi sky', () => { updateSky(S.hour); updateMatchScreen(true); }]
];

async function boot() {
  if (!renderer) throw new Error('WebGL is not available in this browser.');
  setLoad(2, 'Loading Malayalam & club type');
  try { await registerFonts(); } catch (e) { console.warn('fonts', e); }
  const total = BUILD_STEPS.length;
  for (let i = 0; i < total; i++) {
    const [label, fn] = BUILD_STEPS[i];
    setLoad(Math.round((i / total) * 100), label);
    await nextFrame();
    fn();
  }
  setLoad(100, 'Ready for take-off');
  await nextFrame();

  const narrow = innerWidth / innerHeight < 0.85;
  if (narrow) CAM.pos.set(10, 96, 272);
  camera.position.copy(CAM.pos);
  camera.lookAt(0, 12, 0);
  const d0 = new THREE.Vector3(0, 12, 0).sub(CAM.pos).normalize();
  CAM.yaw = Math.atan2(-d0.x, -d0.z);
  CAM.pitch = Math.asin(clamp(d0.y, -1, 1));
  CAM.fov = baseFov();
  camera.fov = CAM.fov;
  camera.updateProjectionMatrix();

  initUI();
  setHour(S.hour);
  S.ready = true;
  drawMinimap();
  drawCompass(0);

  await new Promise(r => setTimeout(r, 420));
  $('#loader').classList.add('hide');
  setTimeout(() => showToast('Kaloor Stadium · drag to look, WASD to fly', 4200), 900);

  clock.start();
  requestAnimationFrame(loop);
}

/* --------------------------- adaptive quality --------------------------- */
const perf = { frames: 0, acc: 0, level: 0 };
function adaptQuality(dt) {
  if (!S.ready || S.bench) return;
  perf.frames++; perf.acc += dt;
  if (perf.acc < 2.4) return;
  const fps = perf.frames / perf.acc;
  perf.frames = 0; perf.acc = 0;
  if (fps < 26 && perf.level < 2) {
    perf.level++;
    if (perf.level === 1) {
      renderer.setPixelRatio(1);
      applyCrowdCount(crowdFullCount * 0.6);
    } else {
      renderer.shadowMap.enabled = false;
      sun.castShadow = false;
      applyCrowdCount(crowdFullCount * 0.42);
    }
  } else if (fps > 52 && perf.level > 0) {
    // one step back up (never past level 0 automatically)
    perf.level--;
    if (perf.level === 0) {
      renderer.setPixelRatio(DPR_CAP);
      renderer.shadowMap.enabled = Q.shadows;
      sun.castShadow = Q.shadows;
      applyCrowdCount(crowdFullCount);
    } else if (perf.level === 1) {
      renderer.shadowMap.enabled = false;
      sun.castShadow = false;
    }
  }
}

/* ------------------------------- loop ------------------------------- */
let prevT = 0;
let ambientT = 0;

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - prevT) / 1000 || 0.016);
  prevT = now;
  S.t += dt;
  const t = S.t;

  updateCamera(dt, t);
  updatePlayers(dt, t);
  updateDust(dt, t);
  updateSigns();
  for (const m of mixerObjects) m.update(dt);

  // scrolling LED boards
  for (const tex of AD_BOARDS) tex.offset.x = (tex.offset.x + dt * 0.028) % 1;

  // drifting clouds
  cloudGroup.rotation.y += dt * 0.0035;

  // metro glow at night handled by onHourChanged

  // subtle floodlight shimmer
  if (S.flood > 0.02) {
    for (let i = 0; i < floodLights.length; i++) {
      const f = floodLights[i];
      f.glow.material.opacity = (0.72 + Math.sin(t * 11 + i * 2.1) * 0.03) * S.flood;
    }
  }

  updateHUD(dt);
  adaptQuality(dt);
  renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', () => {
  boot().catch(err => {
    console.error(err);
    const s = $('#loadStep');
    if (s) {
      s.textContent = 'Error: ' + err.message;
      s.style.color = '#ff7a7a';
    }
    const bar = $('#loadBar');
    if (bar) bar.style.background = '#c0392b';
  });
});
