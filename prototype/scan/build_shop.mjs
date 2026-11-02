// Builds src/shop.json: the catalog and gift-finder products beyond the hand-picked ones. One product per product
// type (the best value among the ones that really sell), with its affiliate link and who it suits as a gift.
// usage (from the project root, after build_scan.mjs): node scan/build_shop.mjs
import fs from 'node:fs';

const labels = JSON.parse(fs.readFileSync('scan/labels.json', 'utf8'));
const catalog = JSON.parse(fs.readFileSync('public/scan/catalog.json', 'utf8'));

// product types that make a poor gift (consumables, spare parts, plumbing, baby gear bought by parents)
const NO_GIFT = new Set(['cable', 'screen-protector', 'phone-case', 'mouse-pad', 'memory-card', 'flash-drive', 'remote', 'router',
  'sunshade', 'air-freshener', 'car-mats', 'seat-cover', 'drill-bits', 'work-gloves', 'utility-knife', 'garden-hose', 'trash-can',
  'hangers', 'laundry-basket', 'shower-head', 'faucet', 'bathroom-shelf', 'soap-dispenser', 'dish-rack', 'storage-box', 'shoe-rack',
  'water-filter', 'bug-zapper', 'mop', 'socks', 'stroller', 'baby-bottle', 'baby-monitor', 'pens', 'notebook', 'knee-brace',
  'bathroom-scale', 'litter-box', 'pet-carrier', 'curtains', 'rug', 'towel', 'bedding', 'smartphone', 'laptop', 'monitor', 'printer']);

// types whose candidates turned out to be only accessories for the product (rain covers, empty bottles)
const SKIP = new Set(['reverse-camera', 'perfume-bottle', 'air-freshener', 'walkie-talkie', 'kids-scooter', 'dish-rack']);

const ALL = ['man', 'woman', 'teen'];
const BY_CAT = {
  gadgets: ALL, car: ['man'], tools: ['man', 'senior'], home: ['woman', 'senior'], trips: ALL, fashion: ALL,
  beauty: ['woman', 'teen'], kids: ['kid'], sport: ALL, pets: ALL,
};
const BY_LABEL = {
  drone: ['kid', 'teen', 'man'], 'game-console': ['kid', 'teen', 'man'], gamepad: ['kid', 'teen', 'man'], 'walkie-talkie': ['kid', 'teen'],
  'power-strip': ['man'], 'usb-hub': ['man'], ssd: ['man', 'teen'], 'smart-plug': ['man'], 'tv-box': ['man', 'senior'],
  'vr-headset': ['teen', 'man'], 'action-camera': ['teen', 'man'], 'e-reader': ['woman', 'man', 'senior'], tablet: ['woman', 'man', 'senior', 'teen'],
  smartwatch: ['man', 'woman', 'senior', 'teen'], 'fitness-band': ['man', 'woman', 'senior', 'teen'], calculator: ['teen'],
  'car-phone-holder': ['man', 'woman'], 'car-vacuum': ['man', 'woman'], 'motorcycle-helmet': ['man', 'teen'],
  flashlight: ['man', 'senior', 'teen'], headlamp: ['man', 'teen', 'kid'],
  'coffee-maker': ['man', 'woman', 'senior'], 'coffee-grinder': ['man', 'woman', 'senior'], 'air-fryer': ['man', 'woman', 'senior'],
  kettle: ['man', 'woman', 'senior'], 'knife-set': ['man', 'woman'], 'smart-lock': ['man'], doorbell: ['man'], 'desk-lamp': ['man', 'woman', 'teen'],
  'night-light': ['kid', 'woman'], 'alarm-clock': ['teen', 'kid', 'senior'], mug: ['man', 'woman', 'senior', 'teen'], blanket: ['woman', 'senior'],
  'sewing-machine': ['woman', 'senior'], 'robot-vacuum': ['woman', 'man', 'senior'],
  'fishing-rod': ['man', 'senior'], binoculars: ['man', 'senior', 'kid'], 'bbq-grill': ['man'], scooter: ['teen', 'man'], 'bike-light': ['man', 'teen'],
  dress: ['woman'], blouse: ['woman'], skirt: ['woman'], leggings: ['woman'], heels: ['woman'], handbag: ['woman'], earrings: ['woman', 'teen'],
  necklace: ['woman', 'teen'], bracelet: ['woman', 'man', 'teen'], ring: ['woman', 'man'], scarf: ['woman', 'senior'], 'hair-accessories': ['woman', 'teen', 'kid'],
  swimsuit: ['woman', 'teen'], shirt: ['man'], 'dress-shoes': ['man'], belt: ['man'], wallet: ['man', 'woman'], watch: ['man', 'woman', 'senior'],
  cap: ['man', 'teen'], 'kids-clothes': ['kid'], pajamas: ['woman', 'man', 'kid', 'senior'], slippers: ['woman', 'man', 'senior'],
  shaver: ['man', 'senior'], trimmer: ['man', 'teen'], toothbrush: ['man', 'woman', 'senior'], 'water-flosser': ['man', 'woman', 'senior'],
  'massage-gun': ['man', 'woman', 'senior'],
  fidget: ['kid', 'teen'], 'school-bag': ['kid', 'teen'], 'pencil-case': ['kid', 'teen'], 'kids-scooter': ['kid'],
  bicycle: ['man', 'teen'], skateboard: ['teen', 'kid'], ball: ['kid', 'teen', 'man'], 'jump-rope': ['kid', 'teen', 'woman'],
};
// clothing titles usually say who they are for
const forTitle = (t, who) => (/גברים|לגבר|גבר /.test(t) && !/נשים|לנשים/.test(t) ? ['man', 'teen']
  : /נשים|לנשים|אישה/.test(t) && !/גברים/.test(t) ? ['woman', 'teen'] : /ילדים|ילדות|תינוק/.test(t) ? ['kid'] : who);

// the best seller among items priced like the product itself; the cheapest listings are often parts or accessories
const bestOf = (items) => {
  const ps = items.map((x) => x.price).sort((a, b) => a - b);
  const typical = items.filter((x) => x.price >= ps[Math.floor(ps.length / 2)] * 0.6);
  return typical.reduce((a, b) => (b.sold > a.sold || (b.sold === a.sold && b.price < a.price) ? b : a));
};

const shop = [];
for (const [id, he, , cat] of labels) {
  const items = catalog[id] || [];
  if (cat === 'neg' || !items.length || SKIP.has(id)) continue;
  const it = bestOf(items);
  if (!it.link.startsWith('https://s.click.aliexpress.com/')) throw new Error(`no affiliate link for ${id}`);
  let who = BY_LABEL[id] || BY_CAT[cat];
  if (['fashion', 'sport', 'kids'].includes(cat)) who = forTitle(it.title, who);
  shop.push({
    id: `s-${id}`, ali: it.ali, type: id, typeHe: he, cat, title: it.title, price: it.price,
    orig: it.off > 0 ? Math.round((it.price / (1 - it.off / 100)) * 100) / 100 : it.price,
    orders: it.sold, img: it.img, link: it.link, recipients: NO_GIFT.has(id) ? [] : who,
  });
}
fs.writeFileSync('src/shop.json', JSON.stringify(shop));
const per = shop.reduce((a, p) => ((a[p.cat] = (a[p.cat] || 0) + 1), a), {});
console.log(`shop products ${shop.length}, per category ${JSON.stringify(per)}, gift-eligible ${shop.filter((p) => p.recipients.length).length}`);
