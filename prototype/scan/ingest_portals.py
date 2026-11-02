"""Turns the Portals export (search picks + promoteNow details, as saved from the browser) into
scan/catalog-raw.json (product type -> items) and scan/aff-links.json (item id -> affiliate short link).
usage: py scan/ingest_portals.py <saved tool result .txt or plain .json>"""
import json
import re
import sys

src = sys.argv[1]
raw = open(src, encoding="utf-8").read()
data = json.loads(raw)
if isinstance(data, list):  # tool-result wrapper: [{type, text}], the text may carry trailing notes
    data = json.JSONDecoder().raw_decode(data[0]["text"])[0]
if isinstance(data, str):
    data = json.loads(data)

picks, details = data["R"], data["P"]


def money(s):
    m = re.search(r"([\d,]+(?:\.\d+)?)", s or "")
    return round(float(m.group(1).replace(",", "")), 2) if m else 0.0


def clean(t):
    t = re.sub(r"\s*\|\s*", ", ", t or "")
    t = re.sub(r"\s+", " ", t).strip(" ,")
    return t if len(t) <= 80 else t[: t.rfind(" ", 0, 78)] + "…"


aff = json.load(open("scan/aff-links.json", encoding="utf-8"))
catalog, missing = {}, 0
for label, items in picks.items():
    out = []
    for it in items or []:
        d = details.get(str(it["id"]))
        if not d or not d.get("u") or not d.get("img"):
            missing += 1
            continue
        price, orig = money(d["p"]), money(d["o"])
        out.append({
            "ali": str(it["id"]),
            "title": clean(d["t"]),
            "price": price,
            "off": round((1 - price / orig) * 100) if orig > price > 0 else 0,
            "sold": it.get("s", 0),
            "star": 0,
            "img": d["img"] + "_350x350.jpg",
        })
        aff[str(it["id"])] = d["u"]
    catalog[label] = out

# curated products: links (and current prices for data.ts) even if they are not in any search pick
curated = {k: v for k, v in details.items() if v and v.get("u")}
for k, v in curated.items():
    aff[k] = v["u"]

json.dump(catalog, open("scan/catalog-raw.json", "w", encoding="utf-8"), ensure_ascii=False)
json.dump(aff, open("scan/aff-links.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
json.dump({k: {"price": money(v["p"]), "orig": money(v["o"])} for k, v in curated.items()},
          open("scan/current-prices.json", "w", encoding="utf-8"), ensure_ascii=False)
labels_with = sum(1 for v in catalog.values() if v)
print(f"labels {len(catalog)}, with items {labels_with}, items {sum(len(v) for v in catalog.values())}, "
      f"skipped {missing}, affiliate links {len(aff)}")
