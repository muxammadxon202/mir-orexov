// The catalog tree used to live here as a hardcoded JS object. It now lives in
// assets/data/catalog.json instead, so the admin panel (Decap CMS, /admin/)
// can edit it directly without touching code. This file just fetches it and
// exposes window.CATALOG_READY, a promise other scripts (catalog.js,
// hero-orbit.js) await before rendering — catalog.js and hero-orbit.js run
// their init() only once this resolves.
// Image paths in catalog.json are written root-relative ("assets/img/...").
// That resolves correctly from pages at the site root, but breaks from any
// page nested a level deeper (e.g. /en/index.html), where the browser would
// look for it under /en/assets/... instead. Normalize every img/gallery path
// to be root-absolute right after fetching, so every consumer (catalog.js,
// hero-orbit.js, quote-modal.js) gets a path that works from any page depth.
function absolutize(node) {
  if (node.img && !node.img.startsWith("/") && !/^https?:\/\//.test(node.img)) {
    node.img = "/" + node.img;
  }
  if (Array.isArray(node.gallery)) {
    node.gallery = node.gallery.map((src) =>
      src && !src.startsWith("/") && !/^https?:\/\//.test(src) ? "/" + src : src
    );
  }
  if (Array.isArray(node.children)) node.children.forEach(absolutize);
  return node;
}

window.CATALOG_READY = fetch("/assets/data/catalog.json")
  .then((res) => res.json())
  .then((data) => {
    absolutize(data);
    window.CATALOG_DATA = data;
    return data;
  });
