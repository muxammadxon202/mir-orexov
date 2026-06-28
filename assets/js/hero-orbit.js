// Populates the homepage hero rings with one representative photo per product
// from Nuts and Dried Fruits only (other catalog categories stay out of the
// orbit). Clicking any of them opens the same "Request a Quote" modal used
// in the catalog drill-down.
(function () {
  const data = window.CATALOG_DATA;
  const orbits = [document.querySelector("#orbit-1"), document.querySelector("#orbit-3")];
  if (!data || orbits.some((o) => !o)) return;

  const ORBIT_CATEGORIES = ["dried", "nuts"];
  const ORBIT_MAX_ITEMS = 20;

  // Which sub-variant to show for products that have several photographed
  // varieties — keeps the orbit to one card per product instead of every SKU.
  // catalog-data.js titles already carry the full "Product Variant" name
  // (e.g. "Фисташки Очищенные"), so they're used as-is below — no re-prefixing.
  const ORBIT_VARIANT_PICK = {
    apricot: "kuraga",
    raisins: "javz",
    prune: "larch",
    walnut: "peeled",
    pistachio: "peeled",
    almond: "peeled",
    peanut: "peeled",
  };

  function buildOrbitLeaves() {
    const items = [];
    data.children
      .filter((category) => ORBIT_CATEGORIES.includes(category.id))
      .forEach((category) => {
        (category.children || []).forEach((product) => {
          // Single-photo product (no sub-varieties) — shown as-is.
          if (!product.children) {
            if (!product.img) return;
            items.push({ titleRu: product.title, titleEn: product.titleEn || product.title, img: product.img });
            return;
          }
          // Multi-variety product — show exactly one variety, picked above
          // (falling back to the first photographed variant, e.g. for
          // products not in ORBIT_VARIANT_PICK). Products with no
          // photographed variant at all (e.g. Cashew) are skipped.
          const pickId = ORBIT_VARIANT_PICK[product.id];
          const variant =
            (pickId && product.children.find((v) => v.id === pickId && v.img)) ||
            product.children.find((v) => v.img);
          if (!variant) return;
          items.push({ titleRu: variant.title, titleEn: variant.titleEn || variant.title, img: variant.img });
        });
      });
    return items.slice(0, ORBIT_MAX_ITEMS);
  }

  const leaves = buildOrbitLeaves();
  if (!leaves.length) return;

  function currentTitle(leaf) {
    const lang = window.i18n ? window.i18n.getLang() : "ru";
    return lang === "en" ? leaf.titleEn : leaf.titleRu;
  }

  // Each ring's box is a different fraction of the hero-visual (.ring-3 48%,
  // .ring-1 92%), so the same icon *percentage* renders at a different
  // *absolute* size per ring. To make every item the same visible size, each
  // ring gets its own percentage that resolves to one shared absolute target
  // (in % of the hero-visual box).
  const ringConfigs = [
    { orbit: orbits[1], boxFraction: 0.48 }, // ring-3 (inner)
    { orbit: orbits[0], boxFraction: 0.92 }, // ring-1 (outer)
  ];
  const TARGET_ABSOLUTE_SIZE = 14; // % of hero-visual

  const buckets = [[], []];
  leaves.forEach((leaf, i) => buckets[i % 2].push(leaf));

  // Items sit on each ring's circle (radius = 50% of the orbit box), so the
  // circle's usable length is ~314% of the box width. Cap each ring's size to
  // whatever fits that many evenly spaced slots without overlapping.
  const ringSizes = ringConfigs.map(({ boxFraction }, i) => {
    const items = buckets[i];
    const targetPercent = TARGET_ABSOLUTE_SIZE / boxFraction;
    if (!items.length) return targetPercent;
    const fitSize = (314 / items.length) * 0.62;
    return Math.max(4, Math.min(targetPercent, fitSize));
  });

  const renderedItems = [];

  ringConfigs.forEach(({ orbit }, ringIndex) => {
    const items = buckets[ringIndex];
    const step = 360 / items.length;
    const size = ringSizes[ringIndex];

    items.forEach((leaf, i) => {
      const spoke = document.createElement("span");
      spoke.className = "orbit-spoke";
      spoke.style.transform = `rotate(${i * step}deg)`;

      const item = document.createElement("button");
      item.type = "button";
      item.className = "orbit-item";
      item.style.width = size + "%";
      item.style.height = size + "%";
      item.innerHTML = `<img src="${leaf.img}" loading="lazy" />`;
      item.addEventListener("click", () => window.openQuoteModal(currentTitle(leaf), leaf.img));

      spoke.appendChild(item);
      orbit.appendChild(spoke);
      renderedItems.push({ leaf, item });
    });
  });

  function refreshLabels() {
    renderedItems.forEach(({ leaf, item }) => {
      const title = currentTitle(leaf);
      item.setAttribute("aria-label", title);
      item.querySelector("img").alt = title;
    });
  }

  refreshLabels();
  window.addEventListener("langchange", refreshLabels);
})();
