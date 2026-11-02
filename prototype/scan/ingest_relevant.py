"""Builds scan/catalog-raw.json from the relevance-filtered picks (ml/relevant.json: product type -> items whose
photo the recognizer files under that type) and the Portals promoteNow details (Hebrew title, ILS price, affiliate
link). Adds every link to scan/aff-links.json.
usage: py scan/ingest_relevant.py <relevant.json> <details export> [<details export> ...]"""
import json
import re
import sys


def load_export(path):
    data = json.load(open(path, encoding="utf-8"))
    if isinstance(data, list):
        data = json.JSONDecoder().raw_decode(data[0]["text"])[0]
    if isinstance(data, str):
        data = json.loads(data)
    return data.get("P") or data.get("P2") or data


def money(s):
    m = re.search(r"([\d,]+(?:\.\d+)?)", s or "")
    return round(float(m.group(1).replace(",", "")), 2) if m else 0.0


def clean(t):
    t = re.sub(r"\s*\|\s*", ", ", t or "")
    t = re.sub(r"\s+", " ", t).strip(" ,")
    return t if len(t) <= 80 else t[: t.rfind(" ", 0, 78)] + "…"


picks = json.load(open(sys.argv[1], encoding="utf-8"))
details = {}
for p in sys.argv[2:]:
    details.update({k: v for k, v in load_export(p).items() if v and v.get("u")})

aff = json.load(open("scan/aff-links.json", encoding="utf-8"))
catalog, dropped = {}, []
for label, items in picks.items():
    out = []
    for it in items:
        d = details.get(str(it["id"]))
        if not d or not d.get("img"):
            dropped.append(it["id"])
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

json.dump(catalog, open("scan/catalog-raw.json", "w", encoding="utf-8"), ensure_ascii=False)
json.dump(aff, open("scan/aff-links.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(f"types {len(catalog)}, with items {sum(1 for v in catalog.values() if v)}, items {sum(len(v) for v in catalog.values())}, "
      f"without details {len(dropped)}, under 2 items {[k for k, v in catalog.items() if len(v) < 2]}")
