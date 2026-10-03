#!/usr/bin/env python3
"""Record diagrams confirmed by eye: tools/addlabels.py '<board> <fen> [skip,squares]' ...
With just '<board>' the classifier's current reading is accepted as is."""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p = os.path.join(ROOT, "tools", "labels.json")
L = json.load(open(p))
fens = json.load(open(os.path.join(ROOT, "work", "fens.json")))
boards = json.load(open(os.path.join(ROOT, "work", "boards.json")))
for arg in sys.argv[1:]:
    parts = arg.split()
    i = parts[0]
    fen = parts[1] if len(parts) > 1 and "/" in parts[1] else fens[int(i)]["fen"]
    rest = [x for x in parts[1:] if "/" not in x]
    assert sum(int(c) if c.isdigit() else 1 for c in fen.replace("/", "")) == 64, (i, fen)
    b = boards[int(i)]
    L[i] = {"fen": fen, "at": [b["page"], b["box"][0], b["box"][1]]}
    if rest: L[i]["skip"] = rest[0].split(",")
json.dump(L, open(p, "w"), indent=1)
print("labelled diagrams:", len([k for k in L if not k.startswith("_")]))
