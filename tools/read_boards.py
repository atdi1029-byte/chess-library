#!/usr/bin/env python3
"""Read every diagram into a FEN with a nearest-neighbour square classifier.

Trained on tools/labels.json (diagrams read by eye). Writes work/fens.json:
[{i, page, idx, fen, doubt: [[square, margin], ...]}]  -- low margin = look at it.
"""
import json, os
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cells = np.load(os.path.join(ROOT, "work", "cells.npy")).astype(np.float32) / 255.0
boards = json.load(open(os.path.join(ROOT, "work", "boards.json")))
labels = {k: v for k, v in json.load(open(os.path.join(ROOT, "tools", "labels.json"))).items() if not k.startswith("_")}
S = cells.shape[2]
SQ = [f + r for r in "87654321" for f in "abcdefgh"]


def soft(a):
    p = np.pad(a, 1, mode="edge")
    b = sum(p[dy:dy + S, dx:dx + S] for dy in range(3) for dx in range(3)) / 9.0
    return b.reshape(S // 2, 2, S // 2, 2).mean(axis=(1, 3))


def shifts(a):
    return np.array([soft(np.roll(np.roll(a, dy, 0), dx, 1))[1:-1, 1:-1] for dy in (-1, 0, 1) for dx in (-1, 0, 1)])


def expand(fen):
    out = []
    for ch in fen.split()[0]:
        if ch == "/": continue
        out.extend("." * int(ch) if ch.isdigit() else ch)
    assert len(out) == 64, fen
    return out


def is_light(s):
    return (s // 8 + s % 8) % 2 == 0


train = {True: ([], []), False: ([], [])}
for key, lab in labels.items():
    want = expand(lab["fen"])
    for s in range(64):
        if SQ[s] in lab.get("skip", []): continue
        X, y = train[is_light(s)]
        X.append(soft(cells[int(key), s])[1:-1, 1:-1]); y.append(want[s])
train = {k: (np.array(X), np.array(y)) for k, (X, y) in train.items()}


def classify(cell, light):
    X, y = train[light]
    sh = shifts(cell)                                            # [9, h, w]
    d = np.abs(X[:, None] - sh[None]).mean(axis=(2, 3)).min(axis=1)  # best shift per training square
    order = np.argsort(d)
    best = y[order[0]]
    other = next((d[j] for j in order if y[j] != best), 1.0)
    return best, float(d[order[0]]), float(other - d[order[0]])


def to_fen(sq):
    rows = []
    for r in range(8):
        row, gap = "", 0
        for c in range(8):
            ch = sq[r * 8 + c]
            if ch == ".": gap += 1
            else:
                row += (str(gap) if gap else "") + ch; gap = 0
        rows.append(row + (str(gap) if gap else ""))
    return "/".join(rows)


out = []
for i, b in enumerate(boards):
    sq, doubt = [], []
    for s in range(64):
        ch, dist, margin = classify(cells[i, s], is_light(s))
        sq.append(ch)
        if margin < 0.03 or dist > 0.10:
            doubt.append([SQ[s], ch, round(dist, 3), round(margin, 3)])
    out.append({"i": i, "page": b["page"], "idx": b["idx"], "fen": to_fen(sq), "doubt": doubt})
json.dump(out, open(os.path.join(ROOT, "work", "fens.json"), "w"), indent=0)

classes = {k: sorted(set(v[1])) for k, v in train.items()}
print("training squares:", {("light" if k else "dark"): len(v[1]) for k, v in train.items()})
print("light classes:", "".join(classes[True]), "| dark classes:", "".join(classes[False]))
nd = [len(o["doubt"]) for o in out]
print("boards:", len(out), "| with no doubtful square:", sum(1 for n in nd if n == 0), "| doubtful squares total:", sum(nd))
