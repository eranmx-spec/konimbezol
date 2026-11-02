# קונים חכם

ראיתם מוצר בחנות? צלמו אותו, ונמצא לכם את אותו מוצר ב-AliExpress במחיר הכי משתלם.

האתר החי: https://konimbezol.online

## מבנה

- `site/` - הגרסה הבנויה שעולה לאוויר. כל דחיפה ל-main שמשנה את התיקייה הזאת מעלה אותה אוטומטית ל-GitHub Pages.
- `prototype/` - קוד המקור (React + Vite + Tailwind). בנייה: `npm install` ואז `npx vite build`, ואז מעתיקים את `dist/` ל-`site/`.
- `prototype/legal/` - יוצר את העמודים המשפטיים מתוך `site.json` (`py legal/build_legal.py`).

## צלם ומצא - זיהוי מוצר בתוך המכשיר

- הזיהוי רץ בדפדפן של הגולש: מודל MobileCLIP-S0 (חלק התמונה, fp16) עם onnxruntime-web. התמונה לא יוצאת מהמכשיר.
- `prototype/scan/labels.json` - 262 סוגי מוצרים (שם בעברית, מילת חיפוש, קטגוריה) ועוד כמה תוויות "לא מוצר".
- `prototype/scan/catalog-raw.json` - לכל סוג מוצר, המוצרים הנמכרים ביותר מ-AliExpress Portals (תוכנית השותפים), אחרי סינון שמוודא שהתמונה באמת מראה את סוג המוצר.
- `prototype/scan/aff-links.json` - קישורי שותפים (s.click) לכל מוצר ולכל עמוד חיפוש. `node scan/build_scan.mjs <ml> --strict` נכשל אם יש מוצר בלי קישור שותפים.
- הקבצים הכבדים (המודל ו-onnxruntime) נמצאים רק ב-`site/scan`.
