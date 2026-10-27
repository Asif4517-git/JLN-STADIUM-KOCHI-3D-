# JLN Stadium Kochi — interactive 3D drone simulation

### ▶ Live: https://asif4517-git.github.io/JLN-STADIUM-KOCHI-3D-/

A self-contained, browser-native reconstruction of the **Jawaharlal Nehru International Stadium,
Kaloor, Kochi** — home of **Kerala Blasters FC** — with a live 11-a-side match, the Manjappada
yellow wall and the real Kaloor surroundings traced from OpenStreetMap.

Everything runs offline in a single HTML file: three.js is bundled, the fonts (Noto Sans
Malayalam + Oswald) are embedded as base64 WOFF2, and all geometry/textures are generated at
runtime. No network calls, no external assets.

---

## What's inside

### The ground
- Two-tier oval bowl, 24 bays — golden lower tier, blue/yellow/green/red upper blocks
- Scalloped PTFE membrane roof, 32 radiating ribs, wavy outer edge
- Four lattice floodlight masts, corner gates, facade fins, glazing bands
- FIFA-standard 105 × 68 m pitch, goals and nets, dugouts, LED perimeter, west big screen

### The surroundings — traced from OpenStreetMap
| Layer | Count |
| --- | --- |
| Road segments (2.3 km radius) | 2 839 |
| Real building footprints + heights | 3 984 |
| Green / leisure polygons | 17 |
| Land-use polygons | 69 |
| Kochi Metro stations | 3 (JLN Stadium, Kaloor, Palarivattom) |

Stadium Road, Stadium Round, Stadium Link Road, Banerji Road, Old NH 47, the
Thevara–Perandoor canal and the Kochi Metro Blue Line viaduct are all in their real positions.

### The match — always a Blasters win
- **Kerala Blasters** in the real Reyaur yellow home kit: Medhaa chest, Batery back,
  Polycab right sleeve, Salpido left sleeve, ISL sleeve patch, Manjappada collar print
- **Mohun Bagan Super Giant** in maroon and green
- Passing, dribbling, tackles, throw-ins, shots, keeper dives and saves, goal nets,
  kick-offs, a compressed 90-minute clock and full-time reset
- Live score in the HUD, on the big screen and on the LED boards
- A match director guarantees the result — typically 2–1 or 3–1 to KBFC

### Manjappada & branding
- ~14 500 instanced supporters, 70 % in club yellow, raised arms, shader-animated flags
- Malayalam banners: **മഞ്ഞപ്പട · എന്നും യെല്ലോ · കേരള ബ്ലാസ്റ്റേഴ്സ് · ജയിക്കാം · നമ്മുടെ പട**
- ISL badge on sleeves, banners and the big screen; LED strip cycling Medhaa, Batery.ai,
  Polycab, Salpido, Reyaur, Freemans and ISL

---

## Controls

| Action | Input |
| --- | --- |
| Fly (drone POV) | `W A S D` / arrow keys |
| Look around | drag (mouse or touch) |
| Climb / descend | `Space` / `C` |
| Boost | `Shift` |
| Zoom (FOV) | scroll |
| Modes | `1` drone · `2` orbit · `3` cinematic tour |
| Reset / hide UI | `R` / `H` |
| Day ↔ night | `N` or the Sky slider |
| Jump to a shot | Drone · Aerial · Roof · Pitch · Stand · Kaloor |

On phones a D-pad appears bottom-right.

---

## Repository layout

```
index.html        ← the built, deployable simulation (GitHub Pages entry point)
build.py          ← bundles src/ + lib/ into index.html
src/              ← source modules
  00-core.js      renderer, sky, lights, helpers
  05-fonts.js     embedded Malayalam + Oswald webfonts
  07-geo-data.js  generated from geo/*.json (OpenStreetMap)
  10-stadium.js   bowl, roof, facade, floodlights, pitch
  15-brand.js     crest, ISL badge, sponsors, jersey/banner textures
  20-surroundings.js  roads, buildings, canal, metro, palms
  30-crowd.js     crowd + full match simulation
  40-controls.js  drone / orbit / tour camera
  45-fx.js        50-ui.js   60-main.js
lib/three.min.js  three.js r149 (bundled)
fonts/            woff2 sources for the embedded fonts
geo/              raw Overpass extracts + build_geo.py generator
previews/         screenshots
```

Rebuild after editing source:

```bash
python3 build.py     # → index.html
```

---

Built by **Asif** · Kaloor, Kochi · three.js r149 · no external dependencies.
