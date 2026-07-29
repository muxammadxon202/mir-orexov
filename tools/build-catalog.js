#!/usr/bin/env node
/**
 * Generates a real, indexable page for every catalog leaf.
 *
 * Why: the catalog lived entirely behind hash routes (catalog.html#/nuts/walnut),
 * so all 88 products were invisible to search engines — a buyer googling
 * "walnut kernel light halves Uzbekistan" could never land on us. This emits
 * /catalog/<cat>/<product>/[<variety>/]index.html plus the /en/ mirror, each
 * with its own title, H1, description, Product + BreadcrumbList JSON-LD and
 * hreflang pair, then rewrites sitemap.xml.
 *
 * Chrome (header/footer/head boilerplate) is lifted from catalog.html at build
 * time rather than copy-pasted, so editing the real page still propagates here.
 *
 * Run:  node tools/build-catalog.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://mirorexov.com';
const OUT_DIRNAME = 'catalog';

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const catalog = JSON.parse(read('assets/data/catalog.json'));

/* ---------- helpers ---------- */

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Depth-first walk yielding every leaf with its id path and ancestor chain. */
function leaves(node, trail = [], out = []) {
  const kids = node.children;
  if (!kids) {
    out.push({ node, trail: trail.slice() });
    return out;
  }
  for (const child of kids) leaves(child, trail.concat([child]), out);
  return out;
}

/** Every branch that has children, so category/product index pages exist too. */
function branches(node, trail = [], out = []) {
  const kids = node.children;
  if (!kids) return out;
  if (trail.length) out.push({ node, trail: trail.slice() });
  for (const child of kids) branches(child, trail.concat([child]), out);
  return out;
}

const title = (n, en) => (en && n.titleEn ? n.titleEn : n.title) || '';
const desc = (n, en) => (en ? n.descEn : n.desc) || '';
const weight = (n, en) => (en ? n.weightEn : n.weight) || '';

/**
 * Origin is inherited: a node uses the nearest ancestor that declares one, so a
 * bought-in line (candied fruit from China) can override the default without
 * repeating the field on every leaf. Falls back to our own production.
 */
const DEFAULT_ORIGIN = { ru: 'Узбекистан, Самаркандская область', en: 'Uzbekistan, Samarkand region', country: 'Uzbekistan' };
function originOf(trail, en) {
  for (let i = trail.length - 1; i >= 0; i--) {
    const n = trail[i];
    if (en ? n.originEn : n.origin) return en ? n.originEn : n.origin;
  }
  return en ? DEFAULT_ORIGIN.en : DEFAULT_ORIGIN.ru;
}
function originCountryOf(trail) {
  for (let i = trail.length - 1; i >= 0; i--) {
    if (trail[i].originCountry) return trail[i].originCountry;
  }
  return DEFAULT_ORIGIN.country;
}

/** Root-relative asset path ("assets/img/x.avif") -> correct ../ prefix. */
function rel(assetPath, depth) {
  if (!assetPath) return '';
  const clean = String(assetPath).replace(/^\/+/, '');
  if (/^https?:\/\//.test(clean)) return clean;
  return '../'.repeat(depth) + clean;
}

/* ---------- chrome extracted from catalog.html ---------- */

function extractChrome() {
  const src = read('catalog.html');
  const srcEn = read('en/catalog.html');
  const grab = (html, startRe, endTag) => {
    const m = html.match(startRe);
    if (!m) throw new Error('chrome fragment not found: ' + startRe);
    const start = m.index;
    const end = html.indexOf(endTag, start);
    if (end === -1) throw new Error('chrome fragment unterminated: ' + endTag);
    return html.slice(start, end + endTag.length);
  };
  // Some fragments (top-bar, chat-widget) are <div>s containing nested <div>s,
  // so a fixed endTag string can't locate their own closing tag reliably — walk
  // the tag balance instead to find the div that actually matches the opener.
  const grabDiv = (html, startRe) => {
    const m = html.match(startRe);
    if (!m) throw new Error('chrome fragment not found: ' + startRe);
    const start = m.index;
    const tagRe = /<div\b|<\/div>/g;
    tagRe.lastIndex = html.indexOf('>', start) + 1;
    let depth = 1;
    let match;
    while ((match = tagRe.exec(html))) {
      depth += match[0] === '</div>' ? -1 : 1;
      if (depth === 0) return html.slice(start, tagRe.lastIndex);
    }
    throw new Error('chrome fragment unterminated (div balance): ' + startRe);
  };
  return {
    ru: {
      topbar: grabDiv(src, /<div class="top-bar">/),
      header: grab(src, /<header class="navbar">/, '</header>'),
      // The "Request a Quote" modal (assets/js/quote-modal.js) — lifted so a
      // generated product page can open it in place instead of just linking
      // to contact.html, matching catalog.html's own leaf-product behavior.
      modal: grab(src, /<div class="modal-overlay" id="quote-modal"/, '</form>\n    </div>\n  </div>'),
      footer: grab(src, /<footer class="footer">/, '</footer>'),
      chat: grabDiv(src, /<div class="chat-widget"/),
    },
    en: {
      topbar: grabDiv(srcEn, /<div class="top-bar">/),
      header: grab(srcEn, /<header class="navbar">/, '</header>'),
      modal: grab(srcEn, /<div class="modal-overlay" id="quote-modal"/, '</form>\n    </div>\n  </div>'),
      footer: grab(srcEn, /<footer class="footer">/, '</footer>'),
      chat: grabDiv(srcEn, /<div class="chat-widget"/),
    },
  };
}

/**
 * Chrome is lifted from /catalog.html (or /en/catalog.html) and dropped into a
 * page nested `depth` directories below the site root, so every relative URL in
 * it has to be re-expressed. Guessing with prefix-counting got this wrong (an
 * EN page's "nuts.html" resolved to the site root, where it does not exist), so
 * each URL is resolved against the fragment's ORIGINAL directory into a
 * root-absolute path first, then re-emitted relative to the new location.
 */
function reroot(html, depth, en) {
  const sourceDir = en ? 'en/' : '';
  const ups = '../'.repeat(depth);

  const resolve = (url) => {
    if (!url || /^(https?:|mailto:|tel:|data:|#|\/)/.test(url)) return url;
    const stack = sourceDir ? sourceDir.replace(/\/$/, '').split('/') : [];
    for (const part of url.split('/')) {
      if (part === '..') stack.pop();
      else if (part !== '.' && part !== '') stack.push(part);
    }
    return ups + stack.join('/');
  };

  let out = html.replace(/(src|href)="([^"]*)"/g, (m, attr, url) => `${attr}="${resolve(url)}"`);
  // srcset carries its own comma-separated candidate list; rewriting only src
  // leaves the browser choosing a path that 404s.
  out = out.replace(/srcset="([^"]*)"/g, (m, list) =>
    `srcset="${list
      .split(',')
      .map((c) => {
        const [u, d] = c.trim().split(/\s+/);
        return resolve(u) + (d ? ' ' + d : '');
      })
      .join(', ')}"`);
  return out;
}

/* ---------- page template ---------- */

function page({ en, depth, url, altUrl, node, trail, children }) {
  const T = (n) => title(n, en);
  const name = T(node);
  const cat = trail[0];
  const description = desc(node, en);
  const w = weight(node, en);
  const img = node.img ? rel(node.img, depth) : '';
  const gallery = Array.isArray(node.gallery) ? node.gallery.map((g) => rel(g, depth)) : [];
  const chrome = en ? CHROME.en : CHROME.ru;
  const L = en
    ? { catalog: 'Catalog', home: 'Home', request: 'Request a Quote', inCat: 'In this category',
        packing: 'Packing', related: 'Other items in', all: 'All categories',
        lead: (c) => `Wholesale supply from Uzbekistan. Direct export, own processing, shipping to 30+ countries.`,
        metaSuffix: 'wholesale from Uzbekistan | Mir Orexov' }
    : { catalog: 'Каталог', home: 'Главная', request: 'Оставить заявку', inCat: 'В этой категории',
        packing: 'Фасовка', related: 'Другие позиции раздела', all: 'Все категории',
        lead: (c) => `Оптовые поставки из Узбекистана. Прямой экспорт, собственная переработка, поставки в 30+ стран.`,
        metaSuffix: 'оптом из Узбекистана | Mir Orexov' };

  const trailNames = trail.map(T);
  const metaTitle = `${name} — ${L.metaSuffix}`;
  const metaDesc = description || `${name}. ${L.lead(T(cat))}`;

  const crumbs = [
    { name: L.home, url: en ? `${ORIGIN}/en/` : `${ORIGIN}/` },
    { name: L.catalog, url: en ? `${ORIGIN}/en/catalog.html` : `${ORIGIN}/catalog.html` },
    ...trail.map((n, i) => ({
      name: T(n),
      url: `${ORIGIN}${en ? '/en' : ''}/${OUT_DIRNAME}/${trail.slice(0, i + 1).map((x) => x.id).join('/')}/`,
    })),
  ];

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    category: trailNames.join(' / '),
    ...(description ? { description } : {}),
    ...(node.img ? { image: `${ORIGIN}/${String(node.img).replace(/^\/+/, '')}` } : {}),
    brand: { '@type': 'Brand', name: 'Mir Orexov Samarkand' },
    manufacturer: { '@type': 'Organization', name: 'Mir Orexov Samarkand', address: { '@type': 'PostalAddress', addressLocality: 'Samarkand', addressCountry: 'UZ' } },
    countryOfOrigin: { '@type': 'Country', name: originCountryOf(trail) },
    url,
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
  };

  const crumbHtml = crumbs
    .map((c, i) =>
      i === crumbs.length - 1
        ? `<span aria-current="page">${esc(c.name)}</span>`
        : `<a href="${esc(c.url.replace(ORIGIN, '').replace(/^\//, '../'.repeat(depth)))}">${esc(c.name)}</a>`
    )
    .join('<span class="breadcrumb-sep">›</span>');

  // The rich photo+spec-list card only makes sense for something you'd
  // actually buy as a unit: a true leaf product, or the Packaging › Branding
  // line (each of its children — jars, boxes, private label — is itself a
  // distinct branded product worth a hero). Every other branch (Сухофрукты,
  // Орехи, and their own sub-branches) is a category umbrella covering many
  // different items, so showing one stock photo as if it were "the product"
  // misrepresents it — those get the plain header only, then straight to
  // the children grid.
  const isBranch = !!children;
  const inBranding = trail[0] && trail[0].id === 'packaging' && trail[1] && trail[1].id === 'branding';
  const showProductHero = !isBranch || inBranding;

  const galleryHtml = gallery.length > 1
    ? `<div class="product-gallery" data-pfade>${gallery
        .map((g, i) => `<img src="${esc(g)}" alt="${esc(name)}" loading="${i ? 'lazy' : 'eager'}" class="product-gallery__img${i ? '' : ' active'}" />`)
        .join('\n            ')}
          <div class="pfade-dots"></div></div>`
    : img
    ? `<img src="${esc(img)}" alt="${esc(name)}" class="product-hero-photo" />`
    : '';

  // Every generated page here is at least one level below the (page-less)
  // catalog root — the rich gradient card treatment is reserved for that
  // absolute root alone (the homepage and catalog.html's bare view), so
  // every one of these pages uses the plain tile uniformly. Mixing the two
  // styles in the same grid read as two unrelated designs bolted together.
  const childHtml = children && children.length
    ? `<section class="section" style="padding-top:0">
      <div class="container">
        <h2 class="product-section-title">${esc(L.inCat)}</h2>
        <div class="grid-auto">
          ${children
            .map((c) => {
              const cDesc = desc(c, en);
              const cImg = c.img ? rel(c.img, depth) : '';
              return `<a class="cat-tile tone-${esc(cat.id)}" href="${esc(c.id)}/">
            ${cImg ? `<div class="cat-tile-photo"><img src="${esc(cImg)}" alt="${esc(T(c))}" loading="lazy" /></div>` : ''}
            <div class="cat-tile-title">${esc(T(c))}</div>
            ${cDesc && cImg ? `<p class="cat-tile-desc">${esc(cDesc)}</p>` : ''}
          </a>`;
            })
            .join('\n          ')}
        </div>
      </div>
    </section>`
    : '';

  const a = '../'.repeat(depth);
  return `<!DOCTYPE html>
<html lang="${en ? 'en' : 'ru'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
${en ? '  <script>try{localStorage.setItem("lang","en")}catch(e){}</script>\n' : ''}  <script>try{if(sessionStorage.getItem("intro"))document.documentElement.className+=" intro-seen";else sessionStorage.setItem("intro","1")}catch(e){}</script>
  <title>${esc(metaTitle)}</title>
  <meta name="description" content="${esc(metaDesc)}" />
  <link rel="canonical" href="${esc(url)}" />
  <link rel="alternate" hreflang="ru" href="${esc(en ? altUrl : url)}" />
  <link rel="alternate" hreflang="en" href="${esc(en ? url : altUrl)}" />
  <link rel="alternate" hreflang="x-default" href="${esc(en ? altUrl : url)}" />

  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="Mir Orexov Samarkand" />
  <meta property="og:title" content="${esc(metaTitle)}" />
  <meta property="og:description" content="${esc(metaDesc)}" />
  <meta property="og:url" content="${esc(url)}" />
  <meta property="og:image" content="${esc(node.img ? ORIGIN + '/' + String(node.img).replace(/^\/+/, '') : ORIGIN + '/assets/img/og-card.jpg')}" />
  <meta name="twitter:card" content="summary_large_image" />

  <script type="application/ld+json">
${JSON.stringify(productLd, null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(breadcrumbLd, null, 2)}
  </script>

  <link rel="preload" href="${a}assets/fonts/playfair-display-${en ? 'latin' : 'cyrillic'}.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="${a}assets/css/fonts.css" />
  <link rel="icon" type="image/png" sizes="32x32" href="${a}assets/img/branding/favicon-32.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="${a}assets/img/branding/apple-touch-icon-180.png" />
  <link rel="stylesheet" href="${a}assets/css/style.css" />
</head>
<body>
  <div class="preloader" aria-hidden="true">
    <div class="preloader-logo"><img src="${a}assets/img/branding/logo-192.webp" alt="" width="192" height="192" /></div>
    <div class="preloader-bar"></div>
  </div>
  <a class="skip-link" href="#main">${en ? 'Skip to content' : 'Перейти к содержимому'}</a>

  ${reroot(chrome.topbar, depth, en)}

  ${reroot(chrome.header, depth, en)}

  <main id="main">
    <section class="page-header">
      <div class="container">
        <nav class="breadcrumb" aria-label="${en ? 'Breadcrumb' : 'Хлебные крошки'}">${crumbHtml}</nav>
        <h1>${esc(name)}</h1>
        ${description ? `<p>${esc(description)}</p>` : ''}
      </div>
    </section>

    ${showProductHero ? `<section class="section" style="padding-top:0">
      <div class="container two-col product-page">
        <div class="product-media">${galleryHtml}</div>
        <div class="product-info">
          <div class="section-eyebrow">${esc(trailNames.slice(0, -1).join(' · ') || L.catalog)}</div>
          <h2 class="product-name">${esc(name)}</h2>
          ${description ? `<p class="product-lead">${esc(description)}</p>` : ''}
          <dl class="spec-list">
            <div class="spec-row"><dt>${en ? 'Origin' : 'Происхождение'}</dt><dd>${esc(originOf(trail, en))}</dd></div>
            <div class="spec-row"><dt>${en ? 'Category' : 'Категория'}</dt><dd>${esc(trailNames.join(' / '))}</dd></div>
            ${w ? `<div class="spec-row"><dt>${esc(L.packing)}</dt><dd>${esc(w)}</dd></div>` : ''}
          </dl>
          <button type="button" class="btn btn-primary btn-lg" id="page-quote-btn">${esc(L.request)}</button>
        </div>
      </div>
    </section>` : ''}

    ${childHtml}
  </main>

  ${reroot(chrome.modal, depth, en)}

  ${reroot(chrome.footer, depth, en)}

  ${reroot(chrome.chat, depth, en)}

  <script src="${a}assets/js/main.js" defer></script>
  <script src="${a}assets/js/i18n.js" defer></script>
  <script src="${a}assets/js/quote-modal.js" defer></script>
  <script src="${a}assets/js/chat-widget.js" defer></script>${gallery.length > 1 ? `\n  <script src="${a}assets/js/photo-fade.js" defer></script>` : ''}
  <script>
    document.addEventListener("DOMContentLoaded", function () {
      var btn = document.getElementById("page-quote-btn");
      if (!btn) return;
      btn.addEventListener("click", function () {
        if (!window.openQuoteModal) return;
        window.openQuoteModal(${JSON.stringify(name)}, ${JSON.stringify(img || '')}, {
          gallery: ${JSON.stringify(gallery)},
          weight: ${JSON.stringify(w || '')},
          weightEn: ${JSON.stringify(weight(node, true) || '')},
          hideQty: ${JSON.stringify(cat.id === 'packaging')}
        });
      });
    });
  </script>
</body>
</html>
`;
}

/* ---------- build ---------- */

const CHROME = extractChrome();

function build() {
  const urls = [];
  const targets = [...branches(catalog), ...leaves(catalog)];

  for (const { node, trail } of targets) {
    const ids = trail.map((n) => n.id);
    const kids = node.children || null;
    for (const en of [false, true]) {
      const dir = path.join(ROOT, en ? 'en' : '.', OUT_DIRNAME, ...ids);
      const depth = ids.length + 1 + (en ? 1 : 0); // /catalog/<ids...>/ (+ /en)
      const url = `${ORIGIN}${en ? '/en' : ''}/${OUT_DIRNAME}/${ids.join('/')}/`;
      const altUrl = `${ORIGIN}${en ? '' : '/en'}/${OUT_DIRNAME}/${ids.join('/')}/`;
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'index.html'),
        page({ en, depth, url, altUrl, node, trail, children: kids }),
        'utf8'
      );
      if (!en) urls.push({ loc: url, alt: altUrl });
    }
  }
  return urls;
}

function writeSitemap(catalogUrls) {
  const statics = [
    ['', 1.0, 'weekly'], ['catalog.html', 0.9, 'weekly'], ['about.html', 0.7, 'monthly'],
    ['orehi.html', 0.7, 'monthly'], ['sukhofrukty.html', 0.7, 'monthly'],
    ['news.html', 0.5, 'weekly'], ['contact.html', 0.6, 'monthly'],
  ];
  const rows = [];
  const row = (loc, ruAlt, enAlt, priority, changefreq) => `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="ru" href="${ruAlt}" />
    <xhtml:link rel="alternate" hreflang="en" href="${enAlt}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${ruAlt}" />
  </url>`;

  const enName = { '': '', 'catalog.html': 'catalog.html', 'about.html': 'about.html',
    'orehi.html': 'nuts.html', 'sukhofrukty.html': 'dry-fruits.html',
    'news.html': 'news.html', 'contact.html': 'contact.html' };

  for (const [p, pr, cf] of statics) {
    const ru = `${ORIGIN}/${p}`;
    const en = `${ORIGIN}/en/${enName[p]}`;
    rows.push(row(ru, ru, en, pr, cf));
    rows.push(row(en, ru, en, Math.max(0.1, pr - 0.1).toFixed(1), cf));
  }
  for (const u of catalogUrls) {
    rows.push(row(u.loc, u.loc, u.alt, '0.8', 'monthly'));
    rows.push(row(u.alt, u.loc, u.alt, '0.7', 'monthly'));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${rows.join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
  return rows.length;
}

const built = build();
const urlCount = writeSitemap(built);
console.log(`catalog pages: ${built.length * 2} (RU+EN)`);
console.log(`sitemap urls : ${urlCount}`);
