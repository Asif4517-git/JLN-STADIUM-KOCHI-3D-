#!/usr/bin/env python3
"""Convert the OpenStreetMap extract around JLN Stadium, Kaloor into a compact
JS world file for the simulation (roads, buildings, water, green, metro)."""
import json, math, pathlib

ROOT = pathlib.Path(__file__).parent
# three Overpass extracts: 1.5 km core, 2.3 km buildings/land use, 2.3 km roads
seen = {}
for name in ("kaloor.json", "extra.json", "roads_extra.json"):
    f = ROOT / name
    if not f.exists():
        continue
    for e in json.load(open(f)).get("elements", []):
        seen[(e.get("type"), e.get("id"))] = e
els = list(seen.values())

LAT0, LON0 = 9.9974, 76.3018
OX, OZ = 103, 1          # align OSM stadium centroid with the model origin
M_LAT = 110540.0
M_LON = 111320.0 * math.cos(math.radians(LAT0))


def xy(lat, lon):
    return ((lon - LON0) * M_LON + OX, (LAT0 - lat) * M_LAT + OZ)


def simplify(pts, tol):
    """Douglas-Peucker"""
    if len(pts) < 3:
        return pts
    def d2(p, a, b):
        ax, ay = a; bx, by = b; px, py = p
        dx, dy = bx - ax, by - ay
        if dx == 0 and dy == 0:
            return (px - ax) ** 2 + (py - ay) ** 2
        t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        cx, cy = ax + t * dx, ay + t * dy
        return (px - cx) ** 2 + (py - cy) ** 2
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        best, idx = -1, -1
        for i in range(a + 1, b):
            dd = d2(pts[i], pts[a], pts[b])
            if dd > best:
                best, idx = dd, i
        if best > tol * tol and idx > 0:
            keep[idx] = True
            stack.append((a, idx)); stack.append((idx, b))
    return [p for p, k in zip(pts, keep) if k]


def geom_xy(e):
    return [xy(g["lat"], g["lon"]) for g in e["geometry"]]


# ---------------------------------------------------------------- roads
HW = {
    "trunk": (18, 0), "trunk_link": (12, 0),
    "primary": (15, 0), "primary_link": (10, 0),
    "secondary": (12, 1), "secondary_link": (8, 1),
    "tertiary": (9.5, 2), "tertiary_link": (7, 2),
    "residential": (6.2, 3), "unclassified": (6.2, 3), "living_street": (5.2, 3),
    "service": (3.6, 4), "footway": (2.0, 5), "path": (2.0, 5), "alley": (3.0, 4),
}
roads = []
for e in els:
    t = e.get("tags", {})
    if "highway" not in t or "geometry" not in e:
        continue
    hw = t["highway"]
    if hw not in HW:
        continue
    w, cls = HW[hw]
    pts = geom_xy(e)
    if len(pts) < 2:
        continue
    pts = simplify(pts, 1.0 if cls >= 3 else 0.6)
    roads.append({
        "w": w, "c": cls,
        "n": t.get("name", ""),
        "p": [round(v, 1) for p in pts for v in p]
    })

# ---------------------------------------------------------------- buildings
SKIP = {"roof", "roofing", "garage", "garages", "shed", "carport", "hut", "kiosk", "toilets", "parking"}
buildings = []
for e in els:
    t = e.get("tags", {})
    if "building" not in t or "geometry" not in e:
        continue
    if t["building"] in SKIP:
        continue
    pts = geom_xy(e)
    if len(pts) < 4:
        continue
    cx = sum(p[0] for p in pts) / len(pts)
    cz = sum(p[1] for p in pts) / len(pts)
    if math.hypot(cx, cz) < 128:          # inside the stadium plot
        continue
    pts = simplify(pts, 0.9)
    if len(pts) < 3:
        continue
    # approximate area
    area = 0.0
    for i in range(len(pts) - 1):
        area += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1]
    area = abs(area) / 2
    btype = t["building"]
    floors = 1
    if area > 600:
        floors = 4
    elif area > 320:
        floors = 3
    elif area > 150:
        floors = 2
    elif area > 90:
        floors = 2
    try:
        lv = int(float(t.get("building:levels", 0)))
        if 1 <= lv <= 18:
            floors = lv
    except Exception:
        pass
    if btype in ("apartments", "residential", "dormitory", "hotel"):
        floors = max(floors, 3 if area > 200 else 2)
    if btype in ("commercial", "retail", "office", "supermarket", "hospital", "school", "college", "university"):
        floors = max(floors, 3)
    if btype in ("church", "temple", "mosque", "chapel", "shrine", "cathedral"):
        floors = max(floors, 2)
    h = 3.2 * floors + 1.2
    if btype in ("church", "temple", "mosque"):
        h += 4
    buildings.append({
        "h": round(min(h, 34), 1),
        "k": 1 if btype in ("apartments", "commercial", "retail", "office", "hotel", "hospital", "school", "college", "university", "supermarket") else 0,
        "p": [round(v, 1) for p in pts for v in p]
    })

# ---------------------------------------------------------------- water
water = []
for e in els:
    t = e.get("tags", {})
    if "geometry" not in e:
        continue
    if t.get("natural") == "water" or ("waterway" in t and t["waterway"] in ("canal", "river", "stream", "drain")):
        pts = geom_xy(e)
        if len(pts) < 4:
            continue
        pts = simplify(pts, 1.5)
        kind = 0 if "waterway" in t else 1
        water.append({"k": kind, "p": [round(v, 1) for p in pts for v in p]})

# ---------------------------------------------------------------- green / land
GREEN = {"pitch": 0, "playground": 0, "recreation_ground": 0, "park": 1, "garden": 1,
         "nature_reserve": 1, "fitness_station": 2}
green = []
for e in els:
    t = e.get("tags", {})
    if "geometry" not in e:
        continue
    if "leisure" in t and t["leisure"] in GREEN:
        pts = geom_xy(e)
        if len(pts) < 4:
            continue
        green.append({"t": GREEN[t["leisure"]], "p": [round(v, 1) for p in simplify(pts, 1.5) for v in p]})

land = []
for e in els:
    t = e.get("tags", {})
    if "geometry" not in e:
        continue
    if t.get("landuse") in ("residential", "retail", "commercial", "industrial", "cemetery"):
        pts = geom_xy(e)
        if len(pts) < 4:
            continue
        land.append({"t": t["landuse"], "p": [round(v, 1) for p in simplify(pts, 2.0) for v in p]})

# ---------------------------------------------------------------- metro chain
segs = []
for e in els:
    t = e.get("tags", {})
    if t.get("railway") == "subway" and "geometry" in e:
        pts = geom_xy(e)
        segs.append([[round(v, 1) for v in p] for p in pts])

def join(segs):
    """greedy chain of segments by endpoint proximity"""
    segs = [s[:] for s in segs if len(s) > 1]
    chain = segs.pop(0)
    changed = True
    while segs and changed:
        changed = False
        for s in segs[:]:
            for rev in (False, True):
                ss = s[::-1] if rev else s
                if math.dist(chain[-1], ss[0]) < 12:
                    chain += ss[1:]; segs.remove(s); changed = True; break
                if math.dist(chain[0], ss[-1]) < 12:
                    chain = ss[:-1] + chain; segs.remove(s); changed = True; break
            if changed:
                break
    return chain

metro = join(segs) if segs else []

# ---------------------------------------------------------------- stations & labels
stations, labels = [], []
for e in els:
    t = e.get("tags", {})
    if e["type"] == "node" and t.get("railway") == "station":
        x, z = xy(e["lat"], e["lon"])
        stations.append({"x": round(x, 1), "z": round(z, 1), "n": t.get("name", ""), "ml": t.get("name:ml", "")})
    if e["type"] == "node" and t.get("name") in ("Kaloor", "Palarivattom", "JLN Stadium"):
        if t.get("railway") == "station":
            pass

# road labels for the big named roads (pick a point near the stadium)
for e in els:
    t = e.get("tags", {})
    n = t.get("name", "")
    if n in ("Banerji Road", "Stadium Road", "Stadium Link Road", "Old NH 47",
             "Kaloor-Kadavanthra Road", "Stadium Round", "Salem - Kochi - Kanyakumari Road") \
            and "geometry" in e and "highway" in t:
        pts = geom_xy(e)
        best = min(pts, key=lambda p: math.hypot(*p))
        if math.hypot(*best) < 1500:
            labels.append({"x": round(best[0], 1), "z": round(best[1], 1), "t": n})

# dedupe labels
seen = set(); lab = []
for l in labels:
    k = l["t"]
    if k in seen:
        continue
    seen.add(k); lab.append(l)
labels = lab

# ---------------------------------------------------------------- stadium plot
plot = None
for e in els:
    t = e.get("tags", {})
    if t.get("leisure") == "stadium":
        pts = geom_xy(e)
        plot = [round(v, 1) for p in pts for v in p]

out = {
    "roads": roads,
    "buildings": buildings,
    "water": water,
    "green": green,
    "land": land,
    "metro": [[round(v, 1) for v in p] for p in metro],
    "stations": stations,
    "labels": labels,
    "plot": plot
}

js = "/* Auto-generated from OpenStreetMap data (ODbL) — Kaloor, Kochi */\nconst GEO = " + \
     json.dumps(out, separators=(",", ":")) + ";\n"
p = ROOT.parent / "src" / "07-geo-data.js"
p.write_text(js)
print("roads", len(roads), "buildings", len(buildings), "water", len(water),
      "green", len(green), "land", len(land), "metro pts", len(metro), "stations", len(stations))
print("wrote", p, round(len(js) / 1024), "KB")
