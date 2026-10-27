/* =========================================================================
   CROWD + REAL MATCH
   Kerala Blasters FC (yellow, Medhaa / Batery / Polycab / Salpido / Reyaur)
   vs Mohun Bagan Super Giant — a live 90-minute simulation.
   ========================================================================= */

const PITCH_Y = 0.12;
const FIELD = { L: 105, W: 68, GX: 52.5, GZ: 3.66, GH: 2.44, R: 0.11 };

/* crowd handles (crowdMesh kept as the body mesh for the HUD toggle) */
let crowdMesh = null, crowdHead = null, crowdHair = null;
let crowdArmsA = null, crowdArmsB = null, crowdFlags = null, bigFlags = null;
const crowdAll = [];
let crowdFullCount = 0;

const crowdUniforms = { uTime: { value: 0 }, uExcite: { value: 0 } };
function crowdShader(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = crowdUniforms.uTime;
    sh.uniforms.uExcite = crowdUniforms.uExcite;
    sh.vertexShader = 'attribute float aPhase;\nuniform float uTime;\nuniform float uExcite;\n' + sh.vertexShader;
    sh.vertexShader = sh.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       transformed.y += sin(uTime * 2.6 + aPhase) * 0.016 * (1.0 + uExcite * 2.4);`
    );
  };
  mat.customProgramCacheKey = () => 'crowd' + mat.type;
  return mat;
}

function applyCrowdCount(n) {
  const f = clamp(n / Math.max(1, crowdFullCount), 0, 1);
  for (const m of crowdAll) {
    m.count = Math.max(1, Math.floor(m.userData.full * f));
  }
}
function setCrowdVisible(v) {
  for (const m of crowdAll) m.visible = v;
  if (bigFlags) bigFlags.visible = v;
}

/* ------------------------------- the crowd ------------------------------- */
function buildCrowd() {
  const bodyGeo = mergeGeoms([
    new THREE.CylinderGeometry(0.172, 0.118, 0.5, 6, 1).translate(0, 0.28, 0),
    new THREE.SphereGeometry(0.19, 6, 3).scale(1.02, 0.62, 0.78).translate(0, 0.52, 0)
  ]);
  const headGeo = mergeGeoms([
    new THREE.CylinderGeometry(0.048, 0.055, 0.08, 5).translate(0, 0.585, 0),
    new THREE.SphereGeometry(0.112, 7, 5).translate(0, 0.675, 0)
  ]);
  const hairGeo = new THREE.SphereGeometry(0.116, 7, 4, 0, TAU, 0, 1.75).translate(0, 0.678, 0);
  const armDownGeo = mergeGeoms([
    new THREE.CapsuleGeometry(0.045, 0.22, 1, 4).rotateZ(0.15).translate(-0.205, 0.3, 0),
    new THREE.CapsuleGeometry(0.045, 0.22, 1, 4).rotateZ(-0.15).translate(0.205, 0.3, 0)
  ]);
  const armUpGeo = mergeGeoms([
    new THREE.CapsuleGeometry(0.042, 0.26, 1, 4).rotateZ(0.26).translate(-0.225, 0.72, 0),
    new THREE.CapsuleGeometry(0.042, 0.26, 1, 4).rotateZ(-0.26).translate(0.225, 0.72, 0)
  ]);

  // Manjappada shirts dominate: vivid KBFC yellow, with white / navy / red mixed in
  const shirts = [
    0xFFD21F, 0xFFD21F, 0xFFD21F, 0xFFD21F, 0xFFD21F, 0xF7C81A, 0xE9BC12, 0xF2C018,
    0xF6F2E4, 0xE6E1D4, 0xFFFFFF,
    0x0B2C6B, 0x123C86, 0x1D3A66,
    0xB93A2E, 0x2F6B45, 0x3C4652, 0x6A747E, 0xC9A227
  ];
  const skins = [0xE7B78A, 0xDCA478, 0xCE9364, 0xB87C4C, 0x9A6238, 0x7C4A2B, 0x633A20];
  const hairs = [0x141210, 0x1C1712, 0x241A12, 0x2E2116, 0x0E0C0B, 0x3C2A1B, 0x4A3423];

  const bodies = [], heads = [], haires = [], armsDown = [], armsUp = [], flags = [];
  const bodyCol = [], headCol = [], hairCol = [], flagCol = [];
  const d = new THREE.Object3D();
  const c = new THREE.Color();

  const isManjappada = (t) => (t > 2.55 && t < 3.75) || t < 0.45 || t > TAU - 0.45;

  for (let i = 0; i < SEATS.length; i++) {
    const s = SEATS[i];
    const yellow = isManjappada(s.t);
    const base = (yellow ? 0.82 : (s.tier === 0 ? 0.44 : 0.30)) * Q.crowdScale;
    if (rand() > base) continue;

    const phase = rand() * TAU;
    const sc = (0.93 + rand() * 0.16) * 1.5;
    d.position.set(s.x + (rand() - 0.5) * 0.07, s.y + 0.02, s.z + (rand() - 0.5) * 0.07);
    d.rotation.set(0, s.yaw + (rand() - 0.5) * 0.3, 0);
    d.scale.set(sc, (0.94 + rand() * 0.16) * 1.52, sc);
    d.updateMatrix();
    const m = d.matrix.clone();

    bodies.push(m);
    c.setHex(yellow
      ? (rand() < 0.82 ? shirts[0] : shirts[Math.floor(rand() * 4)])
      : shirts[Math.floor(rand() * shirts.length)]).multiplyScalar(0.84 + rand() * 0.26);
    bodyCol.push(c.r, c.g, c.b);

    heads.push(m);
    c.setHex(skins[Math.floor(rand() * skins.length)]).multiplyScalar(0.88 + rand() * 0.2);
    headCol.push(c.r, c.g, c.b);

    if (rand() < 0.66) {
      haires.push(m);
      c.setHex(hairs[Math.floor(rand() * hairs.length)]);
      hairCol.push(c.r, c.g, c.b);
    }

    const up = yellow ? rand() < 0.7 : rand() < 0.12;
    if (up) {
      armsUp.push(m);
      c.setHex(yellow ? 0xFFD21F : skins[Math.floor(rand() * skins.length)]).multiplyScalar(0.9 + rand() * 0.2);
      bodyCol.push(c.r, c.g, c.b);   // arms share the body colour buffer index... fixed below
      bodyCol.pop(); bodyCol.pop(); bodyCol.pop();
      armsUp.userData = armsUp.userData || [];
    } else {
      armsDown.push(m);
    }

    if (yellow && rand() < 0.2) {
      const fd = new THREE.Object3D();
      fd.position.set(s.x, s.y + 1.02, s.z);
      fd.rotation.set(0, s.yaw + Math.PI, (rand() - 0.5) * 0.18);
      fd.scale.set(0.9 + rand() * 0.5, 0.9 + rand() * 0.4, 1);
      fd.updateMatrix();
      flags.push(fd.matrix.clone());
      c.setHex(rand() < 0.7 ? 0xFFD21F : (rand() < 0.5 ? 0x0B2C6B : 0xFFFFFF));
      flagCol.push(c.r, c.g, c.b);
    }
  }

  const mk = (geo, list, cols, mat) => {
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((m, i) => im.setMatrixAt(i, m));
    im.instanceMatrix.needsUpdate = true;
    if (cols && cols.length) {
      im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cols), 3);
      im.instanceColor.needsUpdate = true;
    }
    const ph = new Float32Array(list.length);
    for (let i = 0; i < list.length; i++) ph[i] = rand() * TAU;
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(ph, 1));
    im.frustumCulled = false;
    im.userData.full = list.length;
    im.castShadow = false;
    im.receiveShadow = false;
    world.add(im);
    crowdAll.push(im);
    return im;
  };

  const matBody = crowdShader(new THREE.MeshStandardMaterial({ roughness: 0.94, metalness: 0.0 }));
  const matHead = crowdShader(new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0.0 }));
  const matHair = crowdShader(new THREE.MeshStandardMaterial({ roughness: 0.96, metalness: 0.0 }));
  crowdMesh = mk(bodyGeo, bodies, bodyCol, matBody);
  crowdHead = mk(headGeo, heads, headCol, matHead);
  crowdHair = mk(hairGeo, haires, hairCol, matHair);
  crowdArmsA = mk(armDownGeo, armsDown, null, matBody.clone());
  crowdArmsA.instanceColor = null;
  crowdArmsB = mk(armUpGeo, armsUp, null, matBody.clone());
  crowdArmsB.instanceColor = null;
  for (const im of [crowdArmsA, crowdArmsB]) {
    im.material = matBody;
    im.instanceColor = null;
  }

  // arms inherit a per-instance tint pulled from nearby body colours
  crowdArmsA.instanceColor = new THREE.InstancedBufferAttribute(
    new Float32Array(armsDown.length * 3), 3);
  crowdArmsB.instanceColor = new THREE.InstancedBufferAttribute(
    new Float32Array(armsUp.length * 3), 3);
  for (let i = 0; i < armsDown.length; i++) {
    const k = Math.floor(rand() * skins.length);
    c.setHex(skins[k]);
    crowdArmsA.instanceColor.setXYZ(i, c.r, c.g, c.b);
  }
  for (let i = 0; i < armsUp.length; i++) {
    const k = Math.floor(rand() * (shirts.length - 1));
    c.setHex(rand() < 0.55 ? 0xFFD21F : skins[Math.floor(rand() * skins.length)]);
    crowdArmsB.instanceColor.setXYZ(i, c.r, c.g, c.b);
  }
  crowdArmsA.instanceColor.needsUpdate = true;
  crowdArmsB.instanceColor.needsUpdate = true;

  crowdFullCount = bodies.length;
  crowdMesh.visible = S.crowd;
  crowdHead.visible = S.crowd;
  crowdHair.visible = S.crowd;
  crowdArmsA.visible = S.crowd;
  crowdArmsB.visible = S.crowd;
  MATS.crowd = matBody;

  /* ---- flags held above the Manjappada ---- */
  if (flags.length) {
    const fgeo = new THREE.PlaneGeometry(0.52, 0.36, 4, 2);
    const fmat = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide, roughness: 0.85, metalness: 0.0
    });
    fmat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = crowdUniforms.uTime;
      sh.uniforms.uExcite = crowdUniforms.uExcite;
      sh.vertexShader = 'attribute float aPhase;\nuniform float uTime;\nuniform float uExcite;\n' + sh.vertexShader;
      sh.vertexShader = sh.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         transformed.z += sin(uTime * (4.0 + uExcite * 3.0) + aPhase + uv.x * 5.0) * 0.10 * uv.x;
         transformed.y += sin(uTime * 2.0 + aPhase) * 0.02;`
      );
    };
    fmat.customProgramCacheKey = () => 'crowdFlag';
    crowdFlags = new THREE.InstancedMesh(fgeo, fmat, flags.length);
    flags.forEach((m, i) => crowdFlags.setMatrixAt(i, m));
    crowdFlags.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(flagCol), 3);
    crowdFlags.instanceMatrix.needsUpdate = true;
    crowdFlags.instanceColor.needsUpdate = true;
    const ph = new Float32Array(flags.length);
    for (let i = 0; i < flags.length; i++) ph[i] = rand() * TAU;
    fgeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(ph, 1));
    crowdFlags.frustumCulled = false;
    crowdFlags.userData.full = flags.length;
    world.add(crowdFlags);
    crowdAll.push(crowdFlags);
    crowdFlags.visible = S.crowd;
  }

  /* ---- giant surfer flags on poles in the yellow wall ---- */
  const bigGeo = new THREE.PlaneGeometry(3.6, 2.2, 6, 3);
  const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 4.2, 6);
  const bigs = new THREE.Group();
  const spots = [
    [Math.PI - 0.22, 80, 7.4], [Math.PI + 0.2, 80, 7.4],
    [0.16, 80, 7.4], [-0.16, 80, 7.4],
    [Math.PI - 0.5, 88, 18.4], [0.42, 88, 18.4]
  ];
  for (let i = 0; i < spots.length; i++) {
    const [t, A, y] = spots[i];
    const [x, z] = ovalPoint(t, A, A - STAD.off);
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = Math.atan2(x, z) + Math.PI;
    const pole = new THREE.Mesh(poleGeo, new THREE.MeshStandardMaterial({ color: 0x2a2f35, roughness: 0.7 }));
    pole.position.y = 1.4;
    g.add(pole);
    const [c, cx2] = makeCanvas(512, 320);
    cx2.fillStyle = i % 2 ? '#0B2C6B' : '#FFD21F';
    cx2.fillRect(0, 0, 512, 320);
    cx2.strokeStyle = i % 2 ? '#FFD21F' : '#0B2C6B';
    cx2.lineWidth = 14; cx2.strokeRect(10, 10, 492, 300);
    cx2.fillStyle = i % 2 ? '#FFD21F' : '#0B2C6B';
    cx2.font = `700 92px ${F_ML}`;
    cx2.textAlign = 'center'; cx2.textBaseline = 'middle';
    cx2.fillText(i % 2 ? BRAND.ml.yennum : BRAND.ml.manjappada, 256, 140, 470);
    cx2.font = `700 40px ${F_DISPLAY}`;
    cx2.fillText('MANJAPPADA · KOCHI', 256, 244, 470);
    const flag = new THREE.Mesh(bigGeo, new THREE.MeshStandardMaterial({
      map: canvasTex(c), side: THREE.DoubleSide, roughness: 0.9
    }));
    flag.position.set(0, 3.0, 0.02);
    g.add(flag);
    bigs.add(g);
  }
  bigFlags = bigs;
  world.add(bigs);
}

/* ---------------------------- banners & tifos ---------------------------- */
function buildBanners() {
  const put = (tex, t, A, y, w, h) => {
    const [x, z] = ovalPoint(t, A, A - STAD.off * 0.5);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.0 }));
    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.atan2(x, z) + Math.PI;
    world.add(mesh);
    EMISSIVE_NIGHT.push({ mat: mesh.material, max: 0.32, color: 0xffffff, keepColor: true });
    return mesh;
  };

  // behind the goals — the Manjappada wall
  put(bannerTexture({ ml: BRAND.ml.manjappada, text: 'MANJAPPADA', bg: '#FFD21F', fg: '#0B2C6B', crest: true, size: 132, size2: 44, stripes: true }), Math.PI, 77.5, 8.6, 44, 9.4);
  put(bannerTexture({ ml: BRAND.ml.yennum, text: 'YENNUM YELLOW', bg: '#0B2C6B', fg: '#FFD21F', fg2: '#FFD21F', isl: true, size: 132, size2: 40 }), 0, 77.5, 8.6, 40, 9.0);

  // side stands
  put(bannerTexture({ ml: BRAND.ml.blasters, text: 'KERALA BLASTERS', bg: '#FFD21F', fg: '#0B2C6B', size: 118, size2: 36, crest: true }), Math.PI * 0.5, 77.5, 8.2, 40, 8.6);
  put(bannerTexture({ ml: BRAND.ml.jayikkam, text: 'COME ON BLASTERS', bg: '#123C86', fg: '#FFD21F', fg2: '#FFFFFF', size: 128, size2: 34 }), Math.PI * 1.5, 77.5, 8.2, 40, 8.6);

  // upper tier
  put(bannerTexture({ ml: BRAND.ml.yellowArmy, text: 'YELLOW ARMY', bg: '#FFD21F', fg: '#0B2C6B', size: 108, size2: 32 }), Math.PI * 0.82, 87.5, 17.6, 26, 6.0);
  put(bannerTexture({ ml: BRAND.ml.nammude, text: 'NAM M UDE PAD', bg: '#0B2C6B', fg: '#FFD21F', fg2: '#FFD21F', size: 108, size2: 30 }), Math.PI * 1.18, 87.5, 17.6, 26, 6.0);

  // ISL branding at the tunnel and in the corners
  put(bannerTexture({ text: 'INDIAN SUPER LEAGUE', bg: '#081F49', fg2: '#F4E84E', fg: '#F4E84E', isl: true, size2: 40 }), Math.PI * 0.12, 86, 16.4, 22, 5.4);
  put(bannerTexture({ text: 'INDIAN SUPER LEAGUE', bg: '#081F49', fg2: '#F4E84E', fg: '#F4E84E', isl: true, size2: 40 }), Math.PI * 1.88, 86, 16.4, 22, 5.4);

  // pitch-level Malayalam banners above the LED boards
  const low = (ml, t, A, col) => {
    const tex = bannerTexture({ ml, bg: col, fg: col === '#FFD21F' ? '#0B2C6B' : '#FFD21F', border: col === '#FFD21F' ? '#0B2C6B' : '#FFD21F', size: 150, w: 1024, h: 192 });
    const [x, z] = ovalPoint(t, A, A - STAD.off);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(15, 2.4),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false }));
    mesh.position.set(x, 2.5, z);
    mesh.rotation.y = Math.atan2(x, z) + Math.PI;
    world.add(mesh);
  };
  low(BRAND.ml.manjappada, Math.PI + 0.34, 59.5, '#FFD21F');
  low(BRAND.ml.yennum, Math.PI - 0.34, 59.5, '#0B2C6B');
  low(BRAND.ml.blasters, 0.32, 59.5, '#FFD21F');

}

/* ------------------------------ player rig ------------------------------ */
const JERSEY_TEX = new Map();
let PGE = null;
function playerGeos() {
  if (PGE) return PGE;
  PGE = {
    torso: new THREE.CylinderGeometry(0.205, 0.158, 0.54, 16, 2, true).rotateY(-Math.PI / 2).scale(1, 1, 0.7),
    shoulder: new THREE.SphereGeometry(0.205, 14, 6, 0, TAU, 0, 1.15).scale(1, 0.64, 0.72),
    shorts: new THREE.CylinderGeometry(0.198, 0.185, 0.27, 12).scale(1, 1, 0.74),
    thigh: new THREE.CapsuleGeometry(0.096, 0.28, 3, 8).translate(0, -0.232, 0),
    shin: new THREE.CapsuleGeometry(0.072, 0.27, 3, 8).translate(0, -0.213, 0),
    boot: mergeGeoms([
      new THREE.BoxGeometry(0.105, 0.075, 0.235).translate(0, -0.375, 0.045),
      new THREE.SphereGeometry(0.075, 8, 5).scale(1, 0.6, 1.3).translate(0, -0.375, 0.13)
    ]),
    upperArm: new THREE.CapsuleGeometry(0.063, 0.2, 3, 8).translate(0, -0.16, 0),
    forearm: new THREE.CapsuleGeometry(0.052, 0.19, 3, 6).translate(0, -0.15, 0),
    hand: new THREE.SphereGeometry(0.056, 8, 6).translate(0, -0.3, 0),
    head: new THREE.SphereGeometry(0.105, 18, 14).scale(0.94, 1.06, 0.98),
    hair: new THREE.SphereGeometry(0.112, 16, 10, 0, TAU, 0, 1.02),
    neck: new THREE.CylinderGeometry(0.055, 0.065, 0.1, 8)
  };
  return PGE;
}

/* face texture: eyes, brows, nose, mouth — sphere u = 0.25 is +z */
const FACE_CACHE = new Map();
function faceTexture(skin) {
  if (FACE_CACHE.has(skin)) return FACE_CACHE.get(skin);
  const [c, x] = makeCanvas(512, 256);
  const sc = new THREE.Color(skin);
  x.fillStyle = `#${sc.getHexString()}`;
  x.fillRect(0, 0, 512, 256);
  // shading at the back of the head
  const g = x.createLinearGradient(0, 0, 512, 0);
  g.addColorStop(0, 'rgba(0,0,0,.30)');
  g.addColorStop(0.16, 'rgba(0,0,0,0)');
  g.addColorStop(0.34, 'rgba(0,0,0,0)');
  g.addColorStop(0.5, 'rgba(0,0,0,.30)');
  x.fillStyle = g; x.fillRect(0, 0, 512, 256);

  const cx = 128;
  // brows
  x.fillStyle = 'rgba(28,18,12,.82)';
  x.fillRect(cx - 34, 88, 26, 6);
  x.fillRect(cx + 8, 88, 26, 6);
  // eyes
  x.fillStyle = '#f7f3ec';
  x.beginPath(); x.ellipse(cx - 21, 102, 10, 6.4, 0, 0, TAU); x.fill();
  x.beginPath(); x.ellipse(cx + 21, 102, 10, 6.4, 0, 0, TAU); x.fill();
  x.fillStyle = '#2a1c12';
  x.beginPath(); x.arc(cx - 20, 102, 4.4, 0, TAU); x.fill();
  x.beginPath(); x.arc(cx + 22, 102, 4.4, 0, TAU); x.fill();
  x.fillStyle = 'rgba(255,255,255,.9)';
  x.beginPath(); x.arc(cx - 22, 100, 1.5, 0, TAU); x.fill();
  x.beginPath(); x.arc(cx + 20, 100, 1.5, 0, TAU); x.fill();
  // nose
  x.fillStyle = 'rgba(0,0,0,.16)';
  x.beginPath(); x.moveTo(cx - 4, 108); x.lineTo(cx + 4, 108); x.lineTo(cx + 7, 132); x.lineTo(cx - 6, 132); x.closePath(); x.fill();
  x.fillStyle = 'rgba(255,255,255,.10)';
  x.beginPath(); x.ellipse(cx, 132, 9, 4, 0, 0, TAU); x.fill();
  // mouth
  x.fillStyle = 'rgba(96,36,34,.72)';
  x.beginPath(); x.ellipse(cx, 156, 15, 4.6, 0, 0, TAU); x.fill();
  x.fillStyle = 'rgba(255,255,255,.22)';
  x.fillRect(cx - 13, 154, 26, 1.6);
  // ears
  x.fillStyle = 'rgba(0,0,0,.13)';
  x.beginPath(); x.ellipse(cx - 54, 118, 9, 17, 0, 0, TAU); x.fill();
  x.beginPath(); x.ellipse(cx + 54, 118, 9, 17, 0, 0, TAU); x.fill();

  const t = canvasTex(c);
  FACE_CACHE.set(skin, t);
  return t;
}

const SKINS = [0xe0ac7e, 0xc98d5f, 0xa9703f, 0x8a5730, 0x6f4224, 0xd9a06d];

function buildPlayerRig(o) {
  const G = playerGeos();
  const g = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ map: faceTexture(o.skin), roughness: 0.72 });
  const bodySkin = new THREE.MeshStandardMaterial({ color: o.skin, roughness: 0.7 });
  const sleeveMat = new THREE.MeshStandardMaterial({ color: o.sleeve, roughness: 0.82 });
  const shortsMat = new THREE.MeshStandardMaterial({ color: o.shorts, roughness: 0.85 });
  const sockMat = new THREE.MeshStandardMaterial({ color: o.socks, roughness: 0.86 });
  const bootMat = new THREE.MeshStandardMaterial({ color: o.boots || 0x11161c, roughness: 0.55, metalness: 0.1 });
  const hairMat = new THREE.MeshStandardMaterial({ color: o.hair, roughness: 0.95 });

  const jt = JERSEY_TEX.get(o.num + '|' + o.kit + '|' + o.name);
  let jmat;
  if (jt) jmat = jt;
  else {
    jmat = new THREE.MeshStandardMaterial({
      map: jerseyTexture({ kit: o.kit, num: o.num, name: o.name }),
      roughness: 0.84, metalness: 0.0
    });
    JERSEY_TEX.set(o.num + '|' + o.kit + '|' + o.name, jmat);
  }

  g.userData.mats = [skinMat, bodySkin, sleeveMat, shortsMat, sockMat, bootMat, hairMat, jmat];

  // hips
  const shorts = new THREE.Mesh(G.shorts, shortsMat);
  shorts.position.y = 0.945;
  shorts.castShadow = true;
  g.add(shorts);

  // legs
  const mkLeg = (side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.097, 0.9, 0);
    const thigh = new THREE.Mesh(G.thigh, bodySkin);
    thigh.castShadow = true;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.46;
    const shin = new THREE.Mesh(G.shin, sockMat);
    shin.castShadow = true;
    knee.add(shin);
    const boot = new THREE.Mesh(G.boot, bootMat);
    knee.add(boot);
    hip.add(knee);
    g.add(hip);
    return { hip, knee };
  };
  const legL = mkLeg(-1), legR = mkLeg(1);

  // upper body pivot
  const upper = new THREE.Group();
  upper.position.y = 0.9;
  g.add(upper);

  const torso = new THREE.Mesh(G.torso, jmat);
  torso.position.y = 0.46;
  torso.castShadow = true;
  upper.add(torso);

  const shoulder = new THREE.Mesh(G.shoulder, sleeveMat);
  shoulder.position.y = 0.725;
  shoulder.castShadow = true;
  upper.add(shoulder);

  const neck = new THREE.Mesh(G.neck, bodySkin);
  neck.position.y = 0.79;
  upper.add(neck);

  const headG = new THREE.Group();
  headG.position.y = 0.885;
  upper.add(headG);
  const head = new THREE.Mesh(G.head, skinMat);
  head.castShadow = true;
  headG.add(head);
  const hair = new THREE.Mesh(G.hair, hairMat);
  hair.position.y = 0.006;
  headG.add(hair);

  const mkArm = (side) => {
    const sh = new THREE.Group();
    sh.position.set(side * 0.238, 0.655, 0);
    sh.rotation.z = side * -0.13;
    const up = new THREE.Mesh(G.upperArm, sleeveMat);
    up.castShadow = true;
    sh.add(up);
    const el = new THREE.Group();
    el.position.y = -0.31;
    const fore = new THREE.Mesh(G.forearm, bodySkin);
    fore.castShadow = true;
    el.add(fore);
    const hand = new THREE.Mesh(G.hand, bodySkin);
    el.add(hand);
    sh.add(el);
    upper.add(sh);
    return { sh, el };
  };
  const armL = mkArm(-1), armR = mkArm(1);

  g.userData.rig = { legL, legR, armL, armR, torso, headG, upper, shoulder };
  return g;
}

/* ------------------------------- squads ------------------------------- */
const SQUAD_HOME = [
  { num: 1, name: 'SACHIN', role: 'GK', x: -48, z: 0 },
  { num: 2, name: 'SANDEEP', role: 'RB', x: -30, z: -25 },
  { num: 4, name: 'DRINCIC', role: 'CB', x: -32, z: -8.5 },
  { num: 5, name: 'HORMIPAM', role: 'CB', x: -32, z: 8.5 },
  { num: 3, name: 'AIBANBHA', role: 'LB', x: -30, z: 25 },
  { num: 6, name: 'DANISH', role: 'CM', x: -14, z: -13 },
  { num: 8, name: 'VIBIN', role: 'DM', x: -17, z: 0 },
  { num: 14, name: 'FREDDY', role: 'CM', x: -14, z: 13 },
  { num: 7, name: 'RAHUL KP', role: 'RW', x: -3, z: -22 },
  { num: 9, name: 'PEPRAH', role: 'ST', x: 2, z: 0 },
  { num: 10, name: 'LUNA', role: 'LW', x: -3, z: 22 }
];
const SQUAD_AWAY = [
  { num: 23, name: 'KAITH', role: 'GK', x: 48, z: 0 },
  { num: 2, name: 'ASISH', role: 'RB', x: 30, z: 25 },
  { num: 5, name: 'RODRIGUEZ', role: 'CB', x: 32, z: 8.5 },
  { num: 4, name: 'ANWAR', role: 'CB', x: 32, z: -8.5 },
  { num: 15, name: 'SUBHASISH', role: 'LB', x: 30, z: -25 },
  { num: 6, name: 'THAPA', role: 'CM', x: 14, z: 13 },
  { num: 8, name: 'SAHAL', role: 'DM', x: 17, z: 0 },
  { num: 18, name: 'TANGRI', role: 'CM', x: 14, z: -13 },
  { num: 11, name: 'MANVIR', role: 'RW', x: 3, z: 22 },
  { num: 9, name: 'CUMMINGS', role: 'ST', x: -2, z: 0 },
  { num: 10, name: 'PETRATOS', role: 'LW', x: 3, z: -22 }
];

const players = [];
let ball = null;
let ballShadow = null;

const MATCH = {
  ball: { pos: new THREE.Vector3(0, PITCH_Y + FIELD.R, 0), vel: new THREE.Vector3(), spin: new THREE.Vector3() },
  owner: null,
  lastTouch: null,
  score: [0, 0],
  minute: 0,
  rate: 0.62,          // match-minutes per real second
  time: 0,
  state: 'play',       // play | goal | fulltime
  timer: 0,
  restartT: 0,
  kickoffTeam: 0,
  force: null,
  scriptIdx: 0,
  shots: [0, 0],
  saves: 0,
  lock: 0,
  goals: [],
  msg: '',
  scorer: null,
  screenTick: 0
};

const SCRIPT = [
  { m: 7.0, type: 'attack', team: 0, num: 10 },
  { m: 17.0, type: 'goal', team: 0, num: 10 },
  { m: 38.0, type: 'goal', team: 1, num: 9 },
  { m: 63.0, type: 'goal', team: 0, num: 9 },
  { m: 86.0, type: 'attack', team: 0, num: 10 }
];

function buildPlayers() {
  const homeKit = {
    kit: 'home', sleeve: 0xffd21f, shorts: 0x0b2c6b, socks: 0x0b2c6b, boots: 0xf2f2f2
  };
  const awayKit = {
    kit: 'away', sleeve: 0x6e1b2a, shorts: 0x6e1b2a, socks: 0xf2f0e6, boots: 0x11161c
  };

  const make = (sq, team) => sq.forEach((s, i) => {
    const kit = team === 0 ? homeKit : awayKit;
    const gk = s.role === 'GK';
    const skin = SKINS[(i * 3 + team * 2 + 1) % SKINS.length];
    const obj = buildPlayerRig({
      ...kit,
      num: s.num, name: s.name, skin,
      hair: [0x141210, 0x1c1712, 0x2a1d14, 0x0e0c0b][i % 4],
      sleeve: gk ? (team === 0 ? 0x9fe23f : 0xf29d22) : kit.sleeve,
      shorts: gk ? 0x16202c : kit.shorts,
      socks: gk ? 0x9fe23f : kit.socks,
      boots: 0x11161c
    });
    obj.position.set(s.x, PITCH_Y, s.z);
    obj.rotation.y = team === 0 ? Math.PI / 2 : -Math.PI / 2;
    world.add(obj);
    const p = {
      obj, team, role: s.role, num: s.num, name: s.name, gk,
      base: new THREE.Vector3(s.x, 0, s.z),
      pos: new THREE.Vector3(s.x, PITCH_Y, s.z),
      vel: new THREE.Vector3(),
      yaw: team === 0 ? Math.PI / 2 : -Math.PI / 2,
      anim: rand() * TAU, kick: 0, dive: 0, diveDir: 0,
      dec: 0.4 + rand() * 0.8, react: 0, celebrate: 0, down: 0,
      speed: 5.6 + rand() * 1.2, tired: 0
    };
    obj.userData.p = p;
    players.push(p);
  });

  make(SQUAD_HOME, 0);
  make(SQUAD_AWAY, 1);

  // captain's armband for Luna
  const luna = players.find(p => p.name === 'LUNA');
  if (luna) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.05, 8),
      new THREE.MeshStandardMaterial({ color: 0xffd21f, roughness: 0.6, emissive: 0x5a4200, emissiveIntensity: 0.4 }));
    band.position.set(-0.215, 0.14, 0);
    band.rotation.z = 0.2;
    luna.obj.userData.rig.armL.sh.add(band);
  }

  /* ---- the ball ---- */
  const [bc, bx] = makeCanvas(256, 128);
  bx.fillStyle = '#f6f7f4'; bx.fillRect(0, 0, 256, 128);
  bx.fillStyle = '#20242a';
  for (let i = 0; i < 14; i++) {
    const px = (i % 7) * 36 + (i > 6 ? 18 : 0), py = i > 6 ? 84 : 36;
    bx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * TAU - 0.3;
      bx.lineTo(px + Math.cos(a) * 12, py + Math.sin(a) * 12);
    }
    bx.closePath(); bx.fill();
  }
  bx.fillStyle = 'rgba(0,0,0,.10)';
  for (let i = 0; i < 600; i++) bx.fillRect(rand() * 256, rand() * 128, 1, 1);
  ball = new THREE.Mesh(new THREE.SphereGeometry(FIELD.R, 20, 14),
    new THREE.MeshStandardMaterial({ map: canvasTex(bc), roughness: 0.55, metalness: 0.02 }));
  ball.position.copy(MATCH.ball.pos);
  ball.castShadow = true;
  world.add(ball);

  // a soft contact shadow under the ball so it reads from a drone shot
  ballShadow = new THREE.Mesh(new THREE.CircleGeometry(0.3, 14),
    new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.32, depthWrite: false }));
  ballShadow.rotation.x = -Math.PI / 2;
  world.add(ballShadow);

  MATCH.ball.pos.set(0, PITCH_Y + FIELD.R, 0);
  kickoff(0, true);
}

/* ------------------------------ match helpers ------------------------------ */
const attackGoal = (team) => team === 0 ? FIELD.GX : -FIELD.GX;
const ownGoal = (team) => team === 0 ? -FIELD.GX : FIELD.GX;
const gkOf = (team) => players.find(p => p.team === team && p.gk);

function dist2D(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }

function nearestOpp(p, maxD) {
  let best = null, bd = maxD || 1e9;
  for (const q of players) {
    if (q.team === p.team) continue;
    const d = dist2D(p.pos, q.pos);
    if (d < bd) { bd = d; best = q; }
  }
  return best;
}

function kickoff(team, instant) {
  const M = MATCH;
  M.state = 'play';
  M.minute = instant ? 0 : M.minute;
  M.force = null;
  M.owner = null;
  M.restartT = 0;
  M.kickoffTeam = team;

  for (const p of players) {
    p.pos.set(p.base.x, PITCH_Y, p.base.z);
    p.vel.set(0, 0, 0);
    p.kick = 0; p.dive = 0; p.celebrate = 0; p.down = 0;
    p.obj.position.copy(p.pos);
    p.yaw = team === 0 ? Math.PI / 2 : -Math.PI / 2;
    p.obj.rotation.y = p.yaw;
  }
  // kicking team's striker stands over the ball
  const st = players.find(p => p.team === team && p.role === 'ST');
  if (st) {
    st.pos.set(-(team === 0 ? 1.1 : -1.1), PITCH_Y, 0);
    st.obj.position.copy(st.pos);
  }
  M.ball.pos.set(0, PITCH_Y + FIELD.R, 0);
  M.ball.vel.set(0, 0, 0);
  if (st) {
    M.owner = st;
    M.lastTouch = st;
    st.dec = 1.1;
  }
  M.screenTick = 0;
}

function launchBall(from, to, speed) {
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  const horiz = Math.hypot(dx, dz);
  const t = clamp(horiz / speed, 0.12, 3.2);
  MATCH.ball.vel.set(dx / t, dy / t + 0.5 * 9.81 * t, dz / t);
  MATCH.ball.pos.copy(from);
}

function doPass(p, mate) {
  const b = MATCH.ball;
  const dest = mate.pos.clone();
  dest.y = PITCH_Y + 0.35;
  dest.x += mate.vel.x * 0.28;
  dest.z += mate.vel.z * 0.28;
  const d = Math.hypot(dest.x - p.pos.x, dest.z - p.pos.z);
  const speed = clamp(d * 1.25, 10, 26);
  const from = new THREE.Vector3(p.pos.x + Math.sin(p.yaw) * 0.4, PITCH_Y + 0.28, p.pos.z + Math.cos(p.yaw) * 0.4);
  launchBall(from, dest, speed);
  // pass error
  b.vel.x += (rand() - 0.5) * (1.2 + d * 0.06);
  b.vel.z += (rand() - 0.5) * (1.2 + d * 0.06);
  MATCH.owner = null;
  MATCH.lastTouch = p;
  MATCH.lock = 0.34;
  p.dec = 0.5 + rand() * 0.7;
  p.kick = 0.28;
}

function M_time_plus(s) { return MATCH.time + s; }

function doShot(p, forced) {
  const gx = attackGoal(p.team);
  const dirZ = rand() < 0.5 ? -1 : 1;
  const tz = forced ? dirZ * 1.9 : dirZ * (1.5 + rand() * 1.9);
  const ty = forced ? 0.75 : 0.5 + rand() * 1.5;
  const from = new THREE.Vector3(
    p.pos.x + Math.sin(p.yaw) * 0.45, PITCH_Y + 0.26,
    p.pos.z + Math.cos(p.yaw) * 0.45
  );
  const to = new THREE.Vector3(gx + (p.team === 0 ? 0.5 : -0.5), ty, tz);
  const d = Math.hypot(to.x - from.x, to.z - from.z);
  const speed = forced ? 27 : 20 + rand() * 8;
  launchBall(from, to, speed);
  MATCH.owner = null;
  MATCH.lastTouch = p;
  MATCH.lock = 0.3;
  MATCH.noSaveUntil = forced ? M_time_plus(1.6) : 0;
  MATCH.shots[p.team]++;
  p.kick = 0.42;
  const gk = gkOf(1 - p.team);
  if (gk) {
    gk.react = forced ? 0.9 : 0.10 + rand() * 0.16;
    if (forced) { gk.dive = 0.75; gk.diveDir = -Math.sign(tz); }
  }
}

function goal(scorerTeam) {
  const M = MATCH;
  if (M.state === 'goal' || M.state === 'fulltime') return;
  M.score[scorerTeam]++;
  M.state = 'goal';
  M.timer = 7.2;
  M.kickoffTeam = 1 - scorerTeam;
  const scorer = M.lastTouch && M.lastTouch.team === scorerTeam ? M.lastTouch : null;
  M.scorer = scorer;
  M.msg = scorerTeam === 0 ? 'ഗോൾ!  GOAL!' : 'GOAL';
  M.owner = null;
  M.ball.vel.set(0, 0, 0);
  M.ball.pos.y = PITCH_Y + FIELD.R;
  if (S.sound && audioCtx) stadiumRoar(scorerTeam === 0 ? 1.0 : 0.4);

  for (const p of players) {
    p.celebrate = scorerTeam === p.team ? 1 : 0;
    p.celebrate = p.celebrate && (M.score[0] + M.score[1] > 0) ? 1 : 0;
    if (p.team !== scorerTeam) p.down = 1;
    p.vel.set(0, 0, 0);
  }
  if (scorer) scorer.celebrate = 2;
  crowdUniforms.uExcite.value = scorerTeam === 0 ? 2.4 : 0.7;
  showToast(scorerTeam === 0
    ? (scorer ? scorer.name + " — ഗോൾ! KERALA BLASTERS SCORE!" : 'ഗോൾ! Kerala Blasters score!')
    : 'Mohun Bagan equalise', 5200);
  updateMatchScreen(true);
}

function stadiumRoar(level) {
  try {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.22 * level, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, t + 3.2);
    g.connect(audioCtx.destination);
    const o = audioCtx.createOscillator();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(180, t);
    o.frequency.linearRampToValueAtTime(420, t + 0.8);
    const f = audioCtx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.7;
    o.connect(f); f.connect(g); o.start(t); o.stop(t + 3.2);
  } catch (e) { /* audio unavailable */ }
}

function fullTime() {
  const M = MATCH;
  M.state = 'fulltime';
  M.timer = 11;
  M.msg = 'FULL TIME';
  updateMatchScreen(true);
}

/* -------------------------------- director -------------------------------- */
function runDirector() {
  const M = MATCH;
  while (M.scriptIdx < SCRIPT.length && M.minute >= SCRIPT[M.scriptIdx].m) {
    const e = SCRIPT[M.scriptIdx++];
    const p = players.find(q => q.team === e.team && q.num === e.num && !q.gk);
    if (!p) continue;
    // long through-ball played into the channel — a counter attack
    const gx = attackGoal(e.team);
    const sgn = Math.sign(gx);
    const ahead = new THREE.Vector3(
      clamp(p.pos.x + sgn * 9, -FIELD.GX + 8, FIELD.GX - 8),
      PITCH_Y + 0.3,
      clamp(p.pos.z * 0.75 + (rand() - 0.5) * 3, -22, 22)
    );
    const from = M.ball.pos.clone();
    from.y = Math.max(PITCH_Y + 0.3, from.y);
    launchBall(from, ahead, 17);
    M.lastTouch = players.find(q => q.team === e.team && q.role === 'CM') || p;
    M.owner = null;
    M.force = {
      team: e.team, p, until: M.time + 12,
      score: e.type === 'goal' ? true : e.type === 'save' ? false : null
    };
    for (const q of players) {
      if (q.team !== e.team) q.down = 0;
    }
  }
}

/* ------------------------------- simulation ------------------------------- */
function simulate(dt) {
  const M = MATCH;
  const b = M.ball;

  if (M.restartT > 0) {
    M.restartT -= dt;
    M.time += dt;
    M.minute += dt * M.rate;
    if (M.restartT <= 0 && M.pendingThrow) {
      const { team, x, z } = M.pendingThrow;
      b.pos.set(x, PITCH_Y + FIELD.R, z);
      b.vel.set(0, 0, 0);
      let best = null, bd = 1e9;
      for (const p of players) {
        if (p.team !== team || p.gk) continue;
        const d = Math.hypot(p.pos.x - x, p.pos.z - z);
        if (d < bd) { bd = d; best = p; }
      }
      if (best) {
        best.pos.set(x - Math.sign(x) * 1.2, PITCH_Y, z - Math.sign(z) * 1.2);
        M.owner = best;
        M.lastTouch = best;
        best.dec = 0.7;
      }
      M.pendingThrow = null;
    }
    return;
  }

  /* ---------------- ball free flight ---------------- */
  if (!M.owner) {
    b.vel.y -= 9.81 * dt;
    b.vel.multiplyScalar(1 - 0.02 * dt);
    b.pos.addScaledVector(b.vel, dt);

    if (b.pos.y < PITCH_Y + FIELD.R) {
      b.pos.y = PITCH_Y + FIELD.R;
      if (b.vel.y < -1.4) {
        b.vel.y *= -0.52;
        b.vel.x *= 0.88;
        b.vel.z *= 0.88;
      } else {
        b.vel.y = 0;
        const f = Math.max(0, 1 - 1.35 * dt);
        b.vel.x *= f;
        b.vel.z *= f;
      }
    }

    /* goal? */
    if (Math.abs(b.pos.x) > FIELD.GX && Math.abs(b.pos.z) < FIELD.GZ && b.pos.y < FIELD.GH) {
      goal(b.pos.x > 0 ? 0 : 1);
      return;
    }
    /* net back-stop */
    if (Math.abs(b.pos.x) > FIELD.GX + 1.9) {
      b.pos.x = Math.sign(b.pos.x) * (FIELD.GX + 1.9);
      b.vel.x *= -0.18;
      b.vel.z *= 0.5;
      b.vel.y *= 0.4;
    }
    /* out of play */
    if (Math.abs(b.pos.z) > FIELD.W / 2 + 0.15 || Math.abs(b.pos.x) > FIELD.GX + 0.1) {
      const lx = clamp(b.pos.x, -FIELD.GX + 0.4, FIELD.GX - 0.4);
      const lz = clamp(b.pos.z, -FIELD.W / 2 + 0.2, FIELD.W / 2 - 0.2);
      const team = M.lastTouch ? 1 - M.lastTouch.team : 0;
      M.pendingThrow = { team, x: lx, z: lz };
      M.restartT = 1.5;
      b.pos.set(lx, PITCH_Y + FIELD.R, lz);
      b.vel.set(0, 0, 0);
      M.owner = null;
      return;
    }
  }

  /* ---------------- possession ---------------- */
  if (M.lock > 0) M.lock -= dt;
  if (M.restartT <= 0 && M.lock <= 0) {
    let cand = null, cd = 1e9;
    for (const p of players) {
      if (p.gk) continue;
      const d = Math.hypot(p.pos.x - b.pos.x, p.pos.z - b.pos.z);
      if (d < 1.2 && b.pos.y < 1.7 && d < cd) { cd = d; cand = p; }
    }
    const F = M.force ? M.force.p : null;
    if (F && F !== M.owner && !F.gk) {
      const dF = Math.hypot(F.pos.x - b.pos.x, F.pos.z - b.pos.z);
      if (dF < 2.6) cand = F;
    }
    if (cand) {
      if (!M.owner) {
        M.owner = cand; M.lastTouch = cand; cand.dec = 0.3 + rand() * 0.4;
      } else if (cand !== M.owner) {
        const dOwn = Math.hypot(M.owner.pos.x - b.pos.x, M.owner.pos.z - b.pos.z);
        if (cand === F || cd < dOwn - 0.12) {
          M.owner = cand; M.lastTouch = cand; cand.dec = 0.4 + rand() * 0.5;
        }
      }
    }
  }

  const carrier = M.owner;
  if (carrier) {
    // the ball sits just ahead of the dribbler's boots
    const wob = Math.sin(M.time * 9 + carrier.num) * 0.06;
    b.pos.set(
      carrier.pos.x + Math.sin(carrier.yaw) * 0.52 + Math.cos(carrier.yaw) * wob,
      PITCH_Y + FIELD.R,
      carrier.pos.z + Math.cos(carrier.yaw) * 0.52 - Math.sin(carrier.yaw) * wob
    );
    b.vel.set(carrier.vel.x, 0, carrier.vel.z);
  }

  /* ---------------- player movement ---------------- */
  const force = M.force;
  if (force && M.time > force.until) M.force = null;

  // who chases?
  const chase = { 0: [], 1: [] };
  for (const team of [0, 1]) {
    const list = players.filter(p => p.team === team && !p.gk)
      .sort((a, c) => dist2D(a.pos, b.pos) - dist2D(c.pos, b.pos));
    chase[team] = list.slice(0, 2);
  }

  for (const p of players) {
    if (p.down > 0) {
      p.vel.multiplyScalar(1 - 4 * dt);
      if (p.down > 0.6 && p.celebrate === 0) p.down -= dt * 0.6;
      continue;
    }
    const dirSign = p.team === 0 ? 1 : -1;

    if (p.gk) {
      const gx = ownGoal(p.team);
      const behind = gx + dirSign * 0.85;
      let tz = clamp(b.pos.z * 0.5, -3.3, 3.3);
      if (M.owner && M.owner.team !== p.team) {
        const toGoal = Math.atan2(gx - M.owner.pos.x, -M.owner.pos.z);
        tz = clamp(Math.sin(toGoal) * 12, -3.2, 3.2);
      }
      // shot incoming?
      const towardGoal = (b.vel.x < -4 && p.team === 0) || (b.vel.x > 4 && p.team === 1);
      if (!M.owner && towardGoal && Math.abs(b.pos.x - gx) < 30) {
        if (p.react > 0) p.react -= dt;
        else {
          const tLine = (gx - b.pos.x) / (b.vel.x || 1);
          const pz = b.pos.z + b.vel.z * clamp(tLine, 0, 1.4);
          const targetZ = clamp(pz, -3.5, 3.5);
          if (Math.abs(targetZ - tz) > 0.25) {
            p.dive = 1;
            p.diveDir = Math.sign(targetZ - tz);
          }
          tz = targetZ;
        }
      }
      const tx = clamp(behind + clamp(-b.pos.x * 0.03, -2.5, 2.5) * dirSign, ownGoal(p.team) + dirSign * 0.4, ownGoal(p.team) + dirSign * 4.2);
      seek(p, tx, tz, p.dive ? 8.2 : 4.6, dt);

      // save?
      if (!M.owner) {
        const near = Math.abs(b.pos.x - gx) < 2.4;
        if (near && Math.abs(b.pos.z - p.pos.z) < 1.05 && b.pos.y < 2.3 && Math.hypot(b.vel.x, b.vel.z) > 6 && M.time > (M.noSaveUntil || 0)) {
          b.vel.x *= -0.32;
          b.vel.y = 2.2 + rand() * 1.6;
          b.vel.z += (rand() - 0.5) * 9;
          M.lastTouch = p;
          M.saves++;
          M.owner = null;
          p.react = 0.5;
          if (S.sound && audioCtx) stadiumRoar(0.25);
        }
      }

      if (p.dive > 0) p.dive = Math.max(0, p.dive - dt * 1.6);
      continue;
    }

    // desired point
    let tx, tz, speed;
    const isCarrier = p === carrier;
    if (force && force.p === p && !isCarrier) {
      tx = b.pos.x + b.vel.x * 0.22;
      tz = b.pos.z + b.vel.z * 0.22;
      seek(p, clamp(tx, -FIELD.GX + 1.2, FIELD.GX - 1.2), clamp(tz, -FIELD.W / 2 + 1.2, FIELD.W / 2 - 1.2), p.speed * 1.18, dt);
      const fy = Math.atan2(b.pos.x - p.pos.x, b.pos.z - p.pos.z);
      p.yaw += Math.atan2(Math.sin(fy - p.yaw), Math.cos(fy - p.yaw)) * Math.min(1, dt * 8);
      continue;
    }
    const isChaser = chase[p.team].includes(p);
    const distGoal = Math.hypot(attackGoal(p.team) - p.pos.x, p.pos.z);

    if (isCarrier) {
      const gx = attackGoal(p.team);
      let dirX = gx - p.pos.x, dirZ = -p.pos.z;
      const o = nearestOpp(p);
      if (o) {
        const dx = p.pos.x - o.pos.x, dz = p.pos.z - o.pos.z;
        const d = Math.hypot(dx, dz) || 1;
        if (d < 4.4) { dirX += (dx / d) * 3.2; dirZ += (dz / d) * 5.0; }
      }
      const dl = Math.hypot(dirX, dirZ) || 1;
      tx = p.pos.x + (dirX / dl) * 6;
      tz = p.pos.z + (dirZ / dl) * 6;
      speed = p.speed * 0.92;

      // decisions
      p.dec -= dt;
      const gk = gkOf(1 - p.team);
      const shotRange = force && force.p === p ? 25 : 19;
      if (force && force.p === p && distGoal < 25) {
        doShot(p, force.score !== false);
        M.force = null;
        continue;
      }
      if (p.dec <= 0) {
        p.dec = 0.45 + rand() * 0.6;
        const pressured = o ? dist2D(p.pos, o.pos) < 3.2 : false;
        if (distGoal < shotRange && Math.abs(p.pos.z) < 22 && (force && force.p === p || rand() < 0.55)) {
          const forced = force && force.p === p ? force.score !== false : false;
          doShot(p, forced);
          if (force && force.p === p) M.force = null;
          continue;
        }
        if (pressured || rand() < 0.55) {
          // pick a pass
          let best = null, bs = -1e9;
          for (const q of players) {
            if (q.team !== p.team || q === p || q.gk) continue;
            const d = dist2D(p.pos, q.pos);
            if (d < 4 || d > 42) continue;
            const prog = (q.pos.x - p.pos.x) * dirSign;
            const opp = nearestOpp(q, 12);
            const open = opp ? dist2D(q.pos, opp.pos) : 12;
            const s = prog * 0.55 + open * 0.75 - d * 0.06 + (q.role === 'ST' || q.role === 'RW' || q.role === 'LW' ? 2.2 : 0);
            if (s > bs) { bs = s; best = q; }
          }
          if (best && bs > -2) { doPass(p, best); continue; }
        }
      }
    } else if (isChaser && M.restartT <= 0) {
      const o = M.owner;
      const lead = 0.32;
      tx = b.pos.x + b.vel.x * lead;
      tz = b.pos.z + b.vel.z * lead;
      speed = p.speed * 1.06;
      if (force && force.team !== p.team) {
        // back off the breakaway
        const d = Math.hypot(p.pos.x - b.pos.x, p.pos.z - b.pos.z);
        if (d < 9) { tx = p.pos.x; tz = p.pos.z; speed = 2.4; }
      }
      if (o && o !== p && dist2D(p.pos, o.pos) < 1.1 && rand() < dt * 2.2 && !(force && force.p === o)) {
        // tackle
        M.owner = p; M.lastTouch = p; p.dec = 0.5;
        b.vel.set(0, 0, 0);
      }
    } else {
      const push = clamp(b.pos.x * 0.5, -26, 26);
      const shiftZ = clamp(b.pos.z * 0.3, -14, 14);
      tx = p.base.x + push;
      tz = p.base.z + shiftZ;
      // stay onside-ish and inside the pitch
      if (p.role === 'CB' || p.role === 'RB' || p.role === 'LB') {
        tx = lerp(p.base.x, -dirSign * 30, 0.35) + clamp(b.pos.x * 0.18, -12, 12);
      }
      speed = dist2D(p.pos, { x: tx, z: tz }) > 9 ? p.speed * 0.85 : p.speed * 0.4;
      tx += Math.sin(M.time * 0.7 + p.num) * 1.4;
      tz += Math.cos(M.time * 0.6 + p.num * 1.7) * 1.8;
    }

    // keep them on the field
    const dirToGoalX = attackGoal(p.team);
    tx = clamp(tx, -FIELD.GX + 1.2, FIELD.GX - 1.2);
    tz = clamp(tz, -FIELD.W / 2 + 1.2, FIELD.W / 2 - 1.2);
    if (p.gk) tz = clamp(tz, -3.6, 3.6);
    seek(p, tx, tz, speed, dt);

    // face the ball unless sprinting hard
    const faceYaw = Math.atan2(b.pos.x - p.pos.x, b.pos.z - p.pos.z);
    const moveYaw = Math.atan2(p.vel.x, p.vel.z);
    const spd = Math.hypot(p.vel.x, p.vel.z);
    const wantYaw = spd > 2.4 ? moveYaw : faceYaw;
    p.yaw += Math.atan2(Math.sin(wantYaw - p.yaw), Math.cos(wantYaw - p.yaw)) * Math.min(1, dt * 7);
    if (p.kick > 0) p.kick -= dt;
  }

  /* ---------------- clock ---------------- */
  M.time += dt;
  M.minute += dt * M.rate;
  runDirector();
  if (M.minute >= 90 && M.state === 'play') fullTime();
}

function seek(p, tx, tz, speed, dt) {
  const dx = tx - p.pos.x, dz = tz - p.pos.z;
  const d = Math.hypot(dx, dz);
  if (d > 0.08) {
    const s = Math.min(speed, d * 3.4);
    p.vel.x = damp(p.vel.x, (dx / d) * s, 9, dt);
    p.vel.z = damp(p.vel.z, (dz / d) * s, 9, dt);
  } else {
    p.vel.x = damp(p.vel.x, 0, 11, dt);
    p.vel.z = damp(p.vel.z, 0, 11, dt);
  }
  p.pos.x += p.vel.x * dt;
  p.pos.z += p.vel.z * dt;
}

/* ------------------------------- animation ------------------------------- */
function animatePlayer(p, dt, t) {
  const obj = p.obj, rig = obj.userData.rig;
  const spd = Math.hypot(p.vel.x, p.vel.z);
  const run = clamp(spd / 6.2, 0, 1);
  p.anim += dt * (2.0 + spd * 1.55);

  obj.position.x = p.pos.x;
  obj.position.z = p.pos.z;
  obj.rotation.y = p.yaw;

  const bob = Math.abs(Math.sin(p.anim)) * 0.035 * run;
  let jumpY = 0;

  if (p.celebrate) {
    jumpY = Math.abs(Math.sin(t * 6.2 + p.num)) * 0.22;
    rig.armL.sh.rotation.z = lerp(rig.armL.sh.rotation.z, -2.5, Math.min(1, dt * 8));
    rig.armR.sh.rotation.z = lerp(rig.armR.sh.rotation.z, 2.5, Math.min(1, dt * 8));
    rig.armL.el.rotation.x = rig.armR.el.rotation.x = -0.25;
    rig.headG.rotation.x = -0.18;
    rig.upper.rotation.x = -0.06;
    rig.legL.hip.rotation.x = Math.sin(t * 6.2 + p.num) * 0.25;
    rig.legR.hip.rotation.x = -rig.legL.hip.rotation.x;
  } else if (p.down) {
    rig.headG.rotation.x = 0.45;
    rig.upper.rotation.x = 0.24;
    rig.armL.sh.rotation.z = lerp(rig.armL.sh.rotation.z, -0.2, dt * 5);
    rig.armR.sh.rotation.z = lerp(rig.armR.sh.rotation.z, 0.2, dt * 5);
    rig.legL.hip.rotation.x = lerp(rig.legL.hip.rotation.x, 0.1, dt * 4);
    rig.legR.hip.rotation.x = lerp(rig.legR.hip.rotation.x, -0.1, dt * 4);
  } else {
    const swing = Math.sin(p.anim);
    const amp = 0.28 + run * 0.75;
    rig.legL.hip.rotation.x = swing * amp;
    rig.legR.hip.rotation.x = -swing * amp;
    const bendL = Math.max(0, -swing) * (0.4 + run * 1.0);
    const bendR = Math.max(0, swing) * (0.4 + run * 1.0);
    rig.legL.knee.rotation.x = -bendL;
    rig.legR.knee.rotation.x = -bendR;
    rig.armL.sh.rotation.z = -0.12 - run * 0.08;
    rig.armR.sh.rotation.z = 0.12 + run * 0.08;
    rig.armL.sh.rotation.x = -swing * (0.35 + run * 0.65);
    rig.armR.sh.rotation.x = swing * (0.35 + run * 0.65);
    rig.armL.el.rotation.x = lerp(rig.armL.el.rotation.x, -0.35 - run * 0.45, dt * 10);
    rig.armR.el.rotation.x = lerp(rig.armR.el.rotation.x, -0.35 - run * 0.45, dt * 10);
    rig.upper.rotation.x = lerp(rig.upper.rotation.x, run * 0.16, dt * 6);
    rig.headG.rotation.x = lerp(rig.headG.rotation.x, -run * 0.12, dt * 6);
    rig.headG.rotation.y = lerp(rig.headG.rotation.y, clamp((MATCH.ball.pos.z - p.pos.z) * 0.02, -0.5, 0.5), dt * 3);
    rig.legL.hip.position.x = -0.097;
    rig.legR.hip.position.x = 0.097;
  }

  // kick
  if (p.kick > 0) {
    const k = 1 - p.kick / 0.42;
    rig.legR.hip.rotation.x = lerp(-0.7, 1.25, Math.min(1, k * 1.7));
    rig.legR.knee.rotation.x = -0.25;
    rig.upper.rotation.x = 0.2;
    rig.armL.sh.rotation.x = 0.9;
    rig.armR.sh.rotation.x = -0.8;
  }

  // keeper dive
  if (p.gk && p.dive > 0) {
    const d = Math.sin(Math.min(1, p.dive) * Math.PI * 0.9);
    obj.rotation.z = p.diveDir * d * 1.15;
    obj.position.y = PITCH_Y + d * 0.35;
    rig.armL.sh.rotation.z = -1.9 * d;
    rig.armR.sh.rotation.z = 1.9 * d;
    rig.legL.hip.rotation.x = -0.3 * d;
  } else {
    obj.rotation.z = lerp(obj.rotation.z, 0, Math.min(1, dt * 8));
    obj.position.y = PITCH_Y + bob + jumpY;
  }
  if (!p.gk) obj.position.y = PITCH_Y + bob * 0.6 + jumpY;
}

/* ------------------------------ main update ------------------------------ */
function updatePlayers(dt, t) {
  crowdUniforms.uTime.value = t;
  crowdUniforms.uExcite.value = damp(crowdUniforms.uExcite.value, S.match ? 0.12 : 0, 1.4, dt);

  if (S.match) {
    if (MATCH.state === 'play') {
      simulate(dt);
    } else if (MATCH.state === 'goal') {
      MATCH.timer -= dt;
      MATCH.time += dt;
      if (MATCH.timer <= 0.001) {
        MATCH.state = 'play';
        kickoff(MATCH.kickoffTeam);
      }
    } else if (MATCH.state === 'fulltime') {
      MATCH.timer -= dt;
      if (MATCH.timer <= 0.001) {
        MATCH.score = [0, 0];
        MATCH.minute = 0;
        MATCH.scriptIdx = 0;
        MATCH.time = 0;
        MATCH.saves = 0;
        MATCH.shots = [0, 0];
        kickoff(0, true);
        updateMatchScreen(true);
      }
    }
  }

  for (const p of players) animatePlayer(p, dt, t);

  // ball mesh
  if (ball) {
    ball.position.copy(MATCH.ball.pos);
    const v = MATCH.ball.vel;
    const spin = Math.hypot(v.x, v.z);
    if (spin > 0.05) {
      const ax = new THREE.Vector3(-v.z, 0, v.x).normalize();
      ball.rotateOnWorldAxis(ax, (spin * dt) / FIELD.R);
    }
    ball.visible = S.match;
    if (ballShadow) {
      ballShadow.position.set(ball.position.x, PITCH_Y + 0.012, ball.position.z);
      const h = clamp(1 - (ball.position.y - PITCH_Y - FIELD.R) / 5, 0.15, 1);
      ballShadow.scale.setScalar(0.65 + h * 0.55);
      ballShadow.material.opacity = 0.3 * h;
      ballShadow.visible = S.match;
    }
  }

  // match screen refresh
  MATCH.screenTick += dt;
  if (MATCH.screenTick > 0.22) { MATCH.screenTick = 0; updateMatchScreen(); }
  updateScoreHUD();
}

/* ------------------------------ big screen ------------------------------ */
function updateMatchScreen(force) {
  if (!screenCtx) return;
  const M = MATCH;
  const x = screenCtx, W = 768, H = 432;
  const goalFlash = M.state === 'goal' && M.timer > 4.2;

  x.fillStyle = '#04080f'; x.fillRect(0, 0, W, H);
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, goalFlash ? '#1b1405' : '#071426');
  g.addColorStop(1, '#04080f');
  x.fillStyle = g; x.fillRect(0, 0, W, H);

  // top branding bar
  x.fillStyle = '#FFD21F'; x.fillRect(0, 0, W, 66);
  drawCrest(x, 46, 33, 56);
  x.fillStyle = '#0B2C6B';
  x.font = `700 34px ${F_DISPLAY}`;
  x.textAlign = 'left'; x.textBaseline = 'middle';
  x.fillText('KERALA BLASTERS', 84, 34);
  drawISL(x, W - 54, 33, 52);
  x.fillStyle = '#0B2C6B';
  x.font = `600 15px ${F_DISPLAY}`;
  x.textAlign = 'right';
  x.fillText('INDIAN SUPER LEAGUE', W - 92, 34);

  // score
  x.textAlign = 'center';
  x.fillStyle = '#FFFFFF';
  x.font = `700 96px ${F_DISPLAY}`;
  x.fillText(`${M.score[0]}  –  ${M.score[1]}`, W / 2, 190);
  x.fillStyle = '#8fd4ff';
  x.font = `600 30px ${F_DISPLAY}`;
  const mm = String(Math.min(90, Math.floor(M.minute))).padStart(2, '0');
  const ss = String(Math.floor((M.minute % 1) * 60)).padStart(2, '0');
  x.fillText(M.state === 'fulltime' ? 'FULL TIME' : `${mm}:${ss}`, W / 2, 246);

  x.fillStyle = 'rgba(255,255,255,.55)';
  x.font = `600 20px ${F_DISPLAY}`;
  x.fillText('KERALA BLASTERS   ·   MOHUN BAGAN SUPER GIANT', W / 2, 126);

  if (goalFlash) {
    x.fillStyle = 'rgba(255,210,31,.92)';
    x.fillRect(0, 284, W, 84);
    x.fillStyle = '#0B2C6B';
    x.font = `700 62px ${F_ML}`;
    x.fillText('ഗോൾ!', W / 2, 326);
    screenTex.needsUpdate = true;
    return;
  }

  // Malayalam strip
  x.fillStyle = '#FFD21F';
  x.font = `700 46px ${F_ML}`;
  x.fillText('എന്നും യെല്ലോ', W / 2, 312);
  x.fillStyle = 'rgba(255,255,255,.5)';
  x.font = `600 18px ${F_DISPLAY}`;
  x.fillText('YENNUM YELLOW  ·  YENNUM PROUD', W / 2, 348);
  x.fillStyle = 'rgba(255,255,255,.34)';
  x.font = `600 16px ${F_DISPLAY}`;
  x.fillText('MEDHAA · BATERY.AI · POLYCAB · SALPIDO · REYAUR · FREEMANS', W / 2, 396);

  screenTex.needsUpdate = true;
}

function updateScoreHUD() {
  const el = $('#score');
  if (!el) return;
  const M = MATCH;
  const mm = String(Math.min(90, Math.floor(M.minute))).padStart(2, '0');
  const ss = String(Math.floor((M.minute % 1) * 60)).padStart(2, '0');
  el.querySelector('.sb-score').textContent = `${M.score[0]} – ${M.score[1]}`;
  el.querySelector('.sb-clock').textContent = M.state === 'fulltime' ? 'FT' : `${mm}:${ss}`;
  el.classList.toggle('goal', M.state === 'goal');
  el.classList.toggle('ft', M.state === 'fulltime');
}
