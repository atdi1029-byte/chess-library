#!/usr/bin/env python3
"""Find every chess diagram in the scanned book and cut it into 64 squares.

Writes work/boards.json: [{page, idx, box:[x0,y0,x1,y1]}] in native scan pixels,
and work/cells.npy: uint8 array [n_boards, 64, S, S] (0 = black ink, 255 = paper),
squares in a8..h1 order.
"""
import glob, io, json, os, sys
import numpy as np
import fitz
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = glob.glob(os.path.join(ROOT, "*.pdf"))[0]
S = 24  # every square is resampled to S x S


def page_bitmap(doc, pno):
    page = doc[pno]
    images = page.get_images(full=True)
    if not images:  # a blank page
        return np.zeros((int(page.rect.height), int(page.rect.width)), bool)
    img = Image.open(io.BytesIO(doc.extract_image(images[0][0])["image"])).convert("L")
    return np.asarray(img) < 128  # True = ink


def runs(line, minlen):
    """(start, end) of every run of True at least minlen long."""
    d = np.diff(np.concatenate(([0], line.view(np.int8), [0])))
    starts, ends = np.flatnonzero(d == 1), np.flatnonzero(d == -1)
    keep = (ends - starts) >= minlen
    return list(zip(starts[keep], ends[keep]))


def find_boards(ink):
    h, w = ink.shape
    # long horizontal ink runs = candidate top/bottom borders
    segs = []
    for y in range(h):
        for x0, x1 in runs(ink[y], 60):
            if x1 - x0 < 420:  # the frame boxes are wider than any board
                segs.append((y, int(x0), int(x1)))
    # a border on a slightly tilted scan breaks across neighbouring rows: join the pieces
    lines = []
    for y, x0, x1 in segs:
        for ln in lines:
            if y - ln[1] <= 2 and min(x1, ln[3]) - max(x0, ln[2]) > -6:
                ln[1] = y; ln[2] = min(ln[2], x0); ln[3] = max(ln[3], x1)
                break
        else:
            lines.append([y, y, x0, x1])
    lines = [ln for ln in lines if 110 <= ln[3] - ln[2] < 420]
    boards = []
    for i, a in enumerate(lines):
        for b in lines[i + 1:]:
            if abs(a[2] - b[2]) > 12 or abs(a[3] - b[3]) > 12:
                continue
            x0, x1 = min(a[2], b[2]), max(a[3], b[3])
            width, height = x1 - x0, b[1] - a[0]
            if height < 100 or abs(width - height) > 0.08 * width:
                continue
            # the side borders must be there too
            left = ink[a[1]:b[0], x0:x0 + 8].any(axis=1).mean()
            right = ink[a[1]:b[0], x1 - 8:x1].any(axis=1).mean()
            if left < 0.9 or right < 0.9:
                continue
            boards.append((x0, a[0], x1, b[1] + 1))
    # drop boxes that contain another (double borders give nested hits)
    boards = sorted(set(boards), key=lambda r: (r[1], r[0]))
    out = []
    for r in boards:
        if not any(o != r and abs(o[0] - r[0]) < 14 and abs(o[1] - r[1]) < 14 and (o[2] - o[0]) < (r[2] - r[0]) for o in boards):
            out.append(r)
    return out


def inner_box(ink, box):
    """Shrink the box past the solid border lines."""
    x0, y0, x1, y1 = box
    # walk in from each side until past the solid border line (up to 12 px on a tilted scan)
    def peel(strip_at, lo, hi, step):
        pos, seen = lo, False
        for _ in range(12):
            dense = strip_at(pos).mean() > 0.6
            if seen and not dense: break
            seen = seen or dense
            pos += step
        return pos if seen else lo
    y0 = peel(lambda y: ink[y, x0 + 12:x1 - 12], y0, y1, 1)
    y1 = peel(lambda y: ink[y - 1, x0 + 12:x1 - 12], y1, y0, -1)
    x0 = peel(lambda x: ink[y0 + 12:y1 - 12, x], x0, x1, 1)
    x1 = peel(lambda x: ink[y0 + 12:y1 - 12, x - 1], x1, x0, -1)
    return x0, y0, x1, y1


def cut_cells(ink, box):
    x0, y0, x1, y1 = box
    img = Image.fromarray(np.where(ink, 0, 255).astype(np.uint8))
    cells = np.zeros((64, S, S), np.uint8)
    cw, ch = (x1 - x0) / 8, (y1 - y0) / 8
    for r in range(8):
        for c in range(8):
            crop = img.crop((round(x0 + c * cw), round(y0 + r * ch), round(x0 + (c + 1) * cw), round(y0 + (r + 1) * ch)))
            cells[r * 8 + c] = np.asarray(crop.resize((S, S), Image.BOX))
    return cells


def main():
    doc = fitz.open(PDF)
    boards, cells = [], []
    for pno in range(len(doc)):
        ink = page_bitmap(doc, pno)
        found = [inner_box(ink, b) for b in find_boards(ink)]
        for idx, box in enumerate(found):
            boards.append({"page": pno + 1, "idx": idx, "box": [int(v) for v in box]})
            cells.append(cut_cells(ink, box))
    json.dump(boards, open(os.path.join(ROOT, "work", "boards.json"), "w"))
    np.save(os.path.join(ROOT, "work", "cells.npy"), np.array(cells))
    per_page = {}
    for b in boards:
        per_page[b["page"]] = per_page.get(b["page"], 0) + 1
    sizes = sorted({b["box"][2] - b["box"][0] for b in boards})
    print(len(boards), "boards on", len(per_page), "pages; widths", sizes[:5], "...", sizes[-5:])
    return per_page


if __name__ == "__main__":
    pp = main()
    print("pages 28-60:", {p: pp.get(p, 0) for p in range(28, 61)})
