#!/usr/bin/env python3
"""Bundle src/ + three.js into one self-contained HTML file."""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"

order = ["00-core.js", "05-fonts.js", "07-geo-data.js", "10-stadium.js", "15-brand.js",
         "20-surroundings.js", "30-crowd.js", "40-controls.js", "45-fx.js", "50-ui.js",
         "60-main.js"]

html = (SRC / "index.html").read_text(encoding="utf-8")
three = (ROOT / "lib" / "three.min.js").read_text(encoding="utf-8")

blocks = ["<script>\n" + three + "\n</script>"]
for name in order:
    p = SRC / name
    code = p.read_text(encoding="utf-8")
    if "</script" in code.lower():
        sys.exit(f"ERROR: {name} contains a closing script tag")
    blocks.append("<script>\n/* ==== " + name + " ==== */\n" + code + "\n</script>")

out = html.replace("<!--SCRIPTS-->", "\n".join(blocks))
dest = ROOT / "kaloor-stadium.html"
dest.write_text(out, encoding="utf-8")
print(f"built {dest} — {len(out)/1024:.0f} KB")
