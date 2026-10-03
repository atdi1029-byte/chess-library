#!/usr/bin/env python3
"""Contact sheet of chosen diagrams: tools/sheet.py out.png board_index [board_index ...]"""
import io, json, os, sys, glob
import fitz
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
boards = json.load(open(os.path.join(ROOT, "work", "boards.json")))
doc = fitz.open(glob.glob(os.path.join(ROOT, "*.pdf"))[0])

def board_image(i, size=520):
    b = boards[i]
    page = doc[b["page"] - 1]
    img = Image.open(io.BytesIO(doc.extract_image(page.get_images(full=True)[0][0])["image"])).convert("L")
    x0, y0, x1, y1 = b["box"]
    return img.crop((x0 - 3, y0 - 3, x1 + 3, y1 + 3)).resize((size, size), Image.LANCZOS)

def sheet(out, ids, per=3, size=520):
    rows = (len(ids) + per - 1) // per
    im = Image.new("L", (per * (size + 20), rows * (size + 40)), 255)
    d = ImageDraw.Draw(im)
    for k, i in enumerate(ids):
        x, y = (k % per) * (size + 20), (k // per) * (size + 40)
        im.paste(board_image(i, size), (x, y + 30))
        d.text((x + 4, y + 8), f"#{i}  p{boards[i]['page']}.{boards[i]['idx']}", fill=0)
    im.save(out)

if __name__ == "__main__":
    sheet(sys.argv[1], [int(a) for a in sys.argv[2:]])


def overlay_sheet(out, ids, per=3, size=560):
    """Same sheet, with the classifier's reading written in the corner of each square."""
    fens = json.load(open(os.path.join(ROOT, "work", "fens.json")))
    rows = (len(ids) + per - 1) // per
    im = Image.new("RGB", (per * (size + 20), rows * (size + 40)), "white")
    d = ImageDraw.Draw(im)
    for k, i in enumerate(ids):
        x, y = (k % per) * (size + 20), (k // per) * (size + 40)
        im.paste(board_image(i, size).convert("RGB"), (x, y + 30))
        d.text((x + 4, y + 8), f"#{i}  p{boards[i]['page']}.{boards[i]['idx']}  {fens[i]['fen']}", fill=(0, 0, 0))
        sq = []
        for ch in fens[i]["fen"]:
            if ch == "/": continue
            sq.extend("." * int(ch) if ch.isdigit() else ch)
        doubt = {q[0] for q in fens[i]["doubt"]}
        cw = size / 8
        for s, ch in enumerate(sq):
            cx, cy = x + (s % 8) * cw, y + 30 + (s // 8) * cw
            name = "abcdefgh"[s % 8] + "87654321"[s // 8]
            if ch != ".":
                d.rectangle((cx + 1, cy + 1, cx + 13, cy + 14), fill=(255, 255, 255))
                d.text((cx + 4, cy + 2), ch, fill=(220, 0, 0) if ch.isupper() else (0, 60, 220))
            if name in doubt:
                d.rectangle((cx + 2, cy + 2, cx + cw - 2, cy + cw - 2), outline=(255, 140, 0), width=2)
    im.save(out)
