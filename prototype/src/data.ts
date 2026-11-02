export type CatId = "gadgets" | "car" | "tools" | "home" | "trips";

export type Product = {
  id: string;
  ali: string; // AliExpress item id
  title: string;
  cat: CatId;
  price: number;
  orig: number;
  store: number; // typical Israeli store price (demo estimate)
  rating: number;
  orders: number;
  img: string;
  desc: string;
  pros: string[];
  cons: string[];
  coupon?: string;
  recipients: string[];
};

// real product photos pulled from AliExpress listings, inlined at build time
const IMGS = import.meta.glob("./img/*.webp", { eager: true, import: "default" }) as Record<string, string>;
export const img = (id: string) => IMGS[`./img/${id}.webp`] || "";

export const CATEGORIES: { id: CatId; name: string; short: string; cover: string; line: string; subs: string[] }[] = [
  { id: "gadgets", name: "גאדג'טים", short: "גאדג'טים", cover: "p1", line: "אוזניות, מטענים, שעונים", subs: ["טלפון ואביזרים", "בית חכם", "אודיו", "מחשב"] },
  { id: "car", name: "רכב ונהיגה", short: "רכב", cover: "p5", line: "מצלמות דרך, קומפרסורים", subs: ["מצלמות דרך", "קומפרסורים", "מטענים ומחזיקים", "ניקוי וטיפוח"] },
  { id: "tools", name: "כלי עבודה", short: "כלי עבודה", cover: "p9", line: "מברגות, מדידה, סטים", subs: ["כלים חשמליים", "כלי יד", "מדידה", "בטיחות"] },
  { id: "home", name: "בית ומטבח", short: "בית ומטבח", cover: "p13", line: "ארגון, אחסון, תאורה", subs: ["אחסון", "גאדג'טים למטבח", "ניקיון", "תאורה"] },
  { id: "trips", name: "טיולים וקמפינג", short: "טיולים", cover: "p18", line: "פנסי ראש, צידניות, ערסלים", subs: ["פנסי ראש", "צידניות", "ציוד שטח", "שתייה"] },
];

const P = (p: Omit<Product, "img">): Product => ({ ...p, img: img(p.id) });

export const PRODUCTS: Product[] = [
  P({ id: "p1", ali: "1005008870372901", title: "אוזניות Baseus EP10 Pro עם סינון רעשים ANC", cat: "gadgets", price: 49, orig: 99, store: 249, rating: 4.8, orders: 20000,
    desc: "סינון רעשים עד 50dB, Bluetooth 6.0, שישה מיקרופונים לשיחות ועמידות במים IP55.", pros: ["סינון רעשים שמורגש באוטובוס", "שיחות ברורות"], cons: ["האפליקציה באנגלית בלבד"], coupon: "IL12", recipients: ["man", "woman", "teen"] }),
  P({ id: "p2", ali: "1005005925834800", title: "מטען Baseus GaN מהיר 65W", cat: "gadgets", price: 59, orig: 164, store: 199, rating: 4.8, orders: 9000,
    desc: "מטען אחד לטלפון, לטאבלט ולמחשב הנייד. קטן כמו מטען רגיל של טלפון.", pros: ["טוען מחשב נייד", "קטן ולא מתחמם"], cons: ["תקע אירופאי, צריך מתאם"], recipients: ["man", "woman", "teen"] }),
  P({ id: "p3", ali: "1005007323636916", title: "שעון חכם AMOLED עם GPS ושיחות", cat: "gadgets", price: 94, orig: 189, store: 399, rating: 4.8, orders: 820,
    desc: "מסך AMOLED תמידי, שיחות Bluetooth, GPS ועמידות במים IP68.", pros: ["מסך חד", "מראה יוקרתי"], cons: ["אין תשלום אלחוטי בישראל"], coupon: "IL15", recipients: ["man", "woman", "senior"] }),
  P({ id: "p4", ali: "1005009127238944", title: "סוללת גיבוי מגנטית 10,000mAh, 3 ב-1", cat: "gadgets", price: 69, orig: 139, store: 229, rating: 4.7, orders: 10000,
    desc: "נצמדת לגב האייפון וטוענת גם שעון ואוזניות. טעינה מהירה בלי כבל.", pros: ["דקה ונוחה", "טוענת 3 מכשירים"], cons: ["טעינה אלחוטית איטית יותר"], recipients: ["woman", "teen"] }),
  P({ id: "p5", ali: "1005007523418871", title: "מצלמת דרך 70mai T800E 4K, שלושה ערוצים", cat: "car", price: 249, orig: 449, store: 899, rating: 4.8, orders: 3000,
    desc: "קדמית 4K, אחורית ופנימית 1080p, HDR, ראיית לילה ומצב חניה.", pros: ["תמונה חדה בלילה", "מותג מוכר"], cons: ["כרטיס זיכרון לא כלול"], coupon: "IL20", recipients: ["man"] }),
  P({ id: "p6", ali: "1005007274254758", title: "משאבת ניפוח TOPUMP אלחוטית עם מסך", cat: "car", price: 71, orig: 231, store: 249, rating: 4.8, orders: 20000,
    desc: "קובעים לחץ והיא עוצרת לבד. טעינת USB-C, לאופניים, לרכב ולכדורים.", pros: ["עוצרת אוטומטית בלחץ שנקבע", "קטנה כמו פחית"], cons: ["לרכב: איטית יותר מקומפרסור גדול"], recipients: ["man", "senior"] }),
  P({ id: "p7", ali: "1005009220871500", title: "מחזיק טלפון מגנטי Joyroom עם טעינה אלחוטית", cat: "car", price: 25, orig: 46, store: 129, rating: 4.7, orders: 1000,
    desc: "נצמד ללוח המחוונים או לפתח המיזוג וטוען את הטלפון תוך כדי נסיעה.", pros: ["טוען תוך כדי", "יציב בבורות"], cons: ["דורש טלפון תואם MagSafe"], recipients: ["man", "woman"] }),
  P({ id: "p8", ali: "1005007655832814", title: "שואב אבק נטען SZUK לרכב ולבית", cat: "car", price: 49, orig: 274, store: 199, rating: 4.7, orders: 5000,
    desc: "שואב קטן ונטען עם יניקה חזקה וראשים לפינות ולמושבים.", pros: ["יניקה חזקה לגודל", "פילטר רחיץ"], cons: ["מיכל קטן"], recipients: ["woman", "man"] }),
  P({ id: "p9", ali: "1005013051899569", title: "מברגה-מקדחה 20V עם 2 סוללות ומזוודה", cat: "tools", price: 66, orig: 79, store: 349, rating: 4.6, orders: 1200,
    desc: "סט מלא לעבודות הבית: מברגה עם פטיש, 2 סוללות, מטען וביטים.", pros: ["2 סוללות במחיר", "מזוודה מסודרת"], cons: ["מטען עם תקע אירופאי"], coupon: "IL20", recipients: ["man", "senior"] }),
  P({ id: "p10", ali: "1005010607742473", title: "מד מרחק לייזר Bosch GLM 40 מטר", cat: "tools", price: 126, orig: 265, store: 399, rating: 4.8, orders: 431,
    desc: "מודד חדר בשנייה, מחשב שטח ונפח. דיוק גבוה של בוש.", pros: ["מדויק עד 2 מ\"מ", "מותג מקצועי"], cons: ["קשה לקרוא בשמש חזקה"], recipients: ["man"] }),
  P({ id: "p11", ali: "1005009918638131", title: "סט בוקסות וראצ'ט 46 חלקים", cat: "tools", price: 39, orig: 79, store: 189, rating: 4.5, orders: 70000,
    desc: "סט בסיסי לכל בית ורכב: ראשים, בוקסות וידית ראצ'ט במזוודה.", pros: ["איכות טובה למחיר", "מזוודה מסודרת"], cons: ["לא לעבודה מקצועית"], recipients: ["man", "teen"] }),
  P({ id: "p12", ali: "1005011729427903", title: "סט קופסאות ואקום למטבח עם משאבה", cat: "home", price: 24, orig: 56, store: 149, rating: 4.4, orders: 500,
    desc: "קופסאות עם משאבת ואקום ידנית. שומרות אוכל טרי יותר זמן.", pros: ["חוסך זריקת אוכל", "נערמות אחת על השנייה"], cons: ["לא למיקרוגל"], coupon: "IL10", recipients: ["woman", "senior"] }),
  P({ id: "p13", ali: "1005005893804104", title: "מתקן תבלינים מסתובב, 6 צנצנות זכוכית", cat: "home", price: 27, orig: 150, store: 119, rating: 4.4, orders: 730,
    desc: "כל התבלינים במקום אחד על השיש, עם צנצנות זכוכית ומכסי פיזור.", pros: ["חוסך מקום", "נראה מעולה על השיש"], cons: ["רק 6 צנצנות"], recipients: ["woman"] }),
  P({ id: "p14", ali: "1005008097331648", title: "מקציף חלב חשמלי לקפוצ'ינו", cat: "home", price: 19, orig: 39, store: 79, rating: 4.7, orders: 6000,
    desc: "קצף לקפה תוך 15 שניות, עם ראש כפול ומעמד.", pros: ["מתנה קטנה ושימושית", "זול"], cons: ["לא לכמויות גדולות"], recipients: ["woman", "senior", "man"] }),
  P({ id: "p15", ali: "1005005801597388", title: "מנורות LED עם חיישן תנועה, סט 6", cat: "home", price: 29, orig: 59, store: 139, rating: 4.6, orders: 10000,
    desc: "נדבקות במגנט ונדלקות כשעוברים. לארונות, מדרגות ומסדרון.", pros: ["התקנה בלי ברגים", "נטענות USB"], cons: ["אור חלש לחדר שלם"], recipients: ["woman", "senior"] }),
  P({ id: "p16", ali: "1005005274897729", title: "פנס ראש נטען 9 לדים עם חיישן תנועה", cat: "trips", price: 25, orig: 50, store: 129, rating: 4.8, orders: 10000,
    desc: "פנס ראש חזק עם הדלקה בתנועת יד, אור אדום ועמידות בגשם.", pros: ["חזק מאוד", "הדלקה בלי ידיים"], cons: ["כבד יותר מפנס פשוט"], coupon: "IL10", recipients: ["man", "teen", "kid"] }),
  P({ id: "p17", ali: "1005013362861897", title: "תיק-צידנית גב מבודד 30 ליטר", cat: "trips", price: 99, orig: 204, store: 299, rating: 5, orders: 78,
    desc: "צידנית רכה בצורת תרמיל, שומרת קור ולא דולפת. לחוף, לשטח ולפיקניק.", pros: ["נוח על הגב", "לא דולף"], cons: ["לא קשיחה"], recipients: ["man", "woman"] }),
  P({ id: "p18", ali: "1005012524116120", title: "ערסל שטח עם כילה וגגון", cat: "trips", price: 89, orig: 179, store: 349, rating: 4.9, orders: 68,
    desc: "ערסל עם כילה נגד יתושים, גגון לשמש ורצועות לעצים.", pros: ["מהיר לפריסה", "כולל גגון"], cons: ["הכילה עדינה"], recipients: ["teen", "man", "woman"] }),
  P({ id: "p19", ali: "1005005797820608", title: "בקבוק תרמי 1 ליטר עם ידית וקש", cat: "trips", price: 33, orig: 107, store: 149, rating: 4.8, orders: 109,
    desc: "שומר קר 24 שעות וחם 12 שעות. נירוסטה, פיה רחבה וידית נשיאה.", pros: ["לא מזיע", "מכסה קש"], cons: ["כבד כשהוא מלא"], recipients: ["kid", "teen", "woman", "man"] }),
  P({ id: "p20", ali: "1005012825227215", title: "רחפן מיני עם מצלמה כפולה ושלט עם מסך", cat: "gadgets", price: 94, orig: 189, store: 449, rating: 4.2, orders: 36,
    desc: "רחפן קטן עם מצלמה כפולה, ריחוף אוטומטי והתחמקות ממכשולים.", pros: ["קל להטסה", "שלט עם מסך"], cons: ["המצלמה לא באיכות מקצועית"], recipients: ["kid", "teen"] }),
];

export const RECIPIENTS = [
  { id: "man", label: "גבר" },
  { id: "woman", label: "אישה" },
  { id: "teen", label: "נער / נערה" },
  { id: "kid", label: "ילד / ילדה" },
  { id: "senior", label: "סבא / סבתא" },
];

export const INTERESTS: { id: CatId; label: string }[] = [
  { id: "gadgets", label: "טכנולוגיה וגאדג'טים" },
  { id: "car", label: "רכב ונהיגה" },
  { id: "tools", label: "עבודות בית ו-DIY" },
  { id: "home", label: "בישול ובית מסודר" },
  { id: "trips", label: "טיולים ושטח" },
];

export const BUDGETS = [50, 100, 200, 400];

export const MODULE_STATS = [
  { id: "scan", label: "צלם ומצא", clicks: 1480, orders: 61, earn: 702 },
  { id: "catalog", label: "קטלוג", clicks: 1240, orders: 38, earn: 412 },
  { id: "gift", label: "מוצא מתנות", clicks: 610, orders: 27, earn: 318 },
];
