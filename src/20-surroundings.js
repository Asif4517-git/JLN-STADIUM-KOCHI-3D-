/* =========================================================================
   REAL KALOOR — built from OpenStreetMap geometry of the stadium's streets
   (roads, buildings, canal, metro line, stations and land use)
   ========================================================================= */

const nightGlow = [];
const mixerObjects = [];

/* --------------------------------- ground --------------------------------- */
function groundTexture() {
  const [c, x] = makeCanvas(512, 512);
  x.fillStyle = '#5e6c47'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1100; i++) {
    const g = 70 + rand() * 60;
    x.fillStyle = `rgba(${g * 1.05},${g + 16},${g * 0.8},${0.05 + rand() * 0.10})`;
    x.beginPath();
    x.ellipse(rand() * 512, rand() * 512, 8 + rand() * 44, 6 + rand() * 30, rand() * TAU, 0, TAU);
    x.fill();
  }
  for (let i = 0; i < 380; i++) {
    x.fillStyle = `rgba(150,132,102,${0.03 + rand() * 0.10})`;
    x.beginPath();
    x.ellipse(rand() * 512, rand() * 512, 10 + rand() * 52, 5 + rand() * 22, rand() * TAU, 0, TAU);
    x.fill();
  }
  return canvasTex(c, { repeat: [1, 1] });
}

function buildGround() {
  const gt = groundTexture();
  gt.repeat.set(90, 90);
  const g = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000),
    new THREE.MeshStandardMaterial({ map: gt, roughness: 1, metalness: 0 }));
  g.rotation.x = -Math.PI / 2;
  g.position.y = -0.03;
  g.receiveShadow = true;
  world.add(g);
}

/* ------------------------------ polygon fills ------------------------------ */
function fillPolygons(list, colorFor, y, opts) {
  const pos = [], idx = [], col = [];
  const c = new THREE.Color();
  let base = 0;
  for (const item of list) {
    const p = item.p;
    if (!p || p.length < 6) continue;
    const n = p.length / 2;
    // fan triangulation from centroid (OSM footprints are mostly convex enough)
    let cx = 0, cz = 0;
    for (let i = 0; i < n; i++) { cx += p[i * 2]; cz += p[i * 2 + 1]; }
    cx /= n; cz /= n;
    pos.push(cx, y, cz);
    c.set(colorFor(item));
    col.push(c.r, c.g, c.b);
    for (let i = 0; i < n; i++) {
      pos.push(p[i * 2], y, p[i * 2 + 1]);
      col.push(c.r, c.g, c.b);
    }
    for (let i = 0; i < n; i++) {
      idx.push(base, base + 1 + i, base + 1 + ((i + 1) % n));
    }
    base += n + 1;
  }
  if (!idx.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.95, metalness: 0.0,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
  }));
  m.receiveShadow = true;
  world.add(m);
  return m;
}

function buildLand() {
  const lands = GEO.land.map(l => ({ ...l, p: l.p }));
  fillPolygons(lands, (l) => {
    switch (l.t) {
      case 'retail': return 0x8a8072;
      case 'commercial': return 0x87806f;
      case 'industrial': return 0x7f7a68;
      case 'cemetery': return 0x5e6d4a;
      default: return 0x69714f;
    }
  }, 0.02);
  fillPolygons(GEO.green.map(g => ({ ...g, p: g.p })), (g) => (g.t === 0 ? 0x4b7a3a : 0x527d42), 0.06);
}

function buildWater() {
  const polys = GEO.water.filter(w => w.k === 1);
  fillPolygons(polys, () => 0x33566b, 0.05);
  // canals as ribbons
  const pos = [], idx = [], uv = [];
  let base = 0;
  for (const w of GEO.water.filter(w => w.k === 0)) {
    const p = w.p;
    for (let i = 0; i < p.length / 2 - 1; i++) {
      const x1 = p[i * 2], z1 = p[i * 2 + 1], x2 = p[i * 2 + 2], z2 = p[i * 2 + 3];
      const dx = x2 - x1, dz = z2 - z1;
      const l = Math.hypot(dx, dz) || 1;
      const nx = -dz / l * 5, nz = dx / l * 5;
      pos.push(x1 + nx, 0.04, z1 + nz, x2 + nx, 0.04, z2 + nz,
        x2 - nx, 0.04, z2 - nz, x1 - nx, 0.04, z1 - nz);
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      base += 4;
    }
  }
  if (idx.length) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3d6275, roughness: 0.22, metalness: 0.35,
      transparent: true, opacity: 0.94
    });
    const m = new THREE.Mesh(g, mat);
    m.receiveShadow = true;
    world.add(m);
  }
}

/* ---------------------------------- roads --------------------------------- */
const ROAD_COL = [0x3e4247, 0x45494e, 0x4b4f55, 0x54585d, 0x5b5e62, 0x63665f];

function buildRoads() {
  const byClass = {};
  for (const r of GEO.roads) (byClass[r.c] ||= []).push(r);

  for (const cls of Object.keys(byClass)) {
    const pos = [], uv = [], idx = [];
    let base = 0;
    for (const road of byClass[cls]) {
      const p = road.p;
      const hw = road.w * 0.5;
      for (let i = 0; i < p.length / 2 - 1; i++) {
        const x1 = p[i * 2], z1 = p[i * 2 + 1], x2 = p[i * 2 + 2], z2 = p[i * 2 + 3];
        const dx = x2 - x1, dz = z2 - z1;
        const l = Math.hypot(dx, dz);
        if (l < 0.01) continue;
        const nx = -dz / l * hw, nz = dx / l * hw;
        pos.push(
          x1 + nx, 0.05, z1 + nz,
          x2 + nx, 0.05, z2 + nz,
          x2 - nx, 0.05, z2 - nz,
          x1 - nx, 0.05, z1 - nz
        );
        uv.push(0, 0, 0, l / 8, 1, l / 8, 1, 0);
        idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
        base += 4;
      }
    }
    if (!idx.length) continue;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({
      color: ROAD_COL[cls] || 0x54585d, roughness: 0.78, metalness: 0.05,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
    }));
    m.receiveShadow = true;
    world.add(m);
  }

  // lane markings on the arterial roads
  const pos = [], idx = [];
  let base = 0;
  for (const r of GEO.roads) {
    if (r.c > 2) continue;
    const p = r.p;
    for (let i = 0; i < p.length / 2 - 1; i++) {
      const x1 = p[i * 2], z1 = p[i * 2 + 1], x2 = p[i * 2 + 2], z2 = p[i * 2 + 3];
      const dx = x2 - x1, dz = z2 - z1;
      const l = Math.hypot(dx, dz);
      if (l < 3) continue;
      const ux = dx / l, uz = dz / l;
      const dash = Math.min(2.6, l * 0.4);
      const xm = x1 + ux * l * 0.5, zm = z1 + uz * l * 0.5;
      const ax = xm - ux * dash, az = zm - uz * dash;
      const bx = xm + ux * dash, bz = zm + uz * dash;
      const nx = -uz * 0.16, nz = ux * 0.16;
      pos.push(ax + nx, 0.075, az + nz, bx + nx, 0.075, bz + nz,
        bx - nx, 0.075, bz - nz, ax - nx, 0.075, az - nz);
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      base += 4;
    }
  }
  if (idx.length) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      color: 0xd9d6c4, transparent: true, opacity: 0.55,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3
    }));
    world.add(m);
  }
}

/* -------------------------------- buildings -------------------------------- */
function windowTile() {
  const [c, x] = makeCanvas(128, 128);
  x.fillStyle = '#f4f0e8'; x.fillRect(0, 0, 128, 128);
  // one window per tile
  x.fillStyle = '#54666f';
  x.fillRect(24, 30, 34, 44);
  x.fillRect(74, 30, 34, 44);
  x.fillStyle = 'rgba(255,255,255,.35)';
  x.fillRect(24, 30, 34, 5); x.fillRect(74, 30, 34, 5);
  x.fillStyle = 'rgba(120,110,95,.35)';
  x.fillRect(0, 108, 128, 7);
  x.fillStyle = 'rgba(255,255,255,.5)';
  x.fillRect(0, 100, 128, 4);
  return canvasTex(c, { repeat: [1, 1] });
}

function buildBuildings() {
  const tex = windowTile();
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const PAL = [0xe0d6c2, 0xd3c8b2, 0xe6ddca, 0xcabfae, 0xd9d4c6, 0xcfc3ad, 0xe2dacb, 0xc9c2b4];

  const sidePos = [], sideUV = [], sideIdx = [], sideCol = [];
  const roofPos = [], roofIdx = [], roofCol = [];
  let sb = 0, rb = 0;
  const col = new THREE.Color();

  for (const b of GEO.buildings) {
    const p = b.p;
    const n = p.length / 2;
    if (n < 3) continue;
    const h = b.h;
    col.setHex(PAL[Math.floor(rand() * PAL.length)]).multiplyScalar(0.88 + rand() * 0.22);

    // sides
    for (let i = 0; i < n; i++) {
      const x1 = p[i * 2], z1 = p[i * 2 + 1];
      const x2 = p[((i + 1) % n) * 2], z2 = p[((i + 1) % n) * 2 + 1];
      const len = Math.hypot(x2 - x1, z2 - z1);
      if (len < 0.2) continue;
      sidePos.push(x1, 0.02, z1, x2, 0.02, z2, x2, h, z2, x1, h, z1);
      const u = len / 6;
      sideUV.push(0, 0, u, 0, u, h / 3.3, 0, h / 3.3);
      sideCol.push(col.r, col.g, col.b, col.r, col.g, col.b, col.r, col.g, col.b, col.r, col.g, col.b);
      sideIdx.push(sb, sb + 1, sb + 2, sb, sb + 2, sb + 3);
      sb += 4;
    }
    // roof
    let cx = 0, cz = 0;
    for (let i = 0; i < n; i++) { cx += p[i * 2]; cz += p[i * 2 + 1]; }
    cx /= n; cz /= n;
    const rc = col.clone().multiplyScalar(0.82);
    roofPos.push(cx, h, cz);
    roofCol.push(rc.r, rc.g, rc.b);
    for (let i = 0; i < n; i++) {
      roofPos.push(p[i * 2], h, p[i * 2 + 1]);
      roofCol.push(rc.r, rc.g, rc.b);
    }
    for (let i = 0; i < n; i++) roofIdx.push(rb, rb + 1 + i, rb + 1 + ((i + 1) % n));
    rb += n + 1;
  }

  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sidePos, 3));
  sg.setAttribute('uv', new THREE.Float32BufferAttribute(sideUV, 2));
  sg.setAttribute('color', new THREE.Float32BufferAttribute(sideCol, 3));
  sg.setIndex(sideIdx);
  sg.computeVertexNormals();
  const sideMat = new THREE.MeshStandardMaterial({
    map: tex, vertexColors: true, roughness: 0.92, metalness: 0.02,
    emissive: 0xffe4ad, emissiveMap: tex, emissiveIntensity: 0.0
  });
  MATS.city = sideMat;
  EMISSIVE_NIGHT.push({ mat: sideMat, max: 0.34, color: 0xffe4ad, keepColor: true });
  const sides = new THREE.Mesh(sg, sideMat);
  sides.castShadow = true;
  sides.receiveShadow = true;
  world.add(sides);

  if (roofIdx.length) {
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.Float32BufferAttribute(roofPos, 3));
    rg.setAttribute('color', new THREE.Float32BufferAttribute(roofCol, 3));
    rg.setIndex(roofIdx);
    rg.computeVertexNormals();
    const roofs = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.96, metalness: 0.02, side: THREE.DoubleSide
    }));
    roofs.castShadow = true;
    roofs.receiveShadow = true;
    world.add(roofs);
  }
}

/* ---------------------------------- metro ---------------------------------- */
function buildMetro() {
  const pts = GEO.metro;
  if (!pts || pts.length < 4) return;
  const curve = [];
  for (let i = 0; i < pts.length; i += 1) curve.push(new THREE.Vector2(pts[i][0], pts[i][1]));
  const DECK_Y = 11.4;
  const conc = new THREE.MeshStandardMaterial({ color: 0xcac8bf, roughness: 0.86, metalness: 0.05 });

  // deck: ribbon
  const pos = [], uv = [], idx = [];
  let base = 0, run = 0;
  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i], b = curve[i + 1];
    const dx = b.x - a.x, dz = b.y - a.y;
    const l = Math.hypot(dx, dz);
    if (l < 0.5) continue;
    const nx = -dz / l * 4.6, nz = dx / l * 4.6;
    pos.push(
      a.x + nx, DECK_Y, a.y + nz,
      b.x + nx, DECK_Y, b.y + nz,
      b.x - nx, DECK_Y, b.y + nz,
      a.x - nx, DECK_Y, a.y + nz
    );
    uv.push(0, run / 12, 0, (run + l) / 12, 1, (run + l) / 12, 1, run / 12);
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    base += 4; run += l;
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  dg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  dg.setIndex(idx); dg.computeVertexNormals();
  const deck = new THREE.Mesh(dg, conc);
  deck.castShadow = true; deck.receiveShadow = true;
  world.add(deck);

  // parapets + rails merged
  const railGeos = [];
  for (const side of [-1, 1]) {
    const rp = [], ri = [];
    let rb = 0, rr = 0;
    for (let i = 0; i < curve.length - 1; i++) {
      const a = curve[i], b = curve[i + 1];
      const dx = b.x - a.x, dz = b.y - a.y;
      const l = Math.hypot(dx, dz);
      if (l < 0.5) continue;
      const nx = -dz / l * 4.3 * side, nz = dx / l * 4.3 * side;
      rp.push(a.x + nx, DECK_Y + 0.75, a.y + nz, b.x + nx, DECK_Y + 0.75, b.y + nz,
        b.x + nx, DECK_Y + 1.15, b.y + nz, a.x + nx, DECK_Y + 1.15, a.y + nz);
      ri.push(rb, rb + 1, rb + 2, rb, rb + 2, rb + 3);
      rb += 4; rr += l;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3));
    g.setIndex(ri); g.computeVertexNormals();
    railGeos.push(g);
  }
  const rails = new THREE.Mesh(mergeGeoms(railGeos), conc);
  world.add(rails);

  // piers
  const pierGeo = new THREE.CylinderGeometry(0.95, 1.25, DECK_Y, 8).translate(0, DECK_Y / 2, 0);
  const mats = [];
  const dummy = new THREE.Object3D();
  let acc = 0;
  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i], b = curve[i + 1];
    const dx = b.x - a.x, dz = b.y - a.y;
    const l = Math.hypot(dx, dz);
    acc += l;
    if (acc < 30) continue;
    acc = 0;
    dummy.position.set(b.x, 0, b.y);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    mats.push(dummy.matrix.clone());
  }
  if (mats.length) {
    const piers = new THREE.InstancedMesh(pierGeo, conc, mats.length);
    mats.forEach((m, i) => piers.setMatrixAt(i, m));
    piers.instanceMatrix.needsUpdate = true;
    piers.castShadow = true;
    world.add(piers);
  }

  // stations
  for (const st of GEO.stations) {
    const g = new THREE.Group();
    g.position.set(st.x, DECK_Y, st.z);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(22, 0.8, 60), conc);
    slab.position.y = 0.4;
    g.add(slab);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(19, 0.6, 60),
      new THREE.MeshStandardMaterial({ color: 0xe9e7de, roughness: 0.7 }));
    roof.position.y = 8.2;
    roof.castShadow = true;
    g.add(roof);
    const colM = new THREE.MeshStandardMaterial({ color: 0xb9b7ae, roughness: 0.65, metalness: 0.25 });
    for (let z = -26; z <= 26; z += 13) for (const x of [-8.5, 8.5]) {
      const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 7.8, 0.7), colM);
      c2.position.set(x, 4.3, z);
      g.add(c2);
    }
    const glass = new THREE.MeshStandardMaterial({
      color: 0x8fb6c4, roughness: 0.2, metalness: 0.5, transparent: true, opacity: 0.4,
      emissive: 0x1d3d4a, emissiveIntensity: 0.6
    });
    for (const x of [-9.6, 9.6]) {
      const gl = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.6, 58), glass);
      gl.position.set(x, 3.4, 0);
      g.add(gl);
    }
    // name board (Malayalam + English)
    const [nc, nx] = makeCanvas(1024, 256);
    nx.fillStyle = '#0c2a48'; nx.fillRect(0, 0, 1024, 256);
    nx.fillStyle = '#eef4f7';
    nx.font = '700 78px Oswald, system-ui, sans-serif';
    nx.textAlign = 'center'; nx.textBaseline = 'middle';
    nx.fillText(st.n.toUpperCase(), 512, 92);
    nx.fillStyle = '#7fc9e8';
    nx.font = '700 58px NotoMal, sans-serif';
    nx.fillText(st.ml || '', 512, 180);
    const bmat = new THREE.MeshBasicMaterial({ map: canvasTex(nc), toneMapped: false, side: THREE.DoubleSide });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(23, 5.7), bmat);
    board.position.set(-11, 6.4, 0);
    board.rotation.y = -Math.PI / 2;
    g.add(board);
    world.add(g);
  }

  // a train that runs along the line
  const train = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd9dde0, roughness: 0.38, metalness: 0.35 });
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x22333c, roughness: 0.15, metalness: 0.55,
    emissive: 0xffe7b0, emissiveIntensity: 0
  });
  const accent = new THREE.MeshStandardMaterial({ color: 0x2b7fbf, roughness: 0.4, metalness: 0.3 });
  for (let i = 0; i < 3; i++) {
    const car = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.9, 21), bodyMat);
    body.castShadow = true; car.add(body);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.08, 0.5, 21), accent);
    stripe.position.y = -0.5; car.add(stripe);
    for (let w = -1; w <= 1; w++) for (const sx of [-1.55, 1.55]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 5.4), winMat);
      win.position.set(sx, 0.42, w * 6.6); car.add(win);
    }
    car.position.z = i * 22.6;
    train.add(car);
  }
  train.position.y = DECK_Y + 2.3;
  world.add(train);
  MATS.metroWindow = winMat;

  // build a cumulative length table to animate the train along the polyline
  const table = [];
  let total = 0;
  for (let i = 0; i < curve.length - 1; i++) {
    total += curve[i].distanceTo(curve[i + 1]);
    table.push(total);
  }
  const state = { s: total * 0.15, speed: 16 };
  function pointAt(s) {
    s = ((s % total) + total) % total;
    let lo = 0, hi = table.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (table[mid] < s) lo = mid + 1; else hi = mid;
    }
    const i = Math.max(0, lo - 1);
    const seg = (table[i] - (i > 0 ? table[i - 1] : 0)) || 1;
    const f = (s - (i > 0 ? table[i - 1] : 0)) / seg;
    const a = curve[i], b = curve[i + 1] || curve[i];
    return {
      x: lerp(a.x, b.x, f), z: lerp(a.y, b.y, f),
      ang: Math.atan2(b.x - a.x, b.y - a.y)
    };
  }
  mixerObjects.push({
    update(dt) {
      state.s += state.speed * dt;
      const p = pointAt(state.s);
      train.position.x = p.x;
      train.position.z = p.z;
      train.rotation.y = p.ang;
    }
  });
}

/* ------------------------------ vegetation ------------------------------ */
function buildPalms() {
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.48, 1, 6).translate(0, 0.5, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a6444, roughness: 0.95 });
  const frondGeo = new THREE.PlaneGeometry(0.9, 4.4, 1, 4);
  {
    const p = frondGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const k = (y + 2.2) / 4.4;
      p.setZ(i, -Math.pow(k, 2) * 1.6);
      p.setX(i, p.getX(i) * (1 - k * 0.8));
    }
    frondGeo.computeVertexNormals();
  }
  const frondMat = new THREE.MeshStandardMaterial({
    color: 0x2f6b2e, roughness: 0.85, side: THREE.DoubleSide, flatShading: true
  });

  // palms follow the stadium plot edge (inside the ring road)
  const plot = GEO.plot;
  const palms = [];
  const NP = plot.length / 2;
  for (let i = 0; i < NP; i += 1) {
    const x = plot[i * 2], z = plot[i * 2 + 1];
    const r = Math.hypot(x, z);
    // pull the plot edge inwards towards the bowl
    const k = (110 + rand() * 6) / Math.max(r, 1);
    palms.push({ x: x * k, z: z * k, h: 9 + rand() * 5.5, rot: rand() * TAU, scale: 0.85 + rand() * 0.35 });
  }
  // a second row along Stadium Round
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * TAU;
    const rr = 132 + rand() * 5;
    palms.push({ x: Math.cos(a) * rr, z: Math.sin(a) * rr * 0.92, h: 8 + rand() * 5, rot: rand() * TAU, scale: 0.8 + rand() * 0.35 });
  }

  const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, palms.length);
  const frondsPer = 10;
  const frondMesh = new THREE.InstancedMesh(frondGeo, frondMat, palms.length * frondsPer);
  const d = new THREE.Object3D();
  let fi = 0;
  palms.forEach((p, i) => {
    d.position.set(p.x, 0, p.z);
    d.rotation.set(0, p.rot, 0);
    d.scale.set(p.scale, p.h, p.scale);
    d.updateMatrix();
    trunkMesh.setMatrixAt(i, d.matrix.clone());
    for (let f = 0; f < frondsPer; f++) {
      const a = (f / frondsPer) * TAU + p.rot;
      const tilt = -0.3 - (f % 4) * 0.2 - rand() * 0.12;
      d.position.set(p.x, p.h * (0.94 + (f % 2) * 0.02), p.z);
      d.rotation.set(0, a, 0);
      d.scale.set(p.scale, p.scale, p.scale);
      d.updateMatrix();
      d.rotateX(tilt);
      d.updateMatrix();
      frondMesh.setMatrixAt(fi++, d.matrix.clone());
    }
  });
  trunkMesh.castShadow = true;
  frondMesh.castShadow = true;
  trunkMesh.instanceMatrix.needsUpdate = true;
  frondMesh.instanceMatrix.needsUpdate = true;
  world.add(trunkMesh, frondMesh);

  // broadleaf trees inside the plot, as in the real grounds
  const canopyGeo = new THREE.IcosahedronGeometry(1, 1);
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x2f5b2b, roughness: 0.96, flatShading: true });
  const canopy = new THREE.InstancedMesh(canopyGeo, canopyMat, 64);
  let ci = 0;
  for (let i = 0; i < 64; i++) {
    const a = rand() * TAU, rr = 100 + rand() * 22;
    const s = 2.4 + rand() * 3.2;
    d.position.set(Math.cos(a) * rr, s * 0.95, Math.sin(a) * rr * 0.86);
    d.rotation.set(rand(), rand(), rand());
    d.scale.set(s, s * 0.74, s);
    d.updateMatrix();
    canopy.setMatrixAt(ci++, d.matrix.clone());
  }
  canopy.castShadow = true;
  canopy.instanceMatrix.needsUpdate = true;
  world.add(canopy);
}

/* ------------------------------ street lamps ------------------------------ */
function buildStreetLamps() {
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x8d918f, roughness: 0.6, metalness: 0.5 });
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff0c8, toneMapped: false });
  const geo = new THREE.CylinderGeometry(0.13, 0.19, 9, 5).translate(0, 4.5, 0);
  const spots = [];
  // lamps along the ring road and the arterials
  for (const r of GEO.roads) {
    if (r.c > 2) continue;
    const p = r.p;
    let acc = 0;
    for (let i = 0; i < p.length / 2 - 1; i++) {
      const x1 = p[i * 2], z1 = p[i * 2 + 1], x2 = p[i * 2 + 2], z2 = p[i * 2 + 3];
      const l = Math.hypot(x2 - x1, z2 - z1);
      acc += l;
      if (acc < 36) continue;
      acc = 0;
      const rr = Math.hypot(x2, z2);
      if (rr < 90 || rr > 900) continue;
      const dx = (x2 - x1) / (l || 1), dz = (z2 - z1) / (l || 1);
      spots.push({ x: x2 - dz * (r.w / 2 + 1.2), z: z2 + dx * (r.w / 2 + 1.2) });
    }
  }
  const poles = new THREE.InstancedMesh(geo, poleMat, spots.length);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.4, 6, 5), lampMat, spots.length);
  const d = new THREE.Object3D();
  spots.forEach((s, i) => {
    d.position.set(s.x, 0.05, s.z); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1); d.updateMatrix();
    poles.setMatrixAt(i, d.matrix.clone());
    d.position.set(s.x, 9.05, s.z); d.updateMatrix();
    heads.setMatrixAt(i, d.matrix.clone());
    if (i % 2 === 0) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: 0xffd9a0, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      sp.position.set(s.x, 9.05, s.z);
      sp.scale.set(13, 13, 1);
      nightGlow.push({ obj: sp, base: 0.34 });
      world.add(sp);
    }
  });
  poles.instanceMatrix.needsUpdate = true;
  heads.instanceMatrix.needsUpdate = true;
  poles.castShadow = true;
  world.add(poles, heads);
}

/* ------------------------------- road signs ------------------------------- */
function buildRoadSigns() {
  const font = '700 52px Oswald, system-ui, sans-serif';
  for (const lab of GEO.labels) {
    const [c, x] = makeCanvas(1024, 128);
    x.clearRect(0, 0, 1024, 128);
    x.fillStyle = 'rgba(10,18,24,.82)';
    const w = Math.min(1000, 60 + lab.t.length * 30);
    x.fillRect(512 - w / 2, 18, w, 92);
    x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 3;
    x.strokeRect(512 - w / 2, 18, w, 92);
    x.fillStyle = '#f2f5f6';
    x.font = font;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(lab.t.toUpperCase(), 512, 66, w - 30);
    const tex = canvasTex(c);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(18, 2.25), mat);
    mesh.position.set(lab.x, 6.4, lab.z);
    mesh.rotation.y = Math.atan2(lab.x, lab.z);
    world.add(mesh);
  }
}

/* ------------------------------ parked cars ------------------------------ */
function buildCars() {
  const bodyGeo = mergeGeoms([
    new THREE.BoxGeometry(4.2, 1.05, 1.8).translate(0, 0.68, 0),
    new THREE.BoxGeometry(2.2, 0.62, 1.62).translate(-0.1, 1.48, 0)
  ]);
  const carMat = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.35 });
  const spots = [];
  // line the approaches and the plot road with parked cars
  for (const r of GEO.roads) {
    if (r.c < 2 || r.c > 3) continue;
    const p = r.p;
    let acc = 0;
    for (let i = 0; i < p.length / 2 - 1; i++) {
      const x1 = p[i * 2], z1 = p[i * 2 + 1], x2 = p[i * 2 + 2], z2 = p[i * 2 + 3];
      const l = Math.hypot(x2 - x1, z2 - z1);
      acc += l;
      if (acc < 26) continue;
      acc = 0;
      const rr = Math.hypot(x2, z2);
      if (rr < 120 || rr > 600) continue;
      if (rand() < 0.45) continue;
      const dx = (x2 - x1) / (l || 1), dz = (z2 - z1) / (l || 1);
      const side = rand() < 0.5 ? 1 : -1;
      spots.push({ x: x2 - dz * side * (r.w / 2 + 1.6), z: z2 + dx * side * (r.w / 2 + 1.6), a: Math.atan2(dx, dz) });
    }
  }
  const cars = new THREE.InstancedMesh(bodyGeo, carMat, spots.length);
  const pal = [0xdedcd6, 0xc9ccce, 0xb7bcc0, 0x2f3236, 0x9aa3ad, 0xdedcd6, 0x8d3a32, 0x2c4460, 0xd6d2c4];
  const col = new THREE.Color();
  const d = new THREE.Object3D();
  spots.forEach((s, i) => {
    d.position.set(s.x, 0.02, s.z);
    d.rotation.set(0, s.a, 0);
    d.scale.set(1, 1, 1);
    d.updateMatrix();
    cars.setMatrixAt(i, d.matrix.clone());
    col.setHex(pal[Math.floor(rand() * pal.length)]).multiplyScalar(0.85 + rand() * 0.3);
    cars.setColorAt(i, col);
  });
  cars.instanceMatrix.needsUpdate = true;
  if (cars.instanceColor) cars.instanceColor.needsUpdate = true;
  cars.castShadow = true;
  cars.receiveShadow = true;
  world.add(cars);
}

/* -------------------------------- horizon -------------------------------- */
function buildHorizon() {
  const geo = new THREE.IcosahedronGeometry(1, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x7d8a70, roughness: 1, flatShading: true });
  const n = LOW_POWER ? 120 : 190;
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  const d = new THREE.Object3D();
  const col = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const a = rand() * TAU;
    const r = 1450 + rand() * 1500;
    const s = 24 + rand() * 52;
    d.position.set(Math.cos(a) * r, s * 0.12, Math.sin(a) * r * 0.95);
    d.rotation.set(rand(), rand(), rand());
    d.scale.set(s, s * (0.16 + rand() * 0.22), s);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix.clone());
    col.setHSL(0.235 + rand() * 0.04, 0.10 + rand() * 0.07, 0.32 + rand() * 0.08);
    mesh.setColorAt(i, col);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  world.add(mesh);
}

/* ---------------------------- stadium forecourt ---------------------------- */
function buildForecourt() {
  // paved apron in the real plot shape, plus the four gates from buildEntrances()
  const p = GEO.plot;
  if (!p) return;
  const shape = new THREE.Shape();
  const n = p.length / 2;
  const K = 0.86;   // shrink the plot polygon slightly toward the stadium
  for (let i = 0; i < n; i++) {
    const x = p[i * 2] * K, z = p[i * 2 + 1] * K;
    if (i === 0) shape.moveTo(x, z); else shape.lineTo(x, z);
  }
  const geo = new THREE.ShapeGeometry(shape, 8);
  const [c, x] = makeCanvas(256, 256);
  x.fillStyle = '#9d9c94'; x.fillRect(0, 0, 256, 256);
  for (let gy = 0; gy < 8; gy++) for (let gx = 0; gx < 8; gx++) {
    const v = 148 + Math.floor(rand() * 22);
    x.fillStyle = `rgb(${v},${v - 2},${v - 9})`;
    x.fillRect(gx * 32 + 1, gy * 32 + 1, 30, 30);
  }
  const tex = canvasTex(c, { repeat: [1, 1] });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.93, metalness: 0.02, side: THREE.DoubleSide
  }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.08;
  m.receiveShadow = true;
  world.add(m);
}

/* --------------------------- build everything --------------------------- */
function buildSurroundings() {
  buildGround();
  buildLand();
  buildWater();
  buildRoads();
  buildBuildings();
  buildMetro();
  buildPalms();
  buildStreetLamps();
  buildCars();
  buildRoadSigns();
  buildHorizon();
  buildForecourt();
}
