import { useEffect, useMemo, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { BUDGETS, CATEGORIES, CURATED as PICKS, INTERESTS, MODULE_STATS, PRODUCTS, RECIPIENTS, img } from "./data";
import type { CatId, Product } from "./data";
import { allLabels, itemsFor, onProgress, recognize, warmup } from "./recognize";
import type { Guess, ScanItem, ScanLabel } from "./recognize";
import { productLink, searchLink } from "./links";

type View =
  | { v: "home" } | { v: "cat"; id: CatId } | { v: "product"; id: string; from: string }
  | { v: "scan" } | { v: "gift" } | { v: "search"; q: string } | { v: "admin" };

const Ic = ({ name, size = 22 }: { name: string; size?: number }) => {
  const C = (Icons as any)[name] || Icons.Package;
  return <C size={size} aria-hidden="true" />;
};
const ils = (n: number) => `${n.toLocaleString("he-IL")} ₪`;
// compared with the Israeli store estimate when we have one, otherwise with the AliExpress price before discount
const wasPrice = (p: Product) => p.store || p.orig;
const saveStore = (p: Product) => (wasPrice(p) > p.price ? Math.round((1 - p.price / wasPrice(p)) * 100) : 0);
const byId = (id: string) => PRODUCTS.find((p) => p.id === id)!;
// the admin demo stays out of the public build
const PAGES = import.meta.env.DEV ? ["scan", "gift", "admin"] : ["scan", "gift"];
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("a11y-noanim");
const aliUrl = (p: Product) => productLink(p.ali);

function fromHash(): View {
  const h = location.hash.replace("#", "");
  if (PAGES.includes(h)) return { v: h } as View;
  const cat = CATEGORIES.find((c) => c.id === h);
  if (cat) return { v: "cat", id: cat.id };
  return { v: "home" };
}

// fade-up elements marked .rv as they scroll into view, including ones rendered later (gift results, filtered grids)
function useReveal(dep: unknown) {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      const showAll = () => document.querySelectorAll<HTMLElement>(".rv:not(.in)").forEach((e) => e.classList.add("in"));
      showAll();
      const mo = new MutationObserver(showAll);
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    const watched = new WeakSet<Element>();
    const scan = () => document.querySelectorAll<HTMLElement>(".rv:not(.in)").forEach((e) => { if (!watched.has(e)) { watched.add(e); io.observe(e); } });
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { mo.disconnect(); io.disconnect(); };
  }, [dep]);
}

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) { setN(to); return; }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => { const k = Math.min(1, (t - t0) / 1400); setN(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref} className="num">{n.toLocaleString("he-IL")}{suffix}</span>;
}

export default function App() {
  const [view, setView] = useState<View>(() => { try { return fromHash(); } catch { return { v: "home" }; } });
  const [q, setQ] = useState("");
  const [toast, setToast] = useState("");
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const key = JSON.stringify(view);
  useReveal(key);

  const go = (next: View) => {
    setView(next);
    window.scrollTo({ top: 0 });
    try {
      const token = next.v === "cat" ? next.id : PAGES.includes(next.v) ? next.v : "";
      history.replaceState(null, "", token ? `#${token}` : location.pathname);
    } catch { /* hash not available */ }
  };
  const open = (p: Product, from: string) => go({ v: "product", id: p.id, from });
  const buy = (p: Product, _from: string) => { window.open(aliUrl(p), "_blank", "noopener,noreferrer"); };
  useEffect(() => { document.documentElement.lang = "he"; document.documentElement.dir = "rtl"; }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 3800); return () => clearTimeout(t); }, [toast]);

  const ticker = ["p5", "p9", "p1", "p6", "p3", "p16", "p12", "p10"].map(byId);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only">דילוג לתוכן</a>
      <section className="ticker" aria-label="מבצעים חמים">
        <div className="ticker-track">
          {[0, 1].map((k) => (
            <span key={k} className="ticker-set" aria-hidden={k === 1}>
              {ticker.map((p) => <span key={p.id} className="tick num"><i />{p.title.split(" ").slice(0, 3).join(" ")} · <s>{ils(p.store)} בחנות</s> <b>{ils(p.price)}</b></span>)}
            </span>
          ))}
        </div>
      </section>
      <header className="mast">
        <div className="wrap mast-row">
          <button className="logo" onClick={() => go({ v: "home" })} aria-label="קונים חכם, לעמוד הראשי">
            <span className="logo-mark"><Ic name="ScanLine" size={20} /></span>
            <span><span className="logo-name">קונים חכם</span><span className="logo-sub">ראיתם בחנות. קניתם בחכמה.</span></span>
          </button>
          <nav className="nav" aria-label="ניווט ראשי">
            <button aria-current={view.v === "cat" ? "page" : undefined} onClick={() => go({ v: "cat", id: "gadgets" })}>קטגוריות</button>
            <button aria-current={view.v === "scan" ? "page" : undefined} onClick={() => go({ v: "scan" })} className="nav-cta"><Ic name="Camera" size={16} />צלם ומצא</button>
            <button aria-current={view.v === "gift" ? "page" : undefined} onClick={() => go({ v: "gift" })}>מוצא מתנות</button>
          </nav>
          <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) go({ v: "search", q: q.trim() }); }}>
            <Ic name="Search" size={17} />
            <label htmlFor="q" className="sr-only">חיפוש מוצר</label>
            <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש: מצלמת דרך, מברגה..." />
          </form>
        </div>
      </header>

      <main id="main" key={key} className="view">
        {view.v === "home" && <Home go={go} open={open} />}
        {view.v !== "home" && (
          <div className="wrap page">
            {view.v === "cat" && <Category id={view.id} open={open} products={products} go={go} />}
            {view.v === "search" && <Search q={view.q} open={open} products={products} />}
            {view.v === "product" && <ProductPage p={products.find((p) => p.id === view.id)!} from={view.from} buy={buy} open={open} products={products} />}
            {view.v === "gift" && <GiftFinder open={open} products={products} />}
            {view.v === "scan" && <Scan />}
            {view.v === "admin" && <Admin products={products} setProducts={setProducts} setToast={setToast} />}
          </div>
        )}
      </main>

      <footer>
        <div className="wrap cols">
          <div style={{ display: "grid", gap: 10 }}>
            <span className="logo-name">קונים חכם</span>
            <p>האתר מציג מוצרים מ-AliExpress ומוצא עבורכם את המחירים הזולים ביותר. הרכישה, המשלוח והאחריות הם מול AliExpress. מחירי החנויות בישראל הם הערכה להמחשה.</p>
          </div>
          <div style={{ display: "grid", gap: 4, alignContent: "start" }}>
            <a href="accessibility.html">הצהרת נגישות</a>
            <a href="privacy.html">מדיניות פרטיות</a>
            <a href="terms.html">תקנון ותנאי שימוש</a>
            <a href="cookies.html">מדיניות עוגיות</a>
            <a href="returns.html">החזרות והחזר כספי</a>
            {import.meta.env.DEV && <button onClick={() => go({ v: "admin" })}>ממשק ניהול (לערן)</button>}
          </div>
        </div>
        <div className="wrap copy">© {new Date().getFullYear()} קונים חכם. תמונות המוצרים מ-AliExpress, כל הזכויות שמורות לבעליהן.</div>
      </footer>

      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

/* ---------- shared ---------- */
function Card({ p, onOpen, i = 0 }: { p: Product; onOpen: () => void; i?: number }) {
  const tilt = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--rx", `${((e.clientY - r.top) / r.height - 0.5) * -8}deg`);
    e.currentTarget.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 8}deg`);
  };
  const reset = (e: React.PointerEvent<HTMLButtonElement>) => { e.currentTarget.style.setProperty("--rx", "0deg"); e.currentTarget.style.setProperty("--ry", "0deg"); };
  return (
    <button className="card rv" style={{ "--d": `${(i % 4) * 70}ms` } as React.CSSProperties} onClick={onOpen} onPointerMove={tilt} onPointerLeave={reset}>
      <div className="thumb"><img src={p.img} alt="" loading="lazy" referrerPolicy="no-referrer" />{saveStore(p) >= 10 && <span className="off num">-{saveStore(p)}%</span>}</div>
      <div className="card-body">
        <span className="card-title">{p.title}</span>
        <span className="price-row num"><span className="price">{ils(p.price)}</span>{p.store ? <span className="was">בחנות ~{ils(p.store)}</span> : saveStore(p) > 0 && <span className="was"><s>{ils(p.orig)}</s></span>}</span>
        <span className="meta num">{p.rating ? <><Ic name="Star" size={13} />{p.rating} · {p.orders.toLocaleString("he-IL")} הזמנות</> : soldText(p.orders)}</span>
      </div>
    </button>
  );
}
const Grid = ({ items, open, from }: { items: Product[]; open: (p: Product, f: string) => void; from: string }) => (
  <div className="grid">{items.map((p, i) => <Card key={p.id} p={p} i={i} onOpen={() => open(p, from)} />)}</div>
);

/* ---------- home ---------- */
const DEMO = [
  { id: "p5", store: 899, where: "רשת אלקטרוניקה" },
  { id: "p9", store: 349, where: "חנות כלי עבודה" },
  { id: "p1", store: 249, where: "חנות סלולר" },
];
const WORDS = ["בחנות", "בקניון", "אצל חבר", "ברשת"];

function Home({ go, open }: { go: (v: View) => void; open: (p: Product, f: string) => void }) {
  const [k, setK] = useState(0);
  const [w, setW] = useState(0);
  useEffect(() => {
    const a = setInterval(() => { if (!still()) setK((x) => (x + 1) % DEMO.length); }, 4200);
    const b = setInterval(() => { if (!still()) setW((x) => (x + 1) % WORDS.length); }, 2200);
    return () => { clearInterval(a); clearInterval(b); };
  }, []);
  const d = DEMO[k]; const p = byId(d.id);
  const spot = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  const rail = [...PICKS].sort((a, b) => saveStore(b) - saveStore(a)).slice(0, 10);

  return (
    <>
      <section className="wrap section">
        <div className="section-head rv"><span className="eyebrow">קטגוריות</span><h1>מה מחפשים היום?</h1></div>
        <div className="cats">
          {CATEGORIES.map((c, i) => (
            <button key={c.id} className={`cat rv ${i === 0 ? "cat-big" : ""}`} style={{ "--d": `${i * 70}ms` } as React.CSSProperties} onClick={() => go({ v: "cat", id: c.id })}>
              <img src={img(c.cover)} alt="" loading="lazy" />
              <span className="cat-cap"><b>{c.name}</b><small>{c.line}</small></span>
              <span className="cat-go"><Ic name="ArrowLeft" size={18} /></span>
            </button>
          ))}
        </div>
      </section>

      <section className="section rail-wrap" aria-labelledby="rail-t">
        <div className="wrap section-head rv"><span className="eyebrow">החיסכון הכי גדול</span><h2 id="rail-t">המציאות של השבוע</h2></div>
        <div className="rail">
          <div className="rail-track">
            {[0, 1].map((r) => rail.map((p) => (
              <button key={r + p.id} className="rail-card" tabIndex={r ? -1 : 0} aria-hidden={r === 1} onClick={() => open(p, "קטלוג")}>
                <img src={p.img} alt="" loading="lazy" />
                <span className="rail-off num">-{saveStore(p)}%</span>
                <span className="rail-t">{p.title}</span>
                <span className="num"><b className="price">{ils(p.price)}</b> <s className="was">{ils(p.store)}</s></span>
              </button>
            )))}
          </div>
        </div>
      </section>

      <section className="hero" onPointerMove={spot} aria-labelledby="hero-t">
        <div className="aurora" aria-hidden="true"><i /><i /><i /></div>
        <div className="wrap hero-in">
          <div className="hero-copy">
            <span className="eyebrow gold">צלם ומצא · חיסכון אמיתי</span>
            <h2 id="hero-t">ראיתם מוצר <span className="swap" key={w}>{WORDS[w]}</span>?<br />צלמו אותו.<br /><em>קבלו אותו בזול.</em></h2>
            <p>מצלמים את המוצר, ואנחנו מזהים אותו ומוצאים אותו ב-AliExpress, בדרך כלל בחצי מהמחיר שראיתם ומשלוח עד הבית.</p>
            <div className="hero-cta">
              <button className="btn btn-gold btn-lg" onClick={() => go({ v: "scan" })}><Ic name="Camera" size={20} />צלמו מוצר עכשיו</button>
            </div>
          </div>

          <div className="phone" role="img" aria-label={`הדגמה: ${p.title}, ${ils(d.store)} ב${d.where}, ${ils(p.price)} אצלנו`}>
            <div className="phone-screen" key={k}>
              <img src={p.img} alt="" className="phone-img" />
              <span className="scanline" aria-hidden="true" />
              <span className="corner c1" /><span className="corner c2" /><span className="corner c3" /><span className="corner c4" />
              <div className="tag tag-store num"><small>{d.where}</small><s>{ils(d.store)}</s></div>
              <div className="tag tag-ali num"><small>אצלנו ב-AliExpress</small><b>{ils(p.price)}</b></div>
              <div className="tag tag-save num">חסכתם {ils(d.store - p.price)}</div>
            </div>
            <div className="phone-dots" aria-hidden="true">{DEMO.map((_, i) => <i key={i} className={i === k ? "on" : ""} />)}</div>
          </div>
        </div>
      </section>

      <section className="stats wrap" aria-label="במספרים">
        <div className="stat rv"><b><CountUp to={3} /></b><span>שניות לזיהוי מוצר</span></div>
        <div className="stat rv" style={{ "--d": "80ms" } as React.CSSProperties}><b><CountUp to={60} suffix="%" /></b><span>חיסכון ממוצע מול מחיר בחנות*</span></div>
        <div className="stat rv" style={{ "--d": "160ms" } as React.CSSProperties}><b><CountUp to={0} suffix=" ₪" /></b><span>בלי הרשמה ובלי תשלום</span></div>
      </section>

      <section className="wrap section">
        <button className="gift-band rv" onClick={() => go({ v: "gift" })}>
          <span className="gift-imgs" aria-hidden="true">{["p3", "p14", "p20"].map((id) => <img key={id} src={img(id)} alt="" />)}</span>
          <span className="gift-copy"><span className="eyebrow gold">מוצא מתנות</span><b>לא יודעים מה לקנות? 4 שאלות, ויש לכם מתנה.</b><span className="link-gold">למוצא המתנות <Ic name="ArrowLeft" size={16} /></span></span>
        </button>
        <p className="foot-note">* מחירי החנויות בישראל באתר הם הערכה להמחשה. המחיר הסופי נקבע ב-AliExpress.</p>
      </section>
    </>
  );
}

/* ---------- category / search ---------- */
function Category({ id, open, products, go }: { id: CatId; open: (p: Product, f: string) => void; products: Product[]; go: (v: View) => void }) {
  const c = CATEGORIES.find((x) => x.id === id)!;
  const [max, setMax] = useState(0);
  const [sort, setSort] = useState("off");
  const items = useMemo(() => {
    const r = products.filter((p) => p.cat === id && (!max || p.price <= max));
    return [...r].sort((a, b) => sort === "price" ? a.price - b.price : sort === "orders" ? b.orders - a.orders : saveStore(b) - saveStore(a));
  }, [id, max, sort, products]);
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="cat-tabs" role="tablist" aria-label="קטגוריות">
        {CATEGORIES.map((x) => (
          <button key={x.id} role="tab" aria-selected={x.id === id} onClick={() => go({ v: "cat", id: x.id })}>
            <img src={img(x.cover)} alt="" />{x.short}
          </button>
        ))}
      </div>
      <div className="page-title"><span className="eyebrow">קטגוריה</span><h1>{c.name}</h1><div className="chips">{c.subs.map((s) => <span key={s} className="chip">{s}</span>)}</div></div>
      <div className="chips" style={{ alignItems: "center" }}>
        <label htmlFor="max" className="eyebrow">עד מחיר</label>
        <select id="max" className="chip" value={max} onChange={(e) => setMax(+e.target.value)}>
          <option value={0}>הכול</option>{BUDGETS.map((b) => <option key={b} value={b}>{ils(b)}</option>)}
        </select>
        <label htmlFor="sort" className="eyebrow">מיון</label>
        <select id="sort" className="chip" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="off">חיסכון הכי גדול</option><option value="price">מחיר נמוך</option><option value="orders">הכי נמכר</option>
        </select>
      </div>
      {items.length ? <Grid items={items} open={open} from="קטלוג" /> : <p className="demo-note">אין מוצרים בטווח המחיר הזה. נסו להרחיב את הסינון.</p>}
    </div>
  );
}
function Search({ q, open, products }: { q: string; open: (p: Product, f: string) => void; products: Product[] }) {
  const items = products.filter((p) => (p.title + p.desc).includes(q));
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="page-title"><span className="eyebrow">תוצאות חיפוש</span><h1>"{q}"</h1></div>
      {items.length ? <Grid items={items} open={open} from="קטלוג" /> : <p className="demo-note">לא מצאנו במאגר. בגרסה המלאה החיפוש ימשיך ל-AliExpress ויחזיר תוצאות עם הלינק שלך.</p>}
    </div>
  );
}

/* ---------- product ---------- */
function ProductPage({ p, from, buy, open, products }: { p: Product; from: string; buy: (p: Product, f: string) => void; open: (p: Product, f: string) => void; products: Product[] }) {
  const similar = products.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  const cat = CATEGORIES.find((c) => c.id === p.cat);
  return (
    <div style={{ display: "grid", gap: 32 }}>
      <div className="product">
        <div className="product-img rv"><img src={p.img} alt={p.title} referrerPolicy="no-referrer" />{saveStore(p) >= 10 && <span className="off num">-{saveStore(p)}%</span>}</div>
        <div className="rv" style={{ display: "grid", gap: 14, alignContent: "start", "--d": "100ms" } as React.CSSProperties}>
          {cat && <span className="eyebrow">{cat.name}</span>}
          <h1 style={{ margin: 0, fontSize: "clamp(26px,3.4vw,36px)" }}>{p.title}</h1>
          <span className="meta num">{p.rating ? <><Ic name="Star" size={15} />{p.rating} מתוך 5 · {p.orders.toLocaleString("he-IL")} הזמנות</> : soldText(p.orders)}</span>
          <div className="vs num">
            {saveStore(p) > 0 && <><div><small>{p.store ? "בחנות בישראל (הערכה)" : "לפני ההנחה"}</small><s>{ils(wasPrice(p))}</s></div>
            <Ic name="ArrowLeft" size={20} /></>}
            <div className="vs-ali"><small>אצלנו ב-AliExpress</small><b>{ils(p.price)}</b></div>
            {saveStore(p) > 0 && <span className="chip chip-good">חוסכים {ils(Math.round((wasPrice(p) - p.price) * 100) / 100)}</span>}
          </div>
          {p.coupon && <div className="coupon">קופון <b dir="ltr">{p.coupon}</b> מוריד עוד כמה שקלים בקופה</div>}
          {p.desc && <p style={{ margin: 0 }}>{p.desc}</p>}
          {p.pros.length > 0 && <div className="pc">
            <div><b style={{ color: "var(--good)" }}>מה טוב</b><ul>{p.pros.map((x) => <li key={x}>{x}</li>)}</ul></div>
            <div><b style={{ color: "var(--price)" }}>שימו לב</b><ul>{p.cons.map((x) => <li key={x}>{x}</li>)}</ul></div>
          </div>}
          <button className="btn btn-gold btn-lg" onClick={() => buy(p, from)}>לקנייה ב-AliExpress<Ic name="ExternalLink" size={18} /></button>
          <span className="disclose">חיפשנו והשווינו עבורכם: זה המחיר הכי משתלם שמצאנו למוצר, ישירות מ-AliExpress.</span>
        </div>
      </div>
      {similar.length > 0 && <section className="section" style={{ marginTop: 0 }}><div className="section-head"><h2>{cat ? `עוד ב${cat.name}` : "עוד מוצרים דומים"}</h2></div><Grid items={similar} open={open} from={from} /></section>}
    </div>
  );
}

/* ---------- scan (photo → cheaper) ---------- */
// best value among the items that really sell (at least a third of the top seller's orders), otherwise the top seller
const bestOf = (items: ScanItem[]) => {
  if (!items.length) return null;
  const top = Math.max(...items.map((x) => x.sold));
  const proven = items.filter((x) => x.sold >= Math.max(3, top / 3));
  return (proven.length ? proven : items).reduce((a, b) => (b.price < a.price ? b : a));
};
// our hand-picked products lead the results for their product type
const CURATED: Record<string, string[]> = {
  earbuds: ["p1"], charger: ["p2"], smartwatch: ["p3"], "power-bank": ["p4"], "dash-cam": ["p5"], "tire-inflator": ["p6"],
  "car-phone-holder": ["p7"], "car-vacuum": ["p8"], drill: ["p9"], "laser-measure": ["p10"], "socket-set": ["p11"],
  "food-containers": ["p12"], "spice-rack": ["p13"], "milk-frother": ["p14"], "sensor-light": ["p15"], headlamp: ["p16"],
  cooler: ["p17"], hammock: ["p18"], thermos: ["p19"], drone: ["p20"],
};
const curatedFor = (id: string): ScanItem[] => (CURATED[id] || []).map(byId).map((p) => ({
  ali: p.ali, title: p.title, price: p.price, off: Math.round((1 - p.price / p.orig) * 100), sold: p.orders, soldAll: p.orders, star: p.rating, img: p.img, link: productLink(p.ali),
}));
const soldText = (n: number) => (n >= 1000 ? `${Math.floor(n / 1000).toLocaleString("he-IL")} אלף+ הזמנות החודש` : n ? `${n.toLocaleString("he-IL")} הזמנות החודש` : "מוצר חדש");
const metaText = (it: ScanItem) => (it.soldAll ? `${it.star} · ${it.soldAll.toLocaleString("he-IL")}+ הזמנות` : (it.star ? `${it.star} · ` : "") + soldText(it.sold));

function ItemCard({ it, i }: { it: ScanItem; i: number }) {
  return (
    <a className="card rv in" style={{ "--d": `${(i % 4) * 70}ms` } as React.CSSProperties} href={it.link} target="_blank" rel="noopener noreferrer sponsored">
      <div className="thumb"><img src={it.img} alt="" loading="lazy" referrerPolicy="no-referrer" />{it.off >= 10 && <span className="off num">-{it.off}%</span>}</div>
      <div className="card-body">
        <span className="card-title">{it.title}</span>
        <span className="price-row num"><span className="price">{ils(it.price)}</span></span>
        <span className="meta num"><Ic name={it.star ? "Star" : "TrendingUp"} size={13} />{metaText(it)}</span>
      </div>
    </a>
  );
}

function Scan() {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<"idle" | "busy" | "done" | "bad" | "error">("idle");
  const [pic, setPic] = useState("");
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [chosen, setChosen] = useState<ScanLabel | null>(null);
  const [items, setItems] = useState<ScanItem[]>([]);
  const [store, setStore] = useState("");
  const [labels, setLabels] = useState<ScanLabel[]>([]);
  const [typed, setTyped] = useState("");
  const [typedMiss, setTypedMiss] = useState(false);

  // start downloading the recognizer as soon as the page opens, so it is ready by the time the photo is taken
  useEffect(() => {
    const off = onProgress(setPct);
    warmup().then(allLabels).then(setLabels).catch(() => setPct(-1));
    return off;
  }, []);
  useEffect(() => () => { if (pic.startsWith("blob:")) URL.revokeObjectURL(pic); }, [pic]);

  const choose = async (l: ScanLabel) => {
    setChosen(l); setStore(""); setTypedMiss(false);
    const own = curatedFor(l.id);
    setItems([...own, ...(await itemsFor(l.id)).filter((x) => !own.some((o) => o.ali === x.ali))]);
    setPhase("done");
  };
  const run = async (src: Blob | HTMLImageElement, url: string) => {
    setPic(url); setPhase("busy"); setChosen(null); setItems([]); setGuesses([]);
    try {
      const g = await recognize(src);
      setGuesses(g);
      const top = g.find((x) => x.label.cat !== "neg");
      if (!top || g[0].label.cat === "neg" || top.p < 0.15) setPhase("done");
      else await choose(top.label);
    } catch { setPhase("error"); }
  };
  const onFile = (f?: File) => {
    if (!f) return;
    if (!/^image\//.test(f.type) || f.size > 15 * 1024 * 1024) { setPic(""); setPhase("bad"); return; }
    run(f, URL.createObjectURL(f));
  };
  const sample = async () => {
    const im = new Image();
    im.src = byId("p5").img;
    await im.decode();
    run(im, im.src);
  };
  const reset = () => { setPhase("idle"); setPic(""); setStore(""); setChosen(null); setItems([]); setGuesses([]); setTyped(""); };
  const findTyped = (e: React.FormEvent) => {
    e.preventDefault();
    const t = typed.trim();
    if (!t) return;
    const hit = labels.find((l) => l.he === t) || labels.find((l) => l.he.includes(t) || t.includes(l.he)) || labels.find((l) => l.q.includes(t.toLowerCase()));
    if (hit) { if (phase === "idle" || phase === "bad") setPic(""); choose(hit); } else setTypedMiss(true);
  };

  const others = guesses.filter((g) => g.label.cat !== "neg" && g.label.id !== chosen?.id && g.p >= 0.03).slice(0, 3);
  const unsure = guesses.filter((g) => g.label.cat !== "neg").slice(0, 4);
  const best = bestOf(items);
  const rest = items.filter((x) => x !== best);
  const storeN = +store;
  const engine = pct < 0 ? "" : pct >= 100 ? "מנוע הזיהוי מוכן" : `מכינים את מנוע הזיהוי… ${pct}%`;

  const typedForm = (
    <form className="typed" onSubmit={findTyped}>
      <label htmlFor="typed" className="sr-only">מה צילמתם?</label>
      <input id="typed" list="scan-types" value={typed} placeholder="או כתבו מה צילמתם: עכבר, רמקול, שמלה..." onChange={(e) => { setTyped(e.target.value); setTypedMiss(false); }} />
      <datalist id="scan-types">{labels.map((l) => <option key={l.id} value={l.he} />)}</datalist>
      <button className="btn btn-line" type="submit">חיפוש</button>
      {typedMiss && <p role="alert" className="disclose" style={{ margin: 0, width: "100%" }}>לא מצאנו את זה ברשימה. נסו מילה אחרת, למשל "אוזניות" או "מברגה".</p>}
    </form>
  );

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="page-title"><span className="eyebrow gold-ink">צלם ומצא</span><h1>ראיתם בחנות? צלמו, ונמצא לכם בזול.</h1><p>מצלמים את המוצר, המערכת מזהה מה זה, ומיד מקבלים את אותו מוצר ב-AliExpress עם המחיר הכי משתלם שמצאנו.</p></div>
      <div className="panel scan-panel">
        {phase === "idle" || phase === "bad" ? (
          <div className="drop">
            <span className="drop-ring"><Ic name="Camera" size={40} /></span>
            <div className="drop-btns">
              <input id="cam" type="file" accept="image/*" capture="environment" className="sr-only" aria-describedby="scan-privacy" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
              <label className="btn btn-gold btn-lg" htmlFor="cam"><Ic name="Camera" size={20} />צילום עכשיו</label>
              <input id="file" type="file" accept="image/*" className="sr-only" aria-describedby="scan-privacy" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
              <label className="btn btn-line" htmlFor="file"><Ic name="Upload" size={18} />מהגלריה</label>
            </div>
            <button className="link" onClick={sample}>או נסו עם תמונה לדוגמה (מצלמת דרך)</button>
            {engine && <span className="engine num" role="status"><i style={{ "--p": `${Math.max(pct, 0)}%` } as React.CSSProperties} />{engine}</span>}
            {typedForm}
            <span className="disclose" id="scan-privacy">הזיהוי נעשה בתוך המכשיר שלכם, והתמונה לא נשלחת לשום מקום. בכניסה הראשונה נטען מנוע זיהוי של כ-27MB, ואחר כך הוא שמור במכשיר. <a href="privacy.html">מדיניות פרטיות</a></span>
            {phase === "bad" && <p role="alert" style={{ color: "var(--price)", margin: 0 }}>אפשר להעלות רק קובץ תמונה עד 15MB. נסו תמונה אחרת.</p>}
          </div>
        ) : (
          <div className={pic ? "scan-result" : "found"}>
            {pic && (
              <div className={`scan-shot ${phase === "busy" ? "busy" : ""}`}>
                <img src={pic} alt="התמונה שצילמתם" />
                {phase === "busy" && <><span className="scanline" aria-hidden="true" /><span className="corner c1" /><span className="corner c2" /><span className="corner c3" /><span className="corner c4" /></>}
              </div>
            )}
            {phase === "busy" && <p className="meta scan-status" role="status"><Ic name="Sparkles" size={18} />{pct < 100 ? `טוענים את מנוע הזיהוי (${Math.max(pct, 0)}%)...` : "מזהים את המוצר ומחפשים את המחיר הכי משתלם..."}</p>}
            {phase === "error" && (
              <div className="found" role="status">
                <h2>לא הצלחנו להפעיל את הזיהוי בדפדפן הזה</h2>
                <p style={{ margin: 0 }}>אפשר לכתוב מה צילמתם, ונמצא לכם את המחיר.</p>
                {typedForm}
                <button className="btn btn-line" onClick={reset}>חזרה</button>
              </div>
            )}
            {phase === "done" && !chosen && (
              <div className="found" role="status">
                <h2>לא בטוחים מה צילמתם</h2>
                <p style={{ margin: 0 }}>{unsure.length ? "זה אחד מאלה?" : "נסו לצלם מקרוב, כשהמוצר ממלא את רוב התמונה."}</p>
                {unsure.length > 0 && <div className="alts">{unsure.map((g) => <button key={g.label.id} className="chip chip-btn" onClick={() => choose(g.label)}>{g.label.he}</button>)}</div>}
                {typedForm}
                <button className="btn btn-line" onClick={reset}>לצלם שוב</button>
              </div>
            )}
            {phase === "done" && chosen && (
              <div className="found" role="status">
                <span className="chip chip-good">זיהינו: {chosen.he}</span>
                {others.length > 0 && <div className="alts"><span>לא זה? אולי:</span>{others.map((g) => <button key={g.label.id} className="chip chip-btn" onClick={() => choose(g.label)}>{g.label.he}</button>)}</div>}
                {best ? (
                  <>
                    <a className="scan-best" href={best.link} target="_blank" rel="noopener noreferrer sponsored">
                      <img src={best.img} alt="" referrerPolicy="no-referrer" />
                      <span>{best.title}<small className="meta num"><Ic name={best.star ? "Star" : "TrendingUp"} size={13} />{metaText(best)}</small></span>
                    </a>
                    <div className="field" style={{ maxWidth: 280 }}>
                      <label htmlFor="sp">כמה זה עלה בחנות? נחשב כמה חוסכים</label>
                      <input id="sp" inputMode="numeric" value={store} placeholder="מחיר בחנות בשקלים" onChange={(e) => setStore(e.target.value.replace(/\D/g, ""))} />
                    </div>
                    <div className="vs num">
                      {storeN > 0 && <><div><small>בחנות</small><s>{ils(storeN)}</s></div><Ic name="ArrowLeft" size={20} /></>}
                      <div className="vs-ali"><small>ב-AliExpress, משלוח עד הבית</small><b>{ils(best.price)}</b></div>
                    </div>
                    {storeN > best.price && <div className="save-big num">חוסכים {ils(Math.round(storeN - best.price))}<small>{Math.round((1 - best.price / storeN) * 100)}% פחות מהחנות</small></div>}
                    <div className="hero-cta">
                      <a className="btn btn-gold btn-lg" href={best.link} target="_blank" rel="noopener noreferrer sponsored">לקנייה במחיר הזה<Ic name="ExternalLink" size={18} /></a>
                      <button className="btn btn-line" onClick={reset}>לצלם מוצר אחר</button>
                    </div>
                    <span className="disclose">חיפשנו והשווינו עבורכם: זה המחיר הכי משתלם שמצאנו ל{chosen.he}, ישירות מ-AliExpress.</span>
                    <a className="link" href={searchLink(chosen.q)} target="_blank" rel="noopener noreferrer sponsored">עוד דגמים של {chosen.he} ב-AliExpress<Ic name="ArrowUpLeft" size={16} /></a>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0 }}>ריכזנו לכם את ה{chosen.he} הנמכרים ביותר ב-AliExpress, מסודרים לפי כמות הזמנות.</p>
                    <div className="hero-cta">
                      <a className="btn btn-gold btn-lg" href={searchLink(chosen.q)} target="_blank" rel="noopener noreferrer sponsored">למחירים ב-AliExpress<Ic name="ExternalLink" size={18} /></a>
                      <button className="btn btn-line" onClick={reset}>לצלם מוצר אחר</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {phase === "done" && chosen && rest.length > 0 && (
        <section className="section" style={{ marginTop: 0 }}>
          <div className="section-head"><h2>עוד אפשרויות ל{chosen.he}</h2></div>
          <div className="grid">{rest.map((it, i) => <ItemCard key={it.ali} it={it} i={i} />)}</div>
        </section>
      )}
    </div>
  );
}

/* ---------- gift finder ---------- */
const GIFT_COUNT = 12;
const ROMANTIC = new Set(["watch", "smartwatch", "necklace", "bracelet", "ring", "earrings", "perfume-bottle", "handbag", "wallet", "sunglasses", "massage-gun"]);
// always within the budget; prefers gifts that suit the recipient and their interests, one per product type so the
// ideas differ, and widens the search (interests, then recipient) until there are enough ideas
function giftIdeas(products: Product[], who: string, likes: string[], budget: number, occ: string) {
  const affordable = products.filter((p) => p.price <= budget && p.recipients.length > 0);
  const score = (p: Product) => (likes.includes(p.cat) ? 4 : 0) + (occ === "יום נישואין" && p.type && ROMANTIC.has(p.type) ? 3 : 0)
    + (p.price >= budget * 0.2 ? 2 : 0) + (p.store ? 1 : 0) + Math.log10(1 + p.orders) / 2;
  const picked: Product[] = [];
  const seen = new Set<string>();
  for (const pool of [
    affordable.filter((p) => p.recipients.includes(who) && (!likes.length || likes.includes(p.cat))),
    affordable.filter((p) => p.recipients.includes(who)),
    affordable,
  ]) {
    for (const p of [...pool].sort((a, b) => score(b) - score(a))) {
      if (picked.length >= GIFT_COUNT) return picked;
      const k = p.type || p.id;
      if (!seen.has(k)) { seen.add(k); picked.push(p); }
    }
  }
  return picked;
}

function GiftFinder({ open, products }: { open: (p: Product, f: string) => void; products: Product[] }) {
  const [step, setStep] = useState(0);
  const [who, setWho] = useState(""); const [likes, setLikes] = useState<string[]>([]); const [budget, setBudget] = useState(0); const [occ, setOcc] = useState("");
  const results = useMemo(() => giftIdeas(products, who, likes, budget, occ), [products, budget, likes, who, occ]);
  const qs = [
    { t: "למי המתנה?", body: <div className="options">{RECIPIENTS.map((r) => <button key={r.id} className="opt" aria-pressed={who === r.id} onClick={() => { setWho(r.id); setStep(1); }}>{r.label}</button>)}</div> },
    { t: "במה הוא או היא מתעניינים? (אפשר כמה)", body: <><div className="options">{INTERESTS.map((r) => <button key={r.id} className="opt" aria-pressed={likes.includes(r.id)} onClick={() => setLikes(likes.includes(r.id) ? likes.filter((x) => x !== r.id) : [...likes, r.id])}>{r.label}</button>)}</div><button className="btn btn-gold" style={{ justifySelf: "start" }} onClick={() => setStep(2)}>המשך</button></> },
    { t: "מה התקציב?", body: <div className="options">{BUDGETS.map((b) => <button key={b} className="opt num" aria-pressed={budget === b} onClick={() => { setBudget(b); setStep(3); }}>עד {ils(b)}</button>)}</div> },
    { t: "לאיזה אירוע?", body: <div className="options">{["יום הולדת", "יום נישואין", "חג", "סתם כי בא לי"].map((o) => <button key={o} className="opt" aria-pressed={occ === o} onClick={() => { setOcc(o); setStep(4); }}>{o}</button>)}</div> },
  ];
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="page-title"><span className="eyebrow gold-ink">מוצא מתנות</span><h1>4 שאלות, ויש לכם מתנה</h1><p>עונים מהר, מקבלים {GIFT_COUNT} רעיונות בתקציב שבחרתם, עם מחיר וקישור לקנייה. אפשר לחזור אחורה בכל שלב.</p></div>
      <div className="panel">
        <div className="steps" aria-hidden="true">{[0, 1, 2, 3].map((i) => <i key={i} className={i <= step ? "on" : ""} />)}</div>
        {step < 4 ? (
          <div key={step} className="step-in" style={{ display: "grid", gap: 16 }}><h2 style={{ margin: 0, fontSize: 26 }}>{qs[step].t}</h2>{qs[step].body}
            {step > 0 && <button className="link" onClick={() => setStep(step - 1)}><Ic name="ChevronRight" size={16} />חזרה</button>}</div>
        ) : (
          <>
            <div className="section-head"><h2 style={{ margin: 0, fontSize: 24 }}>{results.length} רעיונות ל{RECIPIENTS.find((r) => r.id === who)?.label}, עד {ils(budget)}, ל{occ}</h2>
              <button className="link" onClick={() => { setStep(0); setLikes([]); }}>להתחיל מחדש</button></div>
            <Grid items={results} open={open} from="מוצא מתנות" />
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- admin ---------- */
function Admin({ products, setProducts, setToast }: { products: Product[]; setProducts: (p: Product[]) => void; setToast: (s: string) => void }) {
  const [f, setF] = useState({ link: "", title: "", price: "", store: "", cat: "gadgets" as CatId });
  const max = Math.max(...MODULE_STATS.map((m) => m.earn));
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.link || !f.title || !f.price) { setToast("צריך לינק, שם ומחיר כדי להוסיף מוצר"); return; }
    const price = +f.price;
    setProducts([{ id: "n" + Date.now(), ali: "", title: f.title, cat: f.cat, price, orig: Math.round(price * 1.8), store: +f.store || Math.round(price * 3), rating: 4.5, orders: 0, img: img(CATEGORIES.find((c) => c.id === f.cat)!.cover), desc: "תיאור בעברית ייכתב אוטומטית.", pros: ["ייכתב אוטומטית"], cons: ["ייכתב אוטומטית"], recipients: [] }, ...products]);
    setF({ link: "", title: "", price: "", store: "", cat: f.cat });
    setToast("המוצר נוסף לקטגוריה");
  };
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="page-title"><span className="eyebrow">ממשק ניהול · נתוני דוגמה</span><h1>מי מכניס כסף החודש</h1><p>כל מודול עובד עם Tracking ID משלו, כך שרואים בדיוק מאיפה מגיעות ההזמנות.</p></div>
      <div className="panel">
        <div className="bars">
          {MODULE_STATS.map((m) => (
            <div key={m.id} className="bar-row num"><span>{m.label}</span><span className="bar"><i style={{ width: `${(m.earn / max) * 100}%` }} /></span><b>{ils(m.earn)}</b></div>
          ))}
        </div>
        <div className="table-wrap"><table className="num"><thead><tr><th>מודול</th><th>לחיצות</th><th>הזמנות</th><th>המרה</th><th>עמלה</th></tr></thead>
          <tbody>{MODULE_STATS.map((m) => <tr key={m.id}><td>{m.label}</td><td>{m.clicks.toLocaleString("he-IL")}</td><td>{m.orders}</td><td>{((m.orders / m.clicks) * 100).toFixed(1)}%</td><td>{ils(m.earn)}</td></tr>)}</tbody></table></div>
      </div>
      <form className="panel" onSubmit={add}>
        <h2 style={{ margin: 0, fontSize: 22 }}>הוספת מוצר מלינק Portals</h2>
        <div className="form-grid">
          <div className="field"><label htmlFor="a-link">לינק אפיליאט</label><input id="a-link" dir="ltr" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="https://s.click.aliexpress.com/e/..." /></div>
          <div className="field"><label htmlFor="a-title">שם המוצר</label><input id="a-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div className="field"><label htmlFor="a-price">מחיר באלי (₪)</label><input id="a-price" inputMode="numeric" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value.replace(/\D/g, "") })} /></div>
          <div className="field"><label htmlFor="a-store">מחיר בחנות בישראל (₪)</label><input id="a-store" inputMode="numeric" value={f.store} onChange={(e) => setF({ ...f, store: e.target.value.replace(/\D/g, "") })} /></div>
          <div className="field"><label htmlFor="a-cat">קטגוריה</label><select id="a-cat" value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value as CatId })}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        </div>
        <button className="btn btn-gold" type="submit" style={{ justifySelf: "start" }}><Ic name="Plus" size={18} />הוספה לאתר</button>
        <span className="disclose">בגרסה האמיתית: התמונה המקורית, הכותרת והתיאור נמשכים אוטומטית מהלינק, ואתה מאשר לפני פרסום.</span>
      </form>
    </div>
  );
}

