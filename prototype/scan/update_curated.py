"""Refreshes price/orig of the hand-picked products in src/data.ts from scan/current-prices.json (Portals, ILS)."""
import json
import re

prices = json.load(open("scan/current-prices.json", encoding="utf-8"))
path = "src/data.ts"
src = open(path, encoding="utf-8").read()
changed = []


def fix(m):
    ali = m.group(1)
    cur = prices.get(ali)
    if not cur or not cur["price"]:
        return m.group(0)
    price = cur["price"]
    orig = cur["orig"] if cur["orig"] > price else round(price * 1.3, 2)
    line = re.sub(r"price: [\d.]+", f"price: {price:g}", m.group(0), count=1)
    line = re.sub(r"orig: [\d.]+", f"orig: {orig:g}", line, count=1)
    if line != m.group(0):
        changed.append(ali)
    return line


src = re.sub(r'ali: "(\d+)"[^\n]*', fix, src)
open(path, "w", encoding="utf-8").write(src)
print("updated", len(changed), "products")
