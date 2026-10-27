/* =========================================================================
   BRANDING — KBFC crest, ISL badge, real 2024-25 sponsors, Malayalam banners
   ========================================================================= */

const BRAND = {
  yellow: '#FFD21F',
  yellowDeep: '#F2C018',
  blue: '#0B2C6B',
  blueBright: '#1848A8',
  ink: '#0A1220',
  ml: {
    manjappada: 'മഞ്ഞപ്പട',
    yennum: 'എന്നും യെല്ലോ',
    blasters: 'കേരള ബ്ലാസ്റ്റേഴ്സ്',
    kochi: 'കൊച്ചി',
    yellowArmy: 'യെല്ലോ ആർമി',
    jayikkam: 'ജയിക്കാം',
    goal: 'ഗോൾ!',
    keralam: 'കേരളം',
    nammude: 'നമ്മുടെ പട',
    jln: 'ജെ. എൽ. എൻ സ്റ്റേഡിയം'
  }
};
const F_DISPLAY = '"Oswald", "Arial Narrow", system-ui, sans-serif';
const F_ML = '"NotoMal", "Nirmala UI", "Noto Sans Malayalam", "Malayalam Sangam MN", "Kartika", sans-serif';

/* ------------------------------ KBFC crest ------------------------------ */
/* stylised elephant-with-football crest in club yellow / navy            */
function drawCrest(x, cx, cy, s) {
  x.save();
  x.translate(cx, cy);
  x.scale(s / 100, s / 100);

  // shield
  x.beginPath();
  x.moveTo(0, -50);
  x.bezierCurveTo(30, -50, 50, -38, 50, -14);
  x.bezierCurveTo(50, 18, 26, 40, 0, 50);
  x.bezierCurveTo(-26, 40, -50, 18, -50, -14);
  x.bezierCurveTo(-50, -38, -30, -50, 0, -50);
  x.closePath();
  const g = x.createLinearGradient(0, -50, 0, 50);
  g.addColorStop(0, '#123C86');
  g.addColorStop(1, '#071C46');
  x.fillStyle = g; x.fill();
  x.lineWidth = 5; x.strokeStyle = BRAND.yellow; x.stroke();

  // elephant head
  x.fillStyle = BRAND.yellow;
  x.beginPath();
  x.ellipse(0, -14, 22, 20, 0, 0, TAU); x.fill();          // head
  x.beginPath();                                            // ears
  x.ellipse(-24, -14, 13, 17, -0.35, 0, TAU); x.fill();
  x.beginPath();
  x.ellipse(24, -14, 13, 17, 0.35, 0, TAU); x.fill();
  // trunk
  x.strokeStyle = BRAND.yellow; x.lineWidth = 9; x.lineCap = 'round';
  x.beginPath();
  x.moveTo(0, 0);
  x.bezierCurveTo(2, 12, 10, 18, 8, 27);
  x.stroke();
  // tusks
  x.strokeStyle = '#FFFFFF'; x.lineWidth = 3.4;
  x.beginPath(); x.moveTo(-11, 2); x.quadraticCurveTo(-15, 10, -10, 14); x.stroke();
  x.beginPath(); x.moveTo(11, 2); x.quadraticCurveTo(15, 10, 10, 14); x.stroke();
  // eyes
  x.fillStyle = '#071C46';
  x.beginPath(); x.arc(-8, -20, 2.6, 0, TAU); x.fill();
  x.beginPath(); x.arc(8, -20, 2.6, 0, TAU); x.fill();
  // football under the trunk
  x.fillStyle = '#FFFFFF';
  x.beginPath(); x.arc(9, 31, 7.5, 0, TAU); x.fill();
  x.fillStyle = '#071C46';
  x.beginPath(); x.arc(9, 31, 2.4, 0, TAU); x.fill();
  // star
  x.fillStyle = BRAND.yellow;
  x.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + i * TAU / 5;
    const a2 = a + TAU / 10;
    x.lineTo(Math.cos(a) * 7, -40 + Math.sin(a) * 7);
    x.lineTo(Math.cos(a2) * 3, -40 + Math.sin(a2) * 3);
  }
  x.closePath(); x.fill();
  x.restore();
}

/* ------------------------------- ISL badge ------------------------------- */
function drawISL(x, cx, cy, w) {
  const h = w * 0.78;
  x.save();
  x.translate(cx, cy);
  // shield
  x.beginPath();
  x.moveTo(-w / 2, -h / 2);
  x.lineTo(w / 2, -h / 2);
  x.lineTo(w / 2, h * 0.12);
  x.quadraticCurveTo(w / 2, h * 0.42, 0, h / 2);
  x.quadraticCurveTo(-w / 2, h * 0.42, -w / 2, h * 0.12);
  x.closePath();
  const g = x.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, '#1B4FA8');
  g.addColorStop(1, '#081F49');
  x.fillStyle = g; x.fill();
  x.lineWidth = w * 0.045; x.strokeStyle = '#F4E84E'; x.stroke();

  // footballer silhouette
  x.fillStyle = '#FFFFFF';
  x.beginPath(); x.arc(-w * 0.06, -h * 0.24, w * 0.075, 0, TAU); x.fill();
  x.beginPath();
  x.moveTo(-w * 0.14, -h * 0.13);
  x.lineTo(w * 0.02, -h * 0.17);
  x.lineTo(w * 0.16, -h * 0.02);
  x.lineTo(w * 0.06, -h * 0.01);
  x.lineTo(w * 0.10, h * 0.14);
  x.lineTo(0, h * 0.14);
  x.lineTo(-w * 0.03, -h * 0.02);
  x.lineTo(-w * 0.12, h * 0.10);
  x.lineTo(-w * 0.19, h * 0.06);
  x.lineTo(-w * 0.08, -h * 0.05);
  x.closePath(); x.fill();
  // ball
  x.beginPath(); x.arc(w * 0.19, h * 0.14, w * 0.065, 0, TAU); x.fill();
  x.fillStyle = '#0B2C6B';
  x.beginPath(); x.arc(w * 0.19, h * 0.14, w * 0.022, 0, TAU); x.fill();

  // wordmark
  x.fillStyle = '#F4E84E';
  x.font = `700 ${w * 0.30}px ${F_DISPLAY}`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('ISL', 0, -h * 0.30);
  x.fillStyle = 'rgba(255,255,255,.85)';
  x.font = `600 ${w * 0.085}px ${F_DISPLAY}`;
  x.fillText('INDIAN SUPER LEAGUE', 0, h * 0.30);
  x.restore();
}

/* --------------------------- sponsor wordmarks --------------------------- */
function drawSponsor(x, name, cx, cy, size, color) {
  x.save();
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillStyle = color || '#0B2C6B';
  if (name === 'Medhaa') {
    x.font = `700 ${size}px ${F_DISPLAY}`;
    x.fillText('MEDHAA', cx, cy);
    x.font = `600 ${size * 0.36}px ${F_DISPLAY}`;
    x.fillText('CORPORATE ADVISORS', cx, cy + size * 0.52);
  } else if (name === 'Reyaur') {
    x.font = `700 ${size * 0.9}px ${F_DISPLAY}`;
    x.fillText('REYAUR', cx, cy);
  } else if (name === 'Batery') {
    x.font = `700 ${size}px ${F_DISPLAY}`;
    x.fillText('BATERY', cx, cy);
    x.font = `600 ${size * 0.42}px ${F_DISPLAY}`;
    x.fillText('.AI', cx + size * 1.5, cy - size * 0.25);
  } else if (name === 'Polycab') {
    x.font = `700 ${size * 0.92}px ${F_DISPLAY}`;
    x.fillText('POLYCAB', cx, cy);
  } else if (name === 'Salpido') {
    x.font = `700 ${size * 0.92}px ${F_DISPLAY}`;
    x.fillText('SALPIDO', cx, cy);
  } else if (name === 'Freemans') {
    x.font = `700 ${size * 0.9}px ${F_DISPLAY}`;
    x.fillText('FREEMANS', cx, cy);
  } else {
    x.font = `700 ${size * 0.9}px ${F_DISPLAY}`;
    x.fillText(name.toUpperCase(), cx, cy);
  }
  x.restore();
}

/* ----------------------------- jersey texture ----------------------------- */
/* u wraps around a cylinder: front seam at u=0/1, back at u=0.5            */
function jerseyTexture(o) {
  const W = 1024, H = 512;
  const [c, x] = makeCanvas(W, H);
  const isHome = o.kit !== 'away';
  const base = isHome ? '#FFD21F' : '#6E1B2A';
  const ink = isHome ? '#0B2C6B' : '#F4E84E';
  const FRONT = W * 0.25, BACK = W * 0.75;

  x.fillStyle = base; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 30; i++) {
    x.fillStyle = i % 2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)';
    x.fillRect(i * (W / 30), 0, W / 30, H);
  }
  const sh = x.createLinearGradient(0, 0, 0, H);
  sh.addColorStop(0, 'rgba(0,0,0,.16)');
  sh.addColorStop(0.25, 'rgba(255,255,255,.06)');
  sh.addColorStop(1, 'rgba(0,0,0,.10)');
  x.fillStyle = sh; x.fillRect(0, 0, W, H);

  // side panels sit on the wrap seams (u = 0 and 0.5)
  x.fillStyle = isHome ? '#123C86' : '#123C22';
  x.fillRect(0, 0, W * 0.022, H);
  x.fillRect(W * 0.978, 0, W * 0.022, H);
  x.fillRect(W * 0.478, 0, W * 0.044, H);

  // collars at the front and back centres
  const collar = (cx) => {
    x.fillStyle = isHome ? '#0B2C6B' : '#F4E84E';
    x.beginPath();
    x.moveTo(cx - 52, 0);
    x.lineTo(cx + 52, 0);
    x.lineTo(cx + 34, 44);
    x.lineTo(cx, 60);
    x.lineTo(cx - 34, 44);
    x.closePath(); x.fill();
  };
  collar(FRONT); collar(BACK);

  // ---- front: crest on one breast, kit maker on the other, Medhaa across the chest
  drawCrest(x, FRONT - W * 0.062, 168, 104);
  drawSponsor(x, 'Reyaur', FRONT + W * 0.068, 138, 32, ink);
  drawSponsor(x, 'Medhaa', FRONT, 248, 58, ink);
  // small Manjappada collar print
  x.fillStyle = ink;
  x.font = `700 15px ${F_ML}`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('മഞ്ഞപ്പട', FRONT, 96, 150);

  // ---- back: name, number, back sponsor, slogan
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = ink;
  x.font = `700 42px ${F_DISPLAY}`;
  x.fillText(o.name || 'BLASTERS', BACK, 82, 220);
  x.font = `700 196px ${F_DISPLAY}`;
  x.lineWidth = 11;
  x.strokeStyle = isHome ? 'rgba(255,255,255,.94)' : 'rgba(0,0,0,.35)';
  x.strokeText(String(o.num || 10), BACK, 232);
  x.fillStyle = ink;
  x.fillText(String(o.num || 10), BACK, 232);
  drawSponsor(x, 'Batery', BACK, 382, 44, ink);
  x.fillStyle = isHome ? 'rgba(11,44,107,.72)' : 'rgba(244,232,78,.75)';
  x.font = `600 22px ${F_DISPLAY}`;
  x.fillText('YENNUM YELLOW', BACK, 442);

  // ---- league patches on both sleeves (the side seams)
  for (const u of [0.0, 0.5]) {
    const px = u * W;
    drawISL(x, px === 0 ? 46 : px, 190, 66);
  }
  drawSponsor(x, 'Polycab', 0.0 * W, 316, 26, ink);
  drawSponsor(x, 'Salpido', 0.5 * W, 316, 26, ink);

  for (let i = 0; i < 2400; i++) {
    x.fillStyle = `rgba(${rand() < 0.5 ? 255 : 0},${rand() < 0.5 ? 255 : 0},0,${0.012 + rand() * 0.02})`;
    x.fillRect(rand() * W, rand() * H, 1, 1);
  }
  const t = canvasTex(c);
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

/* --------------------------- banner / tifo texture --------------------------- */
function bannerTexture(opts) {
  const W = opts.w || 1024, H = opts.h || 256;
  const [c, x] = makeCanvas(W, H);
  x.fillStyle = opts.bg || BRAND.yellow;
  x.fillRect(0, 0, W, H);
  if (opts.stripes) {
    for (let i = 0; i < 12; i++) {
      x.fillStyle = i % 2 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)';
      x.fillRect(0, i * (H / 12), W, H / 12);
    }
  }
  if (opts.border) {
    x.strokeStyle = opts.border; x.lineWidth = H * 0.045;
    x.strokeRect(H * 0.03, H * 0.03, W - H * 0.06, H - H * 0.06);
  }
  if (opts.crest) drawCrest(x, W * 0.09, H * 0.5, H * 0.62);
  if (opts.isl) drawISL(x, W * 0.93, H * 0.5, H * 0.6);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  if (opts.ml) {
    x.fillStyle = opts.fg || BRAND.blue;
    x.font = `700 ${opts.size || H * 0.46}px ${F_ML}`;
    x.fillText(opts.ml, W * (opts.crest ? 0.55 : 0.5), H * (opts.sub ? 0.4 : 0.52), W * 0.72);
  }
  if (opts.text) {
    x.fillStyle = opts.sub ? (opts.fg || BRAND.blue) : (opts.fg2 || '#FFFFFF');
    x.font = `700 ${opts.size2 || H * 0.2}px ${F_DISPLAY}`;
    x.fillText(opts.text, W * (opts.crest ? 0.55 : 0.5), H * (opts.ml ? 0.76 : 0.55), W * 0.7);
  }
  const t = canvasTex(c);
  return t;
}

/* --------------------------- LED advertising strip --------------------------- */
function sponsorStripTexture() {
  const W = 4096, H = 128;
  const [c, x] = makeCanvas(W, H);
  x.fillStyle = '#080C12'; x.fillRect(0, 0, W, H);
  const slots = [
    { t: 'isl' },
    { t: 'text', a: 'MEDHAA', b: 'PRINCIPAL PARTNER' },
    { t: 'ml', a: BRAND.ml.manjappada, b: 'MANJAPPADA' },
    { t: 'kbfc' },
    { t: 'text', a: 'POLYCAB', b: 'OFFICIAL PARTNER' },
    { t: 'ml', a: BRAND.ml.yennum, b: 'YENNUM YELLOW' },
    { t: 'text', a: 'BATERY.AI', b: 'PRESENTING PARTNER' },
    { t: 'text', a: 'FREEMANS', b: 'MAIN SPONSOR' },
    { t: 'ml', a: BRAND.ml.jayikkam, b: 'JAYIKKAM' },
    { t: 'text', a: 'REYAUR', b: 'KIT PARTNER' },
    { t: 'text', a: 'SALPIDO', b: 'AUDIO PARTNER' },
    { t: 'ml', a: BRAND.ml.kochi, b: 'KOCHI' }
  ];
  const slotW = W / slots.length;
  slots.forEach((s, i) => {
    const cx = i * slotW + slotW / 2;
    if (i % 2 === 0) {
      x.fillStyle = '#0E1526';
      x.fillRect(i * slotW, 0, slotW, H);
    }
    if (s.t === 'isl') {
      drawISL(x, cx, H / 2, 96);
    } else if (s.t === 'kbfc') {
      drawCrest(x, cx - 78, H / 2, 96);
      x.fillStyle = BRAND.yellow;
      x.font = `700 46px ${F_DISPLAY}`;
      x.textAlign = 'left'; x.textBaseline = 'middle';
      x.fillText('KERALA', cx - 20, H / 2 - 22);
      x.fillText('BLASTERS', cx - 20, H / 2 + 24);
    } else if (s.t === 'ml') {
      x.fillStyle = BRAND.yellow;
      x.font = `700 56px ${F_ML}`;
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(s.a, cx, H / 2 - 16, slotW * 0.9);
      x.fillStyle = 'rgba(255,255,255,.75)';
      x.font = `600 22px ${F_DISPLAY}`;
      x.fillText(s.b, cx, H / 2 + 36, slotW * 0.85);
    } else {
      x.fillStyle = '#FFFFFF';
      x.font = `700 50px ${F_DISPLAY}`;
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(s.a, cx, H / 2 - 14, slotW * 0.88);
      x.fillStyle = 'rgba(255,255,255,.55)';
      x.font = `600 22px ${F_DISPLAY}`;
      x.fillText(s.b, cx, H / 2 + 34, slotW * 0.85);
    }
  });
  const t = canvasTex(c);
  t.wrapS = THREE.RepeatWrapping;
  return t;
}
