/* =========================================================================
   ATMOSPHERE FX — floating dust motes, floodlight haze
   ========================================================================= */

let dust = null;
function buildDust() {
  const n = 420;
  const geo = new THREE.BufferGeometry();
  const p = new Float32Array(n * 3);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU;
    const r = Math.sqrt(Math.random()) * 105;
    p[i * 3] = Math.cos(a) * r;
    p[i * 3 + 1] = 1 + Math.random() * 34;
    p[i * 3 + 2] = Math.sin(a) * r * 0.78;
    s[i] = 0.5 + Math.random() * 1.4;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(s, 1));
  const mat = new THREE.PointsMaterial({
    color: 0xfff4d8, size: 0.5, sizeAttenuation: true,
    transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending
  });
  dust = new THREE.Points(geo, mat);
  dust.frustumCulled = false;
  world.add(dust);
}
function updateDust(dt, t) {
  if (!dust) return;
  dust.material.opacity = 0.35 * S.night + 0.05;
  dust.rotation.y = t * 0.012;
  const pos = dust.geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 2) {
    let y = pos.getY(i) + dt * (0.35 + (i % 7) * 0.08);
    if (y > 36) y = 1;
    pos.setY(i, y);
  }
  pos.needsUpdate = true;
}
