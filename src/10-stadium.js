/* =========================================================================
   THE STADIUM — bowl, seats, facade, membrane roof, floodlights, pitch
   ========================================================================= */

const STAD = {
  A_in: 68, B_in: 48,           // inner bowl edge (superellipse)
  off: 20,                      // B = A - off everywhere
  lowerRows: 18, lowerDepth: 0.87, lowerRise: 0.50, y0: 1.4,
  concourse: 3.95,
  upperRows: 20, upperDepth: 0.82, upperRise: 0.64,
  backTop: 26.6,
  facadeA: 105.4,
  facadeTop: 19.6,
  roofInA: 89, roofOutA: 116,
  roofInY: 28.2, roofOutY: 34.6,
  NSEG: 200
};

const SEATS = [];               // {x,y,z,yaw,tier,bay,t}
const stadiumMats = {};

/* ---------------- procedural textures ---------------- */
function concreteTexture() {
  const [c, x] = makeCanvas(256, 256);
  x.fillStyle = '#cdc9bf'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    const v = 175 + Math.floor(rand() * 55);
    x.fillStyle = `rgba(${v},${v - 3},${v - 8},${0.06 + rand() * 0.1})`;
    x.fillRect(rand() * 256, rand() * 256, 1 + rand() * 3, 1 + rand() * 3);
  }
  return canvasTex(c, { repeat: [1, 1] });
}
function facadeTexture() {
  const [c, x] = makeCanvas(512, 512);
  x.fillStyle = '#dbd8cd'; x.fillRect(0, 0, 512, 512);
  // horizontal pour bands
  for (let i = 0; i < 10; i++) {
    x.fillStyle = i % 2 ? 'rgba(255,255,255,.20)' : 'rgba(120,120,112,.12)';
    x.fillRect(0, i * 51, 512, 51);
    x.fillStyle = 'rgba(90,90,84,.16)';
    x.fillRect(0, i * 51, 512, 2);
  }
  // recessed glazing / louvre strips
  x.fillStyle = 'rgba(44,58,64,.85)'; x.fillRect(0, 96, 512, 30);
  x.fillStyle = 'rgba(44,58,64,.85)'; x.fillRect(0, 300, 512, 26);
  x.fillStyle = 'rgba(255,255,255,.34)'; x.fillRect(0, 90, 512, 7);
  x.fillStyle = 'rgba(255,255,255,.34)'; x.fillRect(0, 294, 512, 7);
  // base shadow band
  x.fillStyle = 'rgba(92,92,86,.35)'; x.fillRect(0, 0, 512, 44);
  // mullions
  x.fillStyle = 'rgba(70,74,76,.30)';
  for (let i = 0; i < 22; i++) x.fillRect(i * 24, 0, 2, 512);
  return canvasTex(c, { repeat: [1, 1] });
}
function adTexture() {
  const [c, x] = makeCanvas(2048, 128);
  x.fillStyle = '#101418'; x.fillRect(0, 0, 2048, 128);
  const items = [
    ['KERALA BLASTERS', '#ffd21f', '#0b0f14'],
    ['JLN STADIUM · KALOOR', '#ffffff', '#123e8a'],
    ['MANJAPPADA', '#0b0f14', '#ffd21f'],
    ['KOCHI', '#ffd21f', '#8c1d1d'],
    ['#YELLOWARMY', '#0b0f14', '#ffd21f'],
    ['KALOOR', '#d9f4ff', '#0d5f77']
  ];
  let px = 0;
  while (px < 2048) {
    for (const [txt, fg, bg] of items) {
      const w = 300;
      x.fillStyle = bg; x.fillRect(px, 0, w, 128);
      x.fillStyle = fg;
      x.font = '700 50px system-ui, sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(txt, px + w / 2, 68, w - 24);
      px += w;
      if (px >= 2048) break;
    }
  }
  return canvasTex(c, { repeat: [1, 1] });
}
function netTexture() {
  const [c, x] = makeCanvas(128, 128);
  x.clearRect(0, 0, 128, 128);
  x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 2;
  for (let i = 0; i <= 128; i += 12) {
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.stroke();
    x.beginPath(); x.moveTo(0, i); x.lineTo(128, i); x.stroke();
  }
  const t = canvasTex(c, { repeat: [1, 1] });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ---------------- pitch ---------------- */
function buildPitch() {
  const W = 2048, H = 1360, PW = 120, PH = 80;
  const [c, x] = makeCanvas(W, H);
  const sx = W / PW, sz = H / PH;
  const px = (v) => (v + PW / 2) * sx;
  const pz = (v) => (v + PH / 2) * sz;

  x.fillStyle = '#2f7a33'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 20; i++) {
    x.fillStyle = i % 2 ? '#35853a' : '#2d7831';
    x.fillRect(i * (W / 20), 0, W / 20 + 1, H);
  }
  for (let i = 0; i < 26000; i++) {
    const g = 60 + Math.floor(rand() * 90);
    x.fillStyle = `rgba(${20 + rand() * 30},${g},${25 + rand() * 30},.13)`;
    x.fillRect(rand() * W, rand() * H, 1 + rand() * 3, 1 + rand() * 2);
  }
  for (const gx of [-52.5, 52.5]) {
    const g = x.createRadialGradient(px(gx), pz(0), 0, px(gx), pz(0), 90);
    g.addColorStop(0, 'rgba(190,180,120,.18)'); g.addColorStop(1, 'rgba(190,180,120,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px(gx), pz(0), 90, 0, TAU); x.fill();
  }

  x.strokeStyle = 'rgba(246,250,248,.95)';
  x.lineWidth = 3.4;
  const L = 105, Wd = 68;
  x.strokeRect(px(-L / 2), pz(-Wd / 2), L * sx, Wd * sz);
  x.beginPath(); x.moveTo(px(0), pz(-Wd / 2)); x.lineTo(px(0), pz(Wd / 2)); x.stroke();
  x.beginPath(); x.arc(px(0), pz(0), 9.15 * sx, 0, TAU); x.stroke();
  x.fillStyle = 'rgba(246,250,248,.95)';
  x.beginPath(); x.arc(px(0), pz(0), 0.5 * sx, 0, TAU); x.fill();

  for (const s of [-1, 1]) {
    const gl = s * L / 2;
    x.strokeRect(px(gl), pz(-20.16), -s * 16.5 * sx, 40.32 * sz);
    x.strokeRect(px(gl), pz(-9.16), -s * 5.5 * sx, 18.32 * sz);
    x.beginPath(); x.arc(px(gl - s * 11), pz(0), 0.42 * sx, 0, TAU); x.fill();
    const arcStart = s > 0 ? Math.PI * 0.795 : -Math.PI * 0.205;
    x.beginPath();
    x.arc(px(gl - s * 11), pz(0), 9.15 * sx, arcStart, arcStart + Math.PI * 0.41);
    x.stroke();
    for (const cz of [-1, 1]) {
      x.beginPath(); x.arc(px(gl), pz(cz * Wd / 2), 1.0 * sx, 0, TAU); x.stroke();
    }
  }

  const tex = canvasTex(c);
  tex.anisotropy = Math.min(Q.aniso, renderer.capabilities.getMaxAnisotropy());

  const pitch = new THREE.Mesh(
    new THREE.PlaneGeometry(PW, PH),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.94, metalness: 0 })
  );
  pitch.rotation.x = -Math.PI / 2;
  pitch.position.y = 0.12;
  pitch.receiveShadow = true;
  world.add(pitch);
  stadiumMats.pitch = pitch.material;
}

/* ---------------- apron between bowl and pitch ---------------- */
function buildApron() {
  const shape = new THREE.Shape();
  const N = 220;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU;
    const [x, z] = ovalPoint(a, STAD.A_in, STAD.B_in);
    if (i === 0) shape.moveTo(x, z); else shape.lineTo(x, z);
  }
  const hole = new THREE.Path();
  const hx = 57, hz = 40;
  hole.moveTo(-hx, -hz); hole.lineTo(hx, -hz); hole.lineTo(hx, hz); hole.lineTo(-hx, hz); hole.lineTo(-hx, -hz);
  shape.holes.push(hole);

  const geo = new THREE.ShapeGeometry(shape, 24);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: 0xb4b1a6, roughness: 0.92, metalness: 0.02, map: concreteTexture()
  }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.06;
  mesh.receiveShadow = true;
  world.add(mesh);
}

/* ---------------- bowl (swept staircase) ---------------- */
function buildBowl() {
  const profile = [];
  let A = STAD.A_in, y = STAD.y0;
  profile.push({ A, y: 0.05 });
  profile.push({ A: A, y });
  for (let i = 0; i < STAD.lowerRows; i++) {
    profile.push({ A: A + STAD.lowerDepth, y });
    A += STAD.lowerDepth;
    if (i < STAD.lowerRows - 1) { y += STAD.lowerRise; profile.push({ A, y }); }
    else { y += STAD.lowerRise; profile.push({ A: A + STAD.concourse, y }); }
  }
  A += STAD.concourse;
  STAD.lowerEndA = A - STAD.concourse;
  STAD.concEndA = A;
  STAD.concY = y;
  for (let i = 0; i < STAD.upperRows; i++) {
    y += STAD.upperRise;
    profile.push({ A, y });
    profile.push({ A: A + STAD.upperDepth, y });
    A += STAD.upperDepth;
  }
  profile.push({ A, y: STAD.backTop });
  STAD.topA = A;
  STAD.upperTopY = y - STAD.upperRise;

  const N = STAD.NSEG, J = profile.length;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * TAU;
    for (let j = 0; j < J; j++) {
      const p = profile[j];
      const [x, z] = ovalPoint(t, p.A, p.A - STAD.off);
      pos.push(x, p.y, z);
      uv.push(i / N * 26, j / J * 4);
    }
  }
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < J - 1; j++) {
      const a = i * J + j, b = (i + 1) * J + j, c2 = (i + 1) * J + j + 1, d = i * J + j + 1;
      idx.push(a, b, d, b, c2, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  const bowl = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: 0x9d9a90, roughness: 0.96, metalness: 0.02, side: THREE.DoubleSide,
    map: concreteTexture(), flatShading: true
  }));
  bowl.receiveShadow = true;
  bowl.castShadow = true;
  world.add(bowl);
  stadiumMats.bowl = bowl.material;

  /* ---- seats: very light 2-quad geometry, instanced ---- */
  const seatGeo = (() => {
    const g = new THREE.BufferGeometry();
    const v = new Float32Array([
      // pan
      -0.23, 0.44, -0.16, 0.23, 0.44, -0.16, 0.23, 0.44, 0.24, -0.23, 0.44, 0.24,
      // back
      -0.23, 0.44, 0.24, 0.23, 0.44, 0.24, 0.23, 0.98, 0.30, -0.23, 0.98, 0.30
    ]);
    const n = new Float32Array([
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
      0, 0.3, -1, 0, 0.3, -1, 0, 0.3, -1, 0, 0.3, -1
    ]);
    const u = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1]);
    g.setAttribute('position', new THREE.BufferAttribute(v, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(u, 2));
    g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
    return g;
  })();

  const rows = [];
  // lower rows
  {
    let A2 = STAD.A_in, y2 = STAD.y0;
    for (let i = 0; i < STAD.lowerRows; i++) {
      rows.push({ A: A2 + STAD.lowerDepth * 0.5, y: y2, tier: 0 });
      A2 += STAD.lowerDepth; y2 += STAD.lowerRise;
    }
    let A3 = STAD.concEndA, y3 = STAD.concY;
    for (let i = 0; i < STAD.upperRows; i++) {
      y3 += STAD.upperRise;
      rows.push({ A: A3 + STAD.upperDepth * 0.5, y: y3, tier: 1 });
      A3 += STAD.upperDepth;
    }
  }

  const matrices = [];
  const colors = [];
  const dummy = new THREE.Object3D();
  const tmpColor = new THREE.Color();
  const BAYS = 24;

  for (const row of rows) {
    const Arow = row.A, Brow = Arow - STAD.off;
    const SAMP = 420;
    const tabs = new Float32Array(SAMP + 1), sabs = new Float32Array(SAMP + 1);
    let acc = 0, pvx = Arow, pvz = 0;
    for (let i = 0; i <= SAMP; i++) {
      const t = i / SAMP * TAU;
      const [x, z] = ovalPoint(t, Arow, Brow);
      if (i > 0) acc += Math.hypot(x - pvx, z - pvz);
      tabs[i] = t; sabs[i] = acc; pvx = x; pvz = z;
    }
    const perimeter = acc;
    const spacing = row.tier === 0 ? Q.seatSpacing : Q.seatSpacing + 0.02;
    const count = Math.max(40, Math.floor(perimeter / spacing));
    const seg = perimeter / BAYS;
    let cursor = 0;
    for (let k = 0; k < count; k++) {
      const s = (k + 0.5) * (perimeter / count);
      if ((s % seg) < 0.85 || (s % seg) > seg - 0.85) continue;
      while (cursor < SAMP - 1 && sabs[cursor + 1] < s) cursor++;
      const f = (s - sabs[cursor]) / ((sabs[cursor + 1] - sabs[cursor]) || 1);
      const t = lerp(tabs[cursor], tabs[cursor + 1], f);
      const [x, z] = ovalPoint(t, Arow, Brow);
      const yaw = Math.atan2(x, z);
      dummy.position.set(x, row.y + 0.02, z);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
      const bay = Math.floor(t / TAU * BAYS) % BAYS;
      SEATS.push({ x, y: row.y + 0.02, z, yaw, tier: row.tier, bay, t });

      if (row.tier === 0) {
        if (bay === 6 || bay === 18) tmpColor.set('#1b4b93');
        else if (bay === 12 || bay === 0) tmpColor.set('#c98f22');
        else tmpColor.set('#d8a52c');
      } else {
        const pal = [0x1f5fb8, 0xf2c21c, 0x0f8a46, 0xc9271f];
        tmpColor.setHex(pal[bay % 4]);
        tmpColor.offsetHSL(0, 0.06, -0.02);
      }
      if (row.tier === 0) tmpColor.offsetHSL(0, 0.10, -0.04);
      tmpColor.multiplyScalar(0.86 + rand() * 0.12);
      colors.push(tmpColor.r, tmpColor.g, tmpColor.b);
    }
  }

  const seatMesh = new THREE.InstancedMesh(seatGeo, new THREE.MeshStandardMaterial({
    roughness: 0.78, metalness: 0.05, side: THREE.DoubleSide
  }), matrices.length);
  matrices.forEach((m, i) => seatMesh.setMatrixAt(i, m));
  seatMesh.instanceMatrix.needsUpdate = true;
  seatMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(colors), 3);
  seatMesh.instanceColor.needsUpdate = true;
  seatMesh.frustumCulled = false;
  seatMesh.receiveShadow = true;
  world.add(seatMesh);
  stadiumMats.seats = seatMesh.material;

  /* ---- aisle stairs & tier dividers ---- */
  {
    const stairMat = new THREE.MeshStandardMaterial({ color: 0xbfbcb2, roughness: 0.95 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xd9d6cb, roughness: 0.9, metalness: 0.04 });
    const BAYS = 24;
    const tiers = [
      { A0: STAD.A_in, y0: STAD.y0, rows: STAD.lowerRows, depth: STAD.lowerDepth, rise: STAD.lowerRise },
      { A0: STAD.concEndA, y0: STAD.concY, rows: STAD.upperRows, depth: STAD.upperDepth, rise: STAD.upperRise }
    ];
    for (const tier of tiers) {
      for (let b = 0; b < BAYS; b++) {
        const t = b / BAYS * TAU;
        const A1 = tier.A0 + 0.2, A2 = tier.A0 + tier.rows * tier.depth - 0.1;
        const yTop = tier.y0 + (tier.rows - 1) * tier.rise;
        // stair (a ramp strip in the aisle gap)
        const [x1, z1] = ovalPoint(t, A1, A1 - STAD.off);
        const [x2, z2] = ovalPoint(t, A2, A2 - STAD.off);
        const seg = new THREE.BufferGeometry();
        seg.setAttribute('position', new THREE.Float32BufferAttribute([
          x1 - 0.7, tier.y0, z1, x2 - 0.7, yTop, z2, x2 + 0.7, yTop, z2,
          x1 - 0.7, tier.y0, z1, x2 + 0.7, yTop, z2, x1 + 0.7, tier.y0, z1
        ], 3));
        seg.computeVertexNormals();
        const m = new THREE.Mesh(seg, stairMat);
        m.receiveShadow = true;
        world.add(m);
        // handrail walls that follow the slope at the aisle edges
        for (const sgn of [-1, 1]) {
          const [xa, za] = ovalPoint(t, A1, A1 - STAD.off);
          const [xb, zb] = ovalPoint(t, A2, A2 - STAD.off);
          const dx = xb - xa, dz = zb - za;
          const len = Math.hypot(dx, dz);
          const nx = dz / len * sgn * 0.9, nz = -dx / len * sgn * 0.9;
          const yA = tier.y0, yB = yTop + tier.rise;
          const rail = new THREE.Mesh(new THREE.BufferGeometry(), wallMat);
          rail.geometry.setAttribute('position', new THREE.Float32BufferAttribute([
            xa + nx, yA, za + nz, xb + nx, yB, zb + nz, xb + nx, yB + 0.95, zb + nz,
            xa + nx, yA, za + nz, xb + nx, yB + 0.95, zb + nz, xa + nx, yA + 0.95, za + nz
          ], 3));
          rail.geometry.computeVertexNormals();
          rail.material = new THREE.MeshStandardMaterial({ color: 0xb9b6ab, roughness: 0.9, metalness: 0.1, side: THREE.DoubleSide });
          world.add(rail);
        }
      }
    }
  }

  /* ---- concourse branding band ---- */
  {
    const [bc, bx] = makeCanvas(2048, 128);
    const cols = ['#123e8a', '#ffd21f', '#ffd21f', '#0b2c6b', '#ffd21f', '#b52a22'];
    for (let i = 0; i < 24; i++) {
      bx.fillStyle = cols[i % cols.length];
      bx.fillRect(i * 86, 0, 86, 128);
      if (cols[i % cols.length] === '#ffd21f') {
        bx.fillStyle = '#0B2C6B';
        bx.font = `700 34px ${typeof F_ML === 'string' ? F_ML : 'system-ui, sans-serif'}`;
        bx.textAlign = 'center'; bx.textBaseline = 'middle';
        bx.fillText(['മഞ്ഞപ്പട', 'യെന്നും യെല്ലോ', 'കൊച്ചി'][i % 3], i * 86 + 43, 66, 80);
      } else {
        bx.fillStyle = 'rgba(255,255,255,.94)';
        bx.font = `700 30px ${typeof F_DISPLAY === 'string' ? F_DISPLAY : 'system-ui, sans-serif'}`;
        bx.textAlign = 'center'; bx.textBaseline = 'middle';
        bx.fillText(['KALOOR', 'BLASTERS', 'YENNUM YELLOW', 'MANJAPPADA'][i % 4], i * 86 + 43, 66, 80);
      }
    }
    const btex = canvasTex(bc);
    const gp = [], gi = [], uv2 = [];
    const y1 = STAD.concY - 2.4, y2 = STAD.concY - 0.15;
    const NB = 200;
    for (let i = 0; i <= NB; i++) {
      const t = i / NB * TAU;
      const [x, z] = ovalPoint(t, STAD.concEndA + 0.05, STAD.concEndA + 0.05 - STAD.off);
      gp.push(x, y1, z, x, y2, z);
      uv2.push(i / NB * 24, 0, i / NB * 24, 1);
    }
    for (let i = 0; i < NB; i++) { const a = i * 2; gi.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
    gg.setAttribute('uv', new THREE.Float32BufferAttribute(uv2, 2));
    gg.setIndex(gi); gg.computeVertexNormals();
    const bmesh = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({
      map: btex, roughness: 0.75, emissive: 0xffffff, emissiveMap: btex, emissiveIntensity: 0.16,
      side: THREE.DoubleSide
    }));
    world.add(bmesh);
    EMISSIVE_NIGHT.push({ mat: bmesh.material, max: 0.5, color: 0xffffff, keepColor: true });
  }

  /* ---- concourse rail ---- */
  const railPts = [];
  const rA = STAD.concEndA + 0.4;
  for (let i = 0; i <= 200; i++) {
    const t = i / 200 * TAU;
    const [x, z] = ovalPoint(t, rA, rA - STAD.off);
    railPts.push(new THREE.Vector3(x, STAD.concY + 1.05, z));
  }
  const rail = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts, true), 240, 0.055, 5, true),
    new THREE.MeshStandardMaterial({ color: 0x2c3237, roughness: 0.6, metalness: 0.5 }));
  world.add(rail);
}

/* ---------------- facade + structural columns ---------------- */
function buildFacade() {
  const N = 220, A = STAD.facadeA, B = A - STAD.off;
  const pos = [], uv = [], idx = [], nor = [];
  const yTop = STAD.facadeTop;
  for (let i = 0; i <= N; i++) {
    const t = i / N * TAU;
    const [x, z] = ovalPoint(t, A, B);
    pos.push(x, 0, z, x, yTop, z);
    uv.push(i / N * 26, 0, i / N * 26, 1);
    nor.push(x, 0, z, x, 0, z);
  }
  for (let i = 0; i < N; i++) {
    const a = i * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  const wall = new THREE.Mesh(g, new THREE.MeshStandardMaterial({
    color: 0xe0ddd2, roughness: 0.9, metalness: 0.03,
    map: facadeTexture(), side: THREE.DoubleSide
  }));
  wall.castShadow = true; wall.receiveShadow = true;
  world.add(wall);

  // alternating panel bay tone for depth
  {
    const bays = 48, pp = [], ii = [];
    for (let i = 0; i <= bays; i++) {
      const t0 = i / bays * TAU;
      for (const f of [0, 1]) {
        const t = t0 + f * (TAU / bays);
        const [x, z] = ovalPoint(t, A + 0.12, B + 0.12);
        pp.push(x, 0, z, x, yTop, z);
      }
    }
    for (let i = 0; i < bays; i++) {
      if (i % 2) continue;
      const a = i * 4;
      ii.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    const pg2 = new THREE.BufferGeometry();
    pg2.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
    pg2.setIndex(ii); pg2.computeVertexNormals();
    const panels = new THREE.Mesh(pg2, new THREE.MeshStandardMaterial({
      color: 0xf4f1e6, roughness: 0.85, metalness: 0.05, side: THREE.DoubleSide,
      transparent: true, opacity: 0.55
    }));
    world.add(panels);
  }

  // vertical fins
  const finGeo = new THREE.BoxGeometry(0.30, 1, 1.0);
  const finMat = new THREE.MeshStandardMaterial({ color: 0xd2cfc4, roughness: 0.72, metalness: 0.14 });
  const dummy = new THREE.Object3D();
  const fins = [];
  for (let i = 0; i < 112; i++) {
    const t = i / 112 * TAU;
    const [x, z] = ovalPoint(t, A + 0.45, B + 0.45);
    dummy.position.set(x, yTop / 2, z);
    dummy.rotation.set(0, Math.atan2(x, z) + Math.PI / 2, 0);
    dummy.scale.set(1, yTop, 1);
    dummy.updateMatrix();
    fins.push(dummy.matrix.clone());
  }
  const finMesh = new THREE.InstancedMesh(finGeo, finMat, fins.length);
  fins.forEach((m, i) => finMesh.setMatrixAt(i, m));
  finMesh.castShadow = true;
  finMesh.instanceMatrix.needsUpdate = true;
  world.add(finMesh);

  // glazing bands
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x22424c, roughness: 0.18, metalness: 0.8, side: THREE.DoubleSide,
    emissive: 0x0a1a1e, emissiveIntensity: 1
  });
  stadiumMats.glass = glassMat;
  EMISSIVE_NIGHT.push({ mat: glassMat, max: 0.34, color: 0x2a6070 });

  const band = (y1, y2, A2) => {
    const gp = [], gi = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N * TAU;
      const [x, z] = ovalPoint(t, A2, A2 - STAD.off);
      gp.push(x, y1, z, x, y2, z);
    }
    for (let i = 0; i < N; i++) { const a = i * 2; gi.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
    gg.setIndex(gi); gg.computeVertexNormals();
    const m = new THREE.Mesh(gg, glassMat);
    world.add(m);
  };
  band(2.1, 6.2, A + 0.66);
  band(12.6, 16.1, A + 0.66);

  // fascia rings
  const ringAt = (y, rad, color, tube) => {
    const pts = [];
    for (let i = 0; i <= 240; i++) {
      const t = i / 240 * TAU;
      const [x, z] = ovalPoint(t, A + rad, A + rad - STAD.off);
      pts.push(new THREE.Vector3(x, y, z));
    }
    const m = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 300, tube, 6, true),
      new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.12 }));
    m.castShadow = true;
    world.add(m);
  };
  ringAt(yTop + 0.35, 0.3, 0xf2efe4, 0.72);
  ringAt(yTop + 0.3, 3.6, 0xf1eee3, 0.34);
  ringAt(9.2, 1.0, 0xe9e6da, 0.42);

  // V steel columns to roof
  const colMat = new THREE.MeshStandardMaterial({ color: 0xd6d3c8, roughness: 0.5, metalness: 0.6 });
  const colGeo = new THREE.CylinderGeometry(0.40, 0.68, 1, 9);
  const cols = [];
  for (let i = 0; i < 32; i++) {
    const t = i / 32 * TAU;
    const [x1, z1] = ovalPoint(t, A + 9.0, B + 9.0);
    const [x2, z2] = ovalPoint(t, STAD.roofOutA - 1.2, STAD.roofOutA - 1.2 - STAD.off);
    const from = new THREE.Vector3(x1, 0, z1);
    const to = new THREE.Vector3(x2, STAD.roofOutY - 1.4, z2);
    const len = from.distanceTo(to);
    dummy.position.copy(from).add(to).multiplyScalar(0.5);
    dummy.scale.set(1, len, 1);
    dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    dummy.updateMatrix();
    cols.push(dummy.matrix.clone());
  }
  const colMesh = new THREE.InstancedMesh(colGeo, colMat, cols.length);
  cols.forEach((m, i) => colMesh.setMatrixAt(i, m));
  colMesh.castShadow = true;
  colMesh.instanceMatrix.needsUpdate = true;
  world.add(colMesh);

  // paved apron around the stadium
  {
    const p = [], ii = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N * TAU;
      const [x, z] = ovalPoint(t, A + 19, B + 19);
      p.push(x, 0, z);
    }
    for (let i = 0; i <= N; i++) {
      const t = i / N * TAU;
      const [x, z] = ovalPoint(t, A + 1.2, B + 1.2);
      p.push(x, 0, z);
    }
    const total = N + 1;
    for (let i = 0; i < N; i++) {
      const a = i, b = i + 1, c2 = total + i, d = total + i + 1;
      ii.push(a, c2, b, b, c2, d);
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    pg.setIndex(ii); pg.computeVertexNormals();
    const plinth = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ color: 0x8f8d84, roughness: 0.95 }));
    plinth.receiveShadow = true;
    plinth.position.y = 0.09;
    world.add(plinth);
  }

  makeSign('JAWAHARLAL NEHRU STADIUM', 6, 15.6);
  makeSign('KALOOR · KOCHI', 180, 15.6);

  buildEntrances();
}

/* four grand gate portals with steps */
function buildEntrances() {
  const conc = new THREE.MeshStandardMaterial({ color: 0xd6d3c8, roughness: 0.88, metalness: 0.05 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2c3a42, roughness: 0.35, metalness: 0.5 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xf2efe4, roughness: 0.7, metalness: 0.1 });
  const stepMat = new THREE.MeshStandardMaterial({ color: 0xb4b2a7, roughness: 0.95 });
  for (let k = 0; k < 4; k++) {
    const ang = (k * 90 + 90) * DEG;
    const [px, pz] = ovalPoint(ang, STAD.facadeA + 1.2, STAD.facadeA + 1.2 - STAD.off);
    const yaw = Math.atan2(px, pz);
    const g = new THREE.Group();
    g.position.set(px, 0, pz);
    g.rotation.y = yaw;
    const g1 = new THREE.Mesh(new THREE.BoxGeometry(15, 9.4, 3.2), conc);
    g1.position.set(0, 4.7, 0);
    g.add(g1);
    const g2 = new THREE.Mesh(new THREE.BoxGeometry(12.4, 7.4, 1.4), dark);
    g2.position.set(0, 3.9, 1.0);
    g.add(g2);
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(20, 0.8, 9), roofMat);
    c1.position.set(0, 9.9, 3.6);
    c1.castShadow = true;
    g.add(c1);
    for (const sx of [-8, 8]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 9.6, 8), conc);
      col.position.set(sx, 4.8, 7.0);
      col.castShadow = true;
      g.add(col);
    }
    for (let i = 0; i < 5; i++) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(18 - i * 0.6, 0.34, 1.5), stepMat);
      st.position.set(0, 0.17 + (4 - i) * 0.34, 8.4 + i * 1.5);
      st.receiveShadow = true;
      g.add(st);
    }
    const [nc, nx] = makeCanvas(256, 128);
    nx.fillStyle = '#101820';
    nx.fillRect(0, 0, 256, 128);
    nx.fillStyle = '#ffd21f';
    nx.font = '800 74px system-ui, sans-serif';
    nx.textAlign = 'center'; nx.textBaseline = 'middle';
    nx.fillText('GATE ' + (k + 1), 128, 66);
    const signMat = new THREE.MeshBasicMaterial({ map: canvasTex(nc), toneMapped: false });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 3.1), signMat);
    sign.position.set(0, 11.2, 1.7);
    sign.rotation.y = Math.PI;
    g.add(sign);
    world.add(g);
  }
}

const nameSigns = [];
function makeSign(text, angleDeg, y) {
  const [c, x] = makeCanvas(1024, 128);
  x.clearRect(0, 0, 1024, 128);
  x.fillStyle = '#f3f1e8';
  x.font = '700 62px system-ui, "Helvetica Neue", sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 512, 66);
  const tex = canvasTex(c);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(44, 5.5), mat);
  const angle = angleDeg * DEG;
  const A = STAD.facadeA + 1.3;
  const [px, pz] = ovalPoint(angle, A, A - STAD.off);
  mesh.position.set(px, y, pz);
  mesh.rotation.y = Math.atan2(px, pz);
  nameSigns.push(mesh);
  world.add(mesh);
}

/* keep wordmarks readable: fade them when the camera is close or high */
function updateSigns() {
  // wordmarks only make sense from outside the bowl
  const A = ovalRadiusAt(camera.position.x, camera.position.z);
  const fade = clamp((A - 111) / 16, 0, 1);
  for (const m of nameSigns) {
    m.material.opacity = fade;
    m.material.transparent = true;
    m.visible = fade > 0.03;
  }
}

/* ---------------- roof ---------------- */
function buildRoof() {
  const N = 200, M = 18;
  const bays = 16;
  const yIn = t => STAD.roofInY + 0.45 * Math.cos(TAU * bays * t);
  const yOut = t => STAD.roofOutY + 2.3 * Math.cos(TAU * bays * t);

  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const ang = t * TAU;
    for (let j = 0; j <= M; j++) {
      const u = j / M;
      const A = lerp(STAD.roofInA, STAD.roofOutA, u);
      const B = A - STAD.off;
      const [x, z] = ovalPoint(ang, A, B);
      let y = lerp(yIn(t), yOut(t), smooth(u));
      y += Math.sin(Math.PI * u) * 0.5;
      y -= Math.abs(Math.sin(TAU * 16 * t)) * 0.55 * Math.sin(Math.PI * u);
      pos.push(x, y, z);
      uv.push(t * 26, u * 3);
    }
  }
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < M; j++) {
      const a = i * (M + 1) + j, b = (i + 1) * (M + 1) + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  const membrane = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: 0xf8f6ee, roughness: 0.8, metalness: 0.03, side: THREE.DoubleSide,
    emissive: 0x4a515c, emissiveIntensity: 0.22
  }));
  membrane.castShadow = true; membrane.receiveShadow = true;
  world.add(membrane);
  stadiumMats.roof = membrane.material;
  EMISSIVE_NIGHT.push({ mat: membrane.material, max: 0.34, color: 0x6a7688 });

  const ribMat = new THREE.MeshStandardMaterial({ color: 0xdad7cc, roughness: 0.42, metalness: 0.55 });
  const ribGeos = [];
  const ribCount = 32;
  const ribY = (t, u) => lerp(yIn(t), yOut(t), smooth(u)) + Math.sin(Math.PI * u) * 0.5;

  for (let i = 0; i < ribCount; i++) {
    const t = i / ribCount;
    const ang = t * TAU;
    const pts = [];
    for (let j = 0; j <= 7; j++) {
      const u = j / 7;
      const A = lerp(STAD.roofInA, STAD.roofOutA, u);
      const [x, z] = ovalPoint(ang, A, A - STAD.off);
      pts.push(new THREE.Vector3(x, ribY(t, u) + 0.38, z));
    }
    ribGeos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.34, 6, false));
  }

  const ringPts = (u, yOff) => {
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const t = i / 200, ang = t * TAU;
      const A = lerp(STAD.roofInA, STAD.roofOutA, u);
      const [x, z] = ovalPoint(ang, A, A - STAD.off);
      pts.push(new THREE.Vector3(x, ribY(t, u) + yOff, z));
    }
    return new THREE.CatmullRomCurve3(pts, true);
  };
  ribGeos.push(new THREE.TubeGeometry(ringPts(0, 0.30), 240, 0.5, 7, true));
  ribGeos.push(new THREE.TubeGeometry(ringPts(1, 0.34), 280, 0.62, 7, true));
  ribGeos.push(new THREE.TubeGeometry(ringPts(0.5, 0.20), 260, 0.24, 5, true));
  const ribs = new THREE.Mesh(mergeGeoms(ribGeos), ribMat);
  ribs.castShadow = true;
  world.add(ribs);

  // under-roof radial beams (visible from inside)
  const beamGeos = [];
  for (let i = 0; i < 32; i++) {
    const t = i / 32, ang = t * TAU;
    const pts = [];
    for (let j = 0; j <= 5; j++) {
      const u = j / 5;
      const A = lerp(STAD.roofInA - 1.5, STAD.roofOutA - 1.5, u);
      const [x, z] = ovalPoint(ang, A, A - STAD.off);
      pts.push(new THREE.Vector3(x, ribY(t, u) - 0.55, z));
    }
    beamGeos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.18, 5, false));
  }
  const beams = new THREE.Mesh(mergeGeoms(beamGeos), new THREE.MeshStandardMaterial({
    color: 0x9aa0a2, roughness: 0.55, metalness: 0.5
  }));
  world.add(beams);

  // outer fascia: a slim band that follows the wavy roof edge
  {
    const pts = [];
    for (let i = 0; i <= 220; i++) {
      const t = i / 220, ang = t * TAU;
      const A = STAD.roofOutA + 0.35;
      const [x, z] = ovalPoint(ang, A, A - STAD.off);
      pts.push(new THREE.Vector3(x, yOut(t) + 0.05, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true);
    const fascia = new THREE.Mesh(new THREE.TubeGeometry(curve, 320, 0.55, 8, true),
      new THREE.MeshStandardMaterial({ color: 0xe4e2d8, roughness: 0.55, metalness: 0.3 }));
    fascia.castShadow = true;
    world.add(fascia);
    const drip = new THREE.Mesh(new THREE.TubeGeometry(curve, 320, 0.16, 6, true),
      new THREE.MeshStandardMaterial({ color: 0x8d9499, roughness: 0.5, metalness: 0.5 }));
    drip.position.y = -0.55;
    world.add(drip);
  }
}

/* ---------------- floodlight towers ---------------- */
function buildFloodlights() {
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xc7cccf, roughness: 0.45, metalness: 0.55,
    emissive: 0xfff2cd, emissiveIntensity: 0.12
  });
  const steel = new THREE.MeshStandardMaterial({ color: 0xc6c9cc, roughness: 0.45, metalness: 0.7 });
  const lampOn = new THREE.MeshBasicMaterial({ color: 0xfff7e0, toneMapped: false });
  const redMat = new THREE.MeshBasicMaterial({ color: 0xff3b30, toneMapped: false });

  for (let k = 0; k < 4; k++) {
    const ang = (45 + k * 90) * DEG;
    const [bx, bz] = ovalPoint(ang, 127.5, 107.5);
    const base = new THREE.Vector3(bx, 0, bz);
    const H = 59;
    const g = new THREE.Group();
    g.position.copy(base);

    const legGeos = [];
    const legs = [[-4.9, -4.9], [4.9, -4.9], [4.9, 4.9], [-4.9, 4.9]];
    for (const [lx, lz] of legs) {
      const top = new THREE.Vector3(lx * 0.30, H, lz * 0.30);
      const bot = new THREE.Vector3(lx, 0, lz);
      const len = bot.distanceTo(top);
      const geo = new THREE.CylinderGeometry(0.20, 0.34, len, 6).translate(0, len / 2, 0);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(bot).normalize());
      geo.applyQuaternion(q); geo.translate(bot.x, bot.y, bot.z);
      legGeos.push(geo);
    }
    for (let h = 1; h <= 6; h++) {
      const y = h / 6 * H;
      const f = lerp(1, 0.30, h / 6);
      const r = 4.9 * f;
      const corners = [[-r, -r], [r, -r], [r, r], [-r, r], [-r, -r]];
      for (let i = 0; i < 4; i++) {
        const a = new THREE.Vector3(corners[i][0], y, corners[i][1]);
        const b = new THREE.Vector3(corners[i + 1][0], y, corners[i + 1][1]);
        const len = a.distanceTo(b);
        const geo = new THREE.CylinderGeometry(0.09, 0.09, len, 4).translate(0, len / 2, 0);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        geo.applyQuaternion(q); geo.translate(a.x, a.y, a.z);
        legGeos.push(geo);
        const a2 = new THREE.Vector3(corners[i][0] * (1 - 1 / 6), y + H / 6, corners[i][1] * (1 - 1 / 6));
        const len2 = a.distanceTo(a2);
        const geo2 = new THREE.CylinderGeometry(0.055, 0.055, len2, 4).translate(0, len2 / 2, 0);
        const q2 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), a2.clone().sub(a).normalize());
        geo2.applyQuaternion(q2); geo2.translate(a.x, a.y, a.z);
        legGeos.push(geo2);
      }
    }
    const lattice = new THREE.Mesh(mergeGeoms(legGeos), steel);
    lattice.castShadow = true;
    g.add(lattice);

    const head = new THREE.Group();
    head.position.set(0, H + 2.2, 0);
    head.rotation.y = Math.atan2(-bx, -bz);
    head.rotation.x = 0.24;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(16.5, 7.0, 0.7), headMat);
    frame.castShadow = true;
    head.add(frame);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 9; c++) {
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.36, 1.12, 0.3), lampOn);
        lamp.position.set(-6.4 + c * 1.6, 2.5 - r * 1.62, 0.5);
        head.add(lamp);
      }
    }
    const avi = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), redMat);
    avi.position.set(0, 3.9, 0);
    head.add(avi);
    g.add(head);

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xfff0c0, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    }));
    glow.scale.set(34, 34, 1);
    glow.position.set(0, H + 2.2, 0);
    g.add(glow);

    const beamLen = 280;
    const beamGeo = new THREE.ConeGeometry(40, beamLen, 20, 1, true).translate(0, -beamLen / 2, 0);
    const cone = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({
      color: 0xffeec2, transparent: true, opacity: 0, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    }));
    const dirTarget = new THREE.Vector3(-bx, 0, -bz).normalize();
    cone.position.set(0, H + 2, 0);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dirTarget);
    g.add(cone);

    world.add(g);

    const spot = new THREE.SpotLight(0xfff3d0, 0, 620, 0.55, 0.8, 0.0);
    spot.position.copy(base).add(new THREE.Vector3(0, H + 2.4, 0));
    const tgt = new THREE.Object3D();
    tgt.position.set(base.x * 0.08, 0, base.z * 0.08);
    scene.add(tgt);
    spot.target = tgt;
    scene.add(spot);

    floodLights.push({ spot, panelMat: headMat, cone, glow });
  }
}

/* ---------------- pitch furniture ---------------- */
function buildPitchFurniture() {
  const white = new THREE.MeshStandardMaterial({ color: 0xf6f8f6, roughness: 0.45, metalness: 0.15 });
  const goalGroup = new THREE.Group();
  const netTex = netTexture();
  netTex.repeat.set(7, 4);
  const netMat = new THREE.MeshBasicMaterial({ map: netTex, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });

  for (const s of [-1, 1]) {
    const gx = s * 52.5;
    const postGeo = new THREE.CylinderGeometry(0.09, 0.09, 2.44, 8).translate(0, 1.22, 0);
    for (const zz of [-3.66, 3.66]) {
      const p = new THREE.Mesh(postGeo, white);
      p.position.set(gx, 0.12, zz); p.castShadow = true; goalGroup.add(p);
    }
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 7.32, 8), white);
    bar.rotation.x = Math.PI / 2; bar.position.set(gx, 2.56, 0); bar.castShadow = true;
    goalGroup.add(bar);
    const depth = 2.2 * s;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(7.32, 2.44), netMat);
    back.rotation.y = Math.PI / 2;
    back.position.set(gx + depth, 1.34, 0);
    goalGroup.add(back);
    for (const zz of [-3.66, 3.66]) {
      const side = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.44), netMat);
      side.position.set(gx + depth / 2, 1.34, zz);
      goalGroup.add(side);
    }
    const top = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 7.32), netMat);
    top.rotation.x = Math.PI / 2; top.rotation.z = Math.PI / 2;
    top.position.set(gx + depth / 2, 2.56, 0);
    goalGroup.add(top);
  }
  world.add(goalGroup);

  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.6, 6),
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.6 }));
    pole.position.set(sx * 52.5, 0.9, sz * 34);
    world.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.38),
      new THREE.MeshStandardMaterial({ color: 0xffd21f, side: THREE.DoubleSide, emissive: 0x554400, emissiveIntensity: 0.2 }));
    flag.position.set(sx * 52.5 + 0.28, 1.55, sz * 34);
    world.add(flag);
  }

  const adTex = (typeof sponsorStripTexture === 'function') ? sponsorStripTexture() : adTexture();
  const mkBoard = (w, x, z, ry) => {
    const t = adTex.clone(); t.needsUpdate = true;
    t.wrapS = THREE.RepeatWrapping; t.repeat.set(w / 60, 1);
    const mat = new THREE.MeshBasicMaterial({ map: t, toneMapped: false });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.95), mat);
    board.position.set(x, 0.62, z);
    board.rotation.y = ry;
    world.add(board);
    AD_BOARDS.push(t);
  };
  mkBoard(104, 0, -39.5, 0);
  mkBoard(104, 0, 39.5, Math.PI);
  mkBoard(68, -56.5, 0, Math.PI / 2);
  mkBoard(68, 56.5, 0, -Math.PI / 2);

  const dugMat = new THREE.MeshStandardMaterial({ color: 0xe9ecef, roughness: 0.6, metalness: 0.1 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x1c2b3a, roughness: 0.7 });
  for (const dx of [-14, 14]) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(12, 2.5, 3.2), dugMat);
    box.position.set(dx, 1.25, 41);
    box.castShadow = true;
    world.add(box);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(12.1, 2.0, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x6a8a99, roughness: 0.2, metalness: 0.6, transparent: true, opacity: 0.45 }));
    glass.position.set(dx, 1.15, 39.4);
    world.add(glass);
    for (let i = 0; i < 8; i++) {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.7), seatMat);
      seat.position.set(dx - 4.5 + i * 1.3, 0.55, 41.6);
      world.add(seat);
    }
  }
}

/* ---------------- big screen ---------------- */
let screenCanvas, screenCtx, screenTex;
function buildScreen() {
  [screenCanvas, screenCtx] = makeCanvas(768, 432);
  screenTex = canvasTex(screenCanvas);
  const mat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), mat);
  mesh.position.set(-92, 21.4, 0);
  mesh.rotation.y = Math.PI / 2;
  world.add(mesh);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.55, 9.9, 17),
    new THREE.MeshStandardMaterial({ color: 0x14181c, roughness: 0.7, metalness: 0.4 }));
  frame.position.copy(mesh.position); frame.position.x -= 0.32;
  frame.castShadow = true;
  world.add(frame);
  const hanMat = new THREE.MeshStandardMaterial({ color: 0x2a3138, roughness: 0.5, metalness: 0.6 });
  for (const zz of [-5.5, 5.5]) {
    const h1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.0, 6), hanMat);
    h1.position.set(-92, 28.0, zz);
    world.add(h1);
  }
  drawScreen();
}
function drawScreen() {
  if (typeof updateMatchScreen === 'function') { updateMatchScreen(true); return; }
}

/* ---------------- build all ---------------- */
function buildStadium() {
  buildApron();
  buildBowl();
  buildFacade();
  buildRoof();
  buildFloodlights();
  buildPitch();
  buildPitchFurniture();
  buildScreen();
}
