/*!
 * כפתור נגישות - ווידג'ט עצמאי בעברית (RTL), ללא תלויות.
 * חשוב: הכפתור הוא תוספת לאתר שבנוי נגיש בקוד. הוא לא מחליף בנייה לפי ת"י 5568 / WCAG AA.
 *
 * שימוש - לפני </body>:
 *   <script src="accessibility-widget.js"
 *           data-statement-url="/accessibility.html"
 *           data-position="left"        (left | right, ברירת מחדל left)
 *           defer></script>
 */
(function () {
  'use strict';
  if (window.__a11yWidgetLoaded) return;
  window.__a11yWidgetLoaded = true;

  var script = document.currentScript || document.querySelector('script[src*="accessibility-widget"]');
  var statementUrl = (script && script.getAttribute('data-statement-url')) || '/accessibility.html';
  var side = (script && script.getAttribute('data-position')) === 'right' ? 'right' : 'left';
  var STORE = 'a11y-widget-v1';

  var state = { font: 0, contrast: false, invert: false, grayscale: false, links: false,
                readable: false, noanim: false, cursor: false, spacing: false, headings: false };

  function load() {
    try { var s = JSON.parse(localStorage.getItem(STORE) || '{}'); for (var k in s) if (k in state) state[k] = s[k]; } catch (e) {}
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} }

  var css = '' +
    '#a11y-btn{position:fixed;bottom:20px;' + side + ':20px;z-index:2147483646;width:56px;height:56px;border-radius:50%;' +
      'background:#0b57d0;color:#fff;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.35);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}' +
    '#a11y-btn:focus-visible,#a11y-panel button:focus-visible,#a11y-panel a:focus-visible{outline:3px solid #ffbf00;outline-offset:2px}' +
    '#a11y-btn svg{width:32px;height:32px;fill:currentColor}' +
    '#a11y-panel{position:fixed;bottom:86px;' + side + ':20px;z-index:2147483647;width:300px;max-width:calc(100vw - 32px);max-height:calc(100vh - 110px);overflow:auto;' +
      'background:#fff;color:#111;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.35);direction:rtl;text-align:right;font:16px/1.4 Arial,Helvetica,sans-serif;padding:16px}' +
    '#a11y-panel[hidden]{display:none}' +
    '#a11y-panel h2{font-size:18px;margin:0 0 12px;color:#111}' +
    '#a11y-panel .a11y-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
    '#a11y-panel button{font:inherit;font-size:14px;padding:10px 8px;border:2px solid #0b57d0;border-radius:8px;background:#fff;color:#0b57d0;cursor:pointer;min-height:44px}' +
    '#a11y-panel button[aria-pressed="true"]{background:#0b57d0;color:#fff}' +
    '#a11y-panel .a11y-full{grid-column:1/-1}' +
    '#a11y-panel a{display:block;margin-top:12px;color:#0b57d0;text-decoration:underline}' +
    'html.a11y-contrast body *:not(#a11y-panel):not(#a11y-panel *):not(#a11y-btn):not(#a11y-btn *){background-color:#000 !important;color:#ff0 !important;border-color:#ff0 !important}' +
    'html.a11y-contrast body a:not(#a11y-panel a){color:#0ff !important}' +
    'html.a11y-invert body > *:not(#a11y-panel):not(#a11y-btn){filter:invert(1) hue-rotate(180deg)}' +
    'html.a11y-grayscale body > *:not(#a11y-panel):not(#a11y-btn){filter:grayscale(1)}' +
    'html.a11y-links a{text-decoration:underline !important;outline:2px dashed currentColor;outline-offset:2px}' +
    'html.a11y-readable body *:not(svg):not(svg *){font-family:Arial,Helvetica,sans-serif !important}' +
    'html.a11y-noanim *,html.a11y-noanim *::before,html.a11y-noanim *::after{animation:none !important;transition:none !important;scroll-behavior:auto !important}' +
    'html.a11y-cursor,html.a11y-cursor *{cursor:url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\'><path d=\'M4 4l16 40 6-16 16-6z\' fill=\'black\' stroke=\'white\' stroke-width=\'2\'/></svg>") 4 4,auto !important}' +
    'html.a11y-spacing body *:not(#a11y-panel *){line-height:1.8 !important;letter-spacing:.06em !important;word-spacing:.12em !important}' +
    'html.a11y-headings h1,html.a11y-headings h2,html.a11y-headings h3,html.a11y-headings h4{outline:3px solid #0b57d0;outline-offset:3px}';

  var style = document.createElement('style');
  style.id = 'a11y-widget-style';
  style.textContent = css;
  document.head.appendChild(style);

  var options = [
    ['fontUp', 'הגדלת טקסט'], ['fontDown', 'הקטנת טקסט'],
    ['contrast', 'ניגודיות גבוהה'], ['invert', 'היפוך צבעים'],
    ['grayscale', 'גווני אפור'], ['links', 'הדגשת קישורים'],
    ['readable', 'גופן קריא'], ['noanim', 'עצירת אנימציות'],
    ['cursor', 'סמן גדול'], ['spacing', 'ריווח טקסט'],
    ['headings', 'סימון כותרות'], ['reset', 'איפוס הגדרות']
  ];

  var btn = document.createElement('button');
  btn.id = 'a11y-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'תפריט נגישות');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'a11y-panel');
  // a11y-audit-ignore: static markup only, no user input
  btn.innerHTML = /* a11y-audit-ignore */ '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="4" r="2"/><path d="M19 8.5c-2.3.6-4.6.9-7 .9s-4.7-.3-7-.9l-.5 1.9c1.9.5 3.8.8 5.8.9V14l-2.2 7 1.9.6L12 15.5l2 6.1 1.9-.6-2.2-7v-2.7c2-.1 3.9-.4 5.8-.9z"/></svg>';

  var panel = document.createElement('div');
  panel.id = 'a11y-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-labelledby', 'a11y-title');
  panel.hidden = true;

  var html = '<h2 id="a11y-title">התאמות נגישות</h2><div class="a11y-grid">';
  options.forEach(function (o) {
    var toggle = o[0] in state && o[0] !== 'font';
    html += '<button type="button" data-a11y="' + o[0] + '"' + (toggle ? ' aria-pressed="false"' : '') +
      (o[0] === 'reset' ? ' class="a11y-full"' : '') + '>' + o[1] + '</button>';
  });
  html += '</div><a href="' + encodeURI(statementUrl) + '">הצהרת נגישות</a>' +
    '<button type="button" class="a11y-full" data-a11y="close" style="margin-top:12px;width:100%">סגירה</button>';
  panel.innerHTML = html; // a11y-audit-ignore: built from fixed labels + encodeURI'd config URL

  function apply() {
    var root = document.documentElement;
    root.style.fontSize = state.font ? (100 + state.font * 10) + '%' : '';
    ['contrast', 'invert', 'grayscale', 'links', 'readable', 'noanim', 'cursor', 'spacing', 'headings'].forEach(function (k) {
      root.classList.toggle('a11y-' + k, !!state[k]);
      var b = panel.querySelector('[data-a11y="' + k + '"]');
      if (b) b.setAttribute('aria-pressed', state[k] ? 'true' : 'false');
    });
    save();
  }

  function open(show) {
    panel.hidden = !show;
    btn.setAttribute('aria-expanded', show ? 'true' : 'false');
    if (show) { var first = panel.querySelector('button'); if (first) first.focus(); }
    else btn.focus();
  }

  btn.addEventListener('click', function () { open(panel.hidden); });
  panel.addEventListener('click', function (e) {
    var t = e.target.closest('[data-a11y]');
    if (!t) return;
    var a = t.getAttribute('data-a11y');
    if (a === 'close') return open(false);
    if (a === 'fontUp') state.font = Math.min(state.font + 1, 5);
    else if (a === 'fontDown') state.font = Math.max(state.font - 1, -2);
    else if (a === 'reset') { for (var k in state) state[k] = k === 'font' ? 0 : false; }
    else {
      state[a] = !state[a];
      if (a === 'contrast' && state.contrast) state.invert = false;
      if (a === 'invert' && state.invert) state.contrast = false;
    }
    apply();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) open(false);
  });

  function mount() {
    document.body.appendChild(btn);
    document.body.appendChild(panel);
    load();
    apply();
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
