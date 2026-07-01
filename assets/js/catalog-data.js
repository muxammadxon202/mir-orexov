// The catalog tree used to live here as a hardcoded JS object. It now lives in
// assets/data/catalog.json instead, so the admin panel (Decap CMS, /admin/)
// can edit it directly without touching code. This file just fetches it and
// exposes window.CATALOG_READY, a promise other scripts (catalog.js,
// hero-orbit.js) await before rendering — catalog.js and hero-orbit.js run
// their init() only once this resolves.
window.CATALOG_READY = fetch("assets/data/catalog.json")
  .then((res) => res.json())
  .then((data) => {
    window.CATALOG_DATA = data;
    return data;
  });
