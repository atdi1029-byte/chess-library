#!/usr/bin/env python3
"""Print what is on each page: tools/digest.py first_page last_page  (OCR text + diagram readings)."""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fens = json.load(open(os.path.join(ROOT, "work", "fens.json")))
labels = json.load(open(os.path.join(ROOT, "tools", "labels.json")))
a, b = int(sys.argv[1]), int(sys.argv[2])
for pn in range(a, b + 1):
    rows = json.load(open(os.path.join(ROOT, "work", "ocr", f"{pn:03d}.json")))
    items = [(r["y"], "T", r["t"]) for r in rows]
    for f in fens:
        if f["page"] == pn:
            box = json.load(open(os.path.join(ROOT, "work", "boards.json")))[f["i"]]["box"]
            ok = "=" if str(f["i"]) in labels else "~"
            items.append((box[1] / 1028.0, "B", f"[#{f['i']} {ok} {f['fen']}  w{box[2]-box[0]} x{box[0]} doubt:{len(f['doubt'])}]"))
    # compact: text runs joined on one line, each diagram on its own line
    print(f"=== p{pn}")
    run = []
    for y, kind, t in sorted(items):
        if kind == "T" and t.strip() in ("FOR THE CORRECT ANSWER TURN TO THE NEXT", "PAGE", "(continued)"): continue
        if kind == "T": run.append(t)
        else:
            if run: print("   " + " | ".join(run)); run = []
            print(" " + t)
    if run: print("   " + " | ".join(run))
