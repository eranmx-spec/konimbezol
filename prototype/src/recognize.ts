// On-device product recognition for "צלם ומצא".
// A MobileCLIP-S0 image encoder (ONNX, fp16 weights) runs in the browser with onnxruntime-web and is
// compared against precomputed text embeddings of every product type. The photo never leaves the device.

export type ScanLabel = { id: string; he: string; q: string; cat: string };
// sold: orders in the last 30 days (from Portals); soldAll: all-time orders, for our hand-picked products
export type ScanItem = { ali: string; title: string; price: number; off: number; sold: number; soldAll?: number; star: number; img: string; link: string };
export type Guess = { label: ScanLabel; p: number };

const ASSETS = "scan/";
const CACHE = "konim-scan-v1";
const MODEL = "mobileclip_s0_vision_fp16.onnx";
const MODEL_BYTES = 22876479;
const SIZE = 256;

type Engine = { ort: any; session: any; labels: ScanLabel[]; emb: Float32Array; dim: number; catalog: Record<string, ScanItem[]> };
let engine: Promise<Engine> | null = null;
const listeners = new Set<(pct: number) => void>();
let progress = 0;
const report = (pct: number) => { progress = pct; listeners.forEach((f) => f(pct)); };

export function onProgress(f: (pct: number) => void) {
  listeners.add(f); f(progress);
  return () => { listeners.delete(f); };
}

// large files are kept in Cache Storage so a second visit starts instantly
async function fetchBig(name: string, onBytes?: (n: number) => void): Promise<ArrayBuffer> {
  const url = ASSETS + name;
  let cache: Cache | null = null;
  try { cache = await caches.open(CACHE); const hit = await cache.match(url); if (hit) return hit.arrayBuffer(); } catch { cache = null; }
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`load ${name}: ${res.status}`);
  const reader = res.body.getReader();
  const parts: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value); got += value.length; onBytes?.(got);
  }
  const buf = new Uint8Array(got);
  let at = 0;
  for (const p of parts) { buf.set(p, at); at += p.length; }
  try { await cache?.put(url, new Response(buf.slice().buffer, { headers: { "Content-Type": "application/octet-stream" } })); } catch { /* quota or private mode */ }
  return buf.buffer;
}

export function warmup(): Promise<Engine> {
  if (engine) return engine;
  engine = (async () => {
    report(1);
    const [labels, catalog, embBuf] = await Promise.all([
      fetch(ASSETS + "labels.json").then((r) => r.json()) as Promise<ScanLabel[]>,
      fetch(ASSETS + "catalog.json").then((r) => r.json()) as Promise<Record<string, ScanItem[]>>,
      fetch(ASSETS + "labels.bin").then((r) => r.arrayBuffer()),
    ]);
    let wasmGot = 0, modelGot = 0;
    const WASM_BYTES = 14264838;
    const tick = () => report(Math.min(99, Math.round(((wasmGot + modelGot) / (WASM_BYTES + MODEL_BYTES)) * 98) + 1));
    const [ort, wasm, model] = await Promise.all([
      import(/* @vite-ignore */ new URL(ASSETS + "ort.wasm.bundle.min.mjs", document.baseURI).href),
      fetchBig("ort-wasm-simd-threaded.wasm", (n) => { wasmGot = n; tick(); }),
      fetchBig(MODEL, (n) => { modelGot = n; tick(); }),
    ]);
    ort.env.wasm.wasmBinary = wasm;
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
    const session = await ort.InferenceSession.create(new Uint8Array(model), { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
    const emb = new Float32Array(embBuf);
    report(100);
    return { ort, session, labels, emb, dim: emb.length / labels.length, catalog };
  })();
  engine.catch(() => { engine = null; report(0); });
  return engine;
}

// resize the short side to 256 and center-crop, like the model's own preprocessing
async function pixels(img: Blob | HTMLImageElement): Promise<Float32Array> {
  const src: CanvasImageSource = img instanceof Blob ? await createImageBitmap(img, { imageOrientation: "from-image" } as ImageBitmapOptions) : img;
  const w0 = (src as ImageBitmap).width || (img as HTMLImageElement).naturalWidth;
  const h0 = (src as ImageBitmap).height || (img as HTMLImageElement).naturalHeight;
  const k = SIZE / Math.min(w0, h0);
  const w = Math.round(w0 * k), h = Math.round(h0 * k);
  const c = document.createElement("canvas");
  c.width = SIZE; c.height = SIZE;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
  const n = SIZE * SIZE, out = new Float32Array(3 * n);
  for (let i = 0; i < n; i++) {
    out[i] = data[i * 4] / 255;
    out[i + n] = data[i * 4 + 1] / 255;
    out[i + 2 * n] = data[i * 4 + 2] / 255;
  }
  if ("close" in src) (src as ImageBitmap).close();
  return out;
}

export async function recognize(img: Blob | HTMLImageElement): Promise<Guess[]> {
  const e = await warmup();
  const input = new e.ort.Tensor("float32", await pixels(img), [1, 3, SIZE, SIZE]);
  const out = await e.session.run({ pixel_values: input });
  const v = out.image_embeds.data as Float32Array;
  let nv = 0;
  for (let k = 0; k < v.length; k++) nv += v[k] * v[k];
  nv = Math.sqrt(nv);
  const scores = e.labels.map((_, i) => {
    let s = 0;
    for (let k = 0; k < e.dim; k++) s += e.emb[i * e.dim + k] * v[k];
    return (s / nv) * 100;
  });
  const max = Math.max(...scores);
  const ex = scores.map((s) => Math.exp(s - max));
  const sum = ex.reduce((a, b) => a + b, 0);
  return e.labels.map((label, i) => ({ label, p: ex[i] / sum })).sort((a, b) => b.p - a.p);
}

export async function itemsFor(id: string): Promise<ScanItem[]> {
  return (await warmup()).catalog[id] || [];
}

export async function allLabels(): Promise<ScanLabel[]> {
  return (await warmup()).labels.filter((l) => l.cat !== "neg");
}
