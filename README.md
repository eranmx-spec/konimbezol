# קונים חכם

ראיתם מוצר בחנות? צלמו אותו, ונמצא לכם את אותו מוצר ב-AliExpress במחיר הכי משתלם.

האתר החי: https://konimbezol.online

## מבנה

- `site/` - הגרסה הבנויה שעולה לאוויר. כל דחיפה ל-main שמשנה את התיקייה הזאת מעלה אותה אוטומטית ל-GitHub Pages.
- `prototype/` - קוד המקור (React + Vite + Tailwind). בנייה: `npm install` ואז `npx vite build`, ואז מעתיקים את `dist/` ל-`site/`.
- `prototype/legal/` - יוצר את העמודים המשפטיים מתוך `site.json` (`py legal/build_legal.py`).
