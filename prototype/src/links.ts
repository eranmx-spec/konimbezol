// Every outbound AliExpress link must carry the affiliate tracking: the short links come from AliExpress Portals
// (scan/aff-links.json, item id -> s.click link). The plain item URL is only a fallback for items not linked yet.
import AFF from "../scan/aff-links.json";

const links = AFF as Record<string, string>;
export const productLink = (ali: string) => links[ali] || `https://he.aliexpress.com/item/${ali}.html`;
export const hasAffiliate = (ali: string) => Boolean(links[ali]);
// search results for a product type, keyed by its English search phrase
export const searchLink = (q: string) =>
  links[`q:${q}`] || `https://he.aliexpress.com/w/wholesale-${q.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html?SearchText=${encodeURIComponent(q)}&sortType=total_tranpro_desc`;
