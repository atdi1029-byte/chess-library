#!/usr/bin/python3
"""Render every page of the book PDF to work/pages/NNN.png (2x, greyscale)."""
import glob, os, sys
import fitz

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pdf = sys.argv[1] if len(sys.argv) > 1 else glob.glob(os.path.join(root, "*.pdf"))[0]
out = os.path.join(root, "work", "pages")
os.makedirs(out, exist_ok=True)
doc = fitz.open(pdf)
for i, page in enumerate(doc, start=1):
    path = os.path.join(out, f"{i:03d}.png")
    if not os.path.exists(path):
        page.get_pixmap(matrix=fitz.Matrix(2, 2), colorspace=fitz.csGRAY).save(path)
print(len(doc), "pages ->", out)
