// Assembles public/scan/: the on-device recognizer (onnxruntime-web + MobileCLIP-S0 vision, fp16),
// the product-type list with its text embeddings, and the price catalog with affiliate links.
// usage (from the project root): node scan/build_scan.mjs <ml dir> [--strict]
import fs from 'node:fs';
import path from 'node:path';

const ml = process.argv[2];
const strict = process.argv.includes('--strict');
const out = 'public/scan';
fs.mkdirSync(out, { recursive: true });

const ortDist = path.join(ml, 'node_modules/onnxruntime-web/dist');
for (const f of ['ort.wasm.bundle.min.mjs', 'ort-wasm-simd-threaded.wasm']) fs.copyFileSync(path.join(ortDist, f), path.join(out, f));
fs.copyFileSync(path.join(ml, 'models/Xenova/mobileclip_s0/onnx/vision_model_fp16.onnx'), path.join(out, 'mobileclip_s0_vision_fp16.onnx'));

const labels = JSON.parse(fs.readFileSync('scan/labels.json', 'utf8'));
const emb = fs.readFileSync(path.join(ml, 's0.bin'));
if (emb.length !== labels.length * 512 * 4) throw new Error(`labels.bin has ${emb.length / 2048} rows, labels.json has ${labels.length}: re-run ml/embed.mjs`);
fs.copyFileSync(path.join(ml, 's0.bin'), path.join(out, 'labels.bin'));
fs.writeFileSync(path.join(out, 'labels.json'), JSON.stringify(labels.map(([id, he, q, cat]) => ({ id, he, q, cat }))));

const raw = JSON.parse(fs.readFileSync('scan/catalog-raw.json', 'utf8'));
const aff = JSON.parse(fs.readFileSync('scan/aff-links.json', 'utf8'));
const catalog = {};
const missing = [];
for (const [id, items] of Object.entries(raw)) {
  catalog[id] = items.map((it) => {
    if (!aff[it.ali]) missing.push(it.ali);
    return { ...it, link: aff[it.ali] || `https://he.aliexpress.com/item/${it.ali}.html` };
  });
}
fs.writeFileSync(path.join(out, 'catalog.json'), JSON.stringify(catalog));

const covered = labels.filter((l) => l[3] !== 'neg' && (catalog[l[0]] || []).length).length;
const total = Object.values(catalog).reduce((a, b) => a + b.length, 0);
console.log(`labels ${labels.length}, with prices ${covered}, catalog items ${total}, without affiliate link ${missing.length}`);
if (strict && missing.length) { console.error('affiliate links missing for', missing.length, 'items'); process.exit(1); }
