(function () {
  if (!window.CATALOG_READY) return;
  window.CATALOG_READY.then(init).catch((err) => {
    console.error("Catalog failed to load:", err);
    // Swap the skeleton placeholders for the empty state instead of
    // leaving them shimmering forever.
    const grid = document.querySelector("#catalog-grid");
    const empty = document.querySelector("#catalog-empty");
    if (grid) grid.style.display = "none";
    if (empty) empty.style.display = "";
  });

  function init(rawRoot) {
  // Drop dead ends: a leaf with no photo is removed entirely. A category
  // (depth 1) always stays, even with nothing inside yet — it just shows the
  // "coming soon" empty state. A product (depth 2+) whose real photographed
  // varieties all disappear stays visible (it still has its own photo) but
  // becomes non-clickable, since drilling in would lead nowhere.
  function resolveNode(node, depth) {
    if (!node.children) {
      return node.img || node.service ? node : null;
    }
    const kids = node.children.map((c) => resolveNode(c, depth + 1)).filter(Boolean);
    if (kids.length > 0) {
      return Object.assign({}, node, { children: kids });
    }
    if (depth === 1) {
      return Object.assign({}, node, { children: [] });
    }
    if (node.img) {
      return Object.assign({}, node, { children: [], disabled: true });
    }
    return null;
  }

  const root = resolveNode(rawRoot, 0) || rawRoot;

  function t(node) {
    const lang = window.i18n ? window.i18n.getLang() : "ru";
    return lang === "en" && node.titleEn ? node.titleEn : node.title;
  }

  function quoteLabel() {
    return window.i18n && window.i18n.getLang() === "en" ? "Request a Quote" : "Оставить заявку";
  }

  function isEn() {
    return window.i18n && window.i18n.getLang() === "en";
  }

  // «6 позиций / 3 позиции / 1 позиция» — proper Russian declension for the badge
  function countLabel(n) {
    if (isEn()) return n + (n === 1 ? " item" : " items");
    const mod10 = n % 10, mod100 = n % 100;
    const word =
      mod10 === 1 && mod100 !== 11 ? "позиция"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "позиции"
      : "позиций";
    return n + " " + word;
  }

  const ARROW_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  const titleEl = document.querySelector("#catalog-title");
  const breadcrumbEl = document.querySelector("#catalog-breadcrumb");
  const gridEl = document.querySelector("#catalog-grid");
  const gridTitleEl = document.querySelector("#catalog-grid-title");
  const emptyEl = document.querySelector("#catalog-empty");
  const heroSectionEl = document.querySelector("#catalog-hero-section");
  const heroPhotoEl = document.querySelector("#catalog-hero-photo");
  const heroGalleryEl = document.querySelector("#catalog-hero-gallery");
  const heroEyebrowEl = document.querySelector("#catalog-hero-eyebrow");
  const heroNameEl = document.querySelector("#catalog-hero-name");
  const heroLeadEl = document.querySelector("#catalog-hero-lead");
  const heroSpecsEl = document.querySelector("#catalog-hero-specs");
  const heroQuoteBtn = document.querySelector("#catalog-hero-quote-btn");

  // Origin is inherited from the nearest ancestor that declares one (e.g. candied
  // fruit sourced from China), falling back to our own Samarkand production —
  // mirrors originOf() in tools/build-catalog.js so the two renderers agree.
  const DEFAULT_ORIGIN = { ru: "Узбекистан, Самаркандская область", en: "Uzbekistan, Samarkand region" };
  function originOf(trail) {
    for (let i = trail.length - 1; i >= 0; i--) {
      const v = isEn() ? trail[i].originEn : trail[i].origin;
      if (v) return v;
    }
    return isEn() ? DEFAULT_ORIGIN.en : DEFAULT_ORIGIN.ru;
  }

  function nodeAtPath(path) {
    let node = root;
    for (const id of path) {
      node = (node.children || []).find((c) => c.id === id);
      if (!node) return null;
    }
    return node;
  }

  function pathFromHash() {
    const hash = window.location.hash.replace(/^#\/?/, "");
    return hash ? hash.split("/").filter(Boolean) : [];
  }

  function render() {
    const path = pathFromHash();
    const node = nodeAtPath(path) || root;
    const trail = [root, ...path.map((_, i) => nodeAtPath(path.slice(0, i + 1)))];

    // Both are optional chrome: a page that drops them (the catalog hero, for
    // instance, once carried neither) must still render its grid rather than
    // throwing here and leaving the skeletons up forever.
    if (titleEl) titleEl.textContent = trail.map((n) => t(n)).join(" / ");

    if (breadcrumbEl) {
    breadcrumbEl.innerHTML = "";
    trail.forEach((n, i) => {
      const link = document.createElement("a");
      link.textContent = t(n);
      link.href = i === 0 ? "#" : "#/" + path.slice(0, i).join("/");
      if (i === trail.length - 1) link.setAttribute("aria-current", "page");
      breadcrumbEl.appendChild(link);
      if (i < trail.length - 1) {
        const sep = document.createElement("span");
        sep.textContent = "›";
        sep.className = "breadcrumb-sep";
        breadcrumbEl.appendChild(sep);
      }
    });
    }

    const hasChildren = node.children && node.children.length > 0;
    const isLeaf = !node.children;
    const isCategoryLevel = path.length === 0;

    gridEl.style.display = hasChildren ? "" : "none";
    emptyEl.style.display = !hasChildren && !isLeaf ? "" : "none";
    // Root shows wide gradient category cards; deeper levels use product tiles
    gridEl.classList.toggle("grid-cards", isCategoryLevel);

    // Every node below the root — whether it's a true leaf product or a
    // category that also carries its own photo/description (e.g. "Сушёные
    // абрикосы" itself, above its four varieties) — gets the same product
    // card the static /catalog/... pages render, so the two routes into the
    // same content never disagree again.
    const showHero = !isCategoryLevel && (hasChildren || isLeaf) && (node.img || node.desc);
    if (heroSectionEl) heroSectionEl.style.display = showHero ? "" : "none";
    if (gridTitleEl) gridTitleEl.style.display = showHero && hasChildren ? "" : "none";

    if (showHero) {
      const descText = isEn() ? node.descEn : node.desc;
      const gallery = Array.isArray(node.gallery) ? node.gallery : [];
      const ancestorNames = trail.slice(1, -1).map(t);
      const categoryNames = trail.slice(1).map(t);

      if (heroEyebrowEl) heroEyebrowEl.textContent = ancestorNames.join(" · ") || (isEn() ? "Catalog" : "Каталог");
      if (heroNameEl) heroNameEl.textContent = t(node);
      if (heroLeadEl) {
        heroLeadEl.textContent = descText || "";
        heroLeadEl.style.display = descText ? "" : "none";
      }

      if (heroSpecsEl) {
        heroSpecsEl.innerHTML = "";
        const rows = [
          [isEn() ? "Origin" : "Происхождение", originOf(trail)],
          [isEn() ? "Category" : "Категория", categoryNames.join(" / ") || t(node)],
        ];
        const weightText = isEn() ? node.weightEn : node.weight;
        if (weightText) rows.push([isEn() ? "Packing" : "Фасовка", weightText]);
        rows.forEach(([label, value]) => {
          const row = document.createElement("div");
          row.className = "spec-row";
          const dt = document.createElement("dt");
          dt.textContent = label;
          const dd = document.createElement("dd");
          dd.textContent = value;
          row.appendChild(dt);
          row.appendChild(dd);
          heroSpecsEl.appendChild(row);
        });
      }

      if (heroPhotoEl && heroGalleryEl) {
        if (gallery.length > 1) {
          heroPhotoEl.style.display = "none";
          heroGalleryEl.style.display = "";
          heroGalleryEl.innerHTML = "";
          buildGallery(heroGalleryEl, gallery, t(node));
        } else {
          heroGalleryEl.style.display = "none";
          heroGalleryEl.innerHTML = "";
          if (node.img) {
            heroPhotoEl.src = node.img;
            heroPhotoEl.alt = t(node);
            heroPhotoEl.style.display = "";
          } else {
            heroPhotoEl.style.display = "none";
          }
        }
      }

      if (heroQuoteBtn) {
        const fullName = categoryNames.join(" — ") || t(node);
        const hideQty = path[0] === "packaging";
        heroQuoteBtn.onclick = () =>
          openQuoteModal(fullName, node.img, { gallery: node.gallery, weight: node.weight, weightEn: node.weightEn, hideQty });
      }
    }

    if (hasChildren) {
      gridEl.innerHTML = "";
      // Every card inherits its family tone: the category's own id at root,
      // the current branch's top category when drilled in.
      const toneId = isCategoryLevel ? null : path[0];
      node.children.forEach((child) => {
        const descText = isEn() ? child.descEn : child.desc;

        // Root level: gradient category card — badge with tone dot, what's
        // inside, CTA arrow, category photo overflowing the corner.
        if (isCategoryLevel) {
          const card = document.createElement("a");
          card.href = "#/" + child.id;
          card.className = "cat-card tone-" + child.id;
          // Prefer the background-removed cutout: the product sits directly on
          // the gradient instead of inside a clipped photo circle.
          const art = child.cutout || child.img;
          const artClass = "cat-card__img" + (child.cutout ? " cat-card__img--cutout" : "");
          card.innerHTML =
            (art ? `<img class="${artClass}" src="${art}" alt="" aria-hidden="true" loading="lazy" />` : "") +
            `<span class="cat-card__badge"><span class="dot" aria-hidden="true"></span>${countLabel((child.children || []).length)}</span>` +
            `<h3 class="cat-card__title">${t(child)}</h3>` +
            `<p class="cat-card__desc">${descText || ""}</p>` +
            `<span class="cat-card__cta">${isEn() ? "View" : "Смотреть"}${ARROW_SVG}</span>`;
          gridEl.appendChild(card);
          return;
        }

        // A child is a dead end for navigation — either a true leaf (no children
        // key at all) or a collapsed branch (disabled) — in both cases there is
        // nothing further to drill into, so show the quote button right on the
        // card instead of making the whole thing a link to another screen.
        const isLeafChild = !child.children || child.disabled;
        const card = document.createElement(isLeafChild ? "div" : "a");
        if (!isLeafChild) card.href = "#/" + [...path, child.id].join("/");
        card.className = "cat-tile" + (toneId ? " tone-" + toneId : "") + (isLeafChild ? " cat-tile--disabled" : "") + (child.disabled ? " cat-tile--empty" : "") + (path[0] === "packaging" ? " cat-tile--packaging" : "");
        if (child.img) {
          card.innerHTML = `<div class="cat-tile-photo"><img src="${child.img}" alt="${t(child)}" loading="lazy" /></div>`;
        } else if (descText) {
          card.innerHTML = `<div class="cat-tile-photo cat-tile-photo--service">
            <svg class="cat-tile-service-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 13a8 8 0 0116 0"/><rect x="2" y="13" width="5" height="7" rx="1.5"/><rect x="17" y="13" width="5" height="7" rx="1.5"/><path d="M20 20a4 4 0 01-4 4h-2"/></svg>
            <p class="cat-tile-service-desc">${descText}</p>
          </div>`;
        } else {
          card.innerHTML = `<div class="cat-tile-photo cat-tile-photo--empty">${t(child)}</div>`;
        }
        card.innerHTML += `<div class="cat-tile-title">${t(child)}</div>`;
        // Product description under the title (service tiles already carry
        // their text inside the photo area — don't repeat it).
        if (descText && child.img) {
          card.innerHTML += `<p class="cat-tile-desc">${descText}</p>`;
        }
        if (isLeafChild) {
          const quoteBtn = document.createElement("button");
          quoteBtn.type = "button";
          quoteBtn.className = "btn btn-primary btn-sm cat-tile-quote-btn";
          quoteBtn.textContent = quoteLabel();
          const fullName = [...trail.slice(1), child].map((n) => t(n)).join(" — ");
          const isPackaging = path[0] === "packaging";
          quoteBtn.addEventListener("click", () =>
            openQuoteModal(fullName, child.img, { gallery: child.gallery, weight: child.weight, weightEn: child.weightEn, hideQty: isPackaging })
          );
          card.appendChild(quoteBtn);
        }
        if (child.gallery && child.gallery.length > 1) {
          buildTilePreview(card.querySelector(".cat-tile-photo"), child.gallery, t(child));
        }
        gridEl.appendChild(card);
      });
    }

  }

  function buildTilePreview(photoEl, images, alt) {
    if (!photoEl || images.length < 2) return;
    const mainImg = photoEl.querySelector("img");
    if (mainImg) mainImg.classList.add("cat-tile-photo__slide", "active");
    const slides = [mainImg];
    images.slice(1).forEach((src) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = alt;
      img.loading = "lazy";
      img.className = "cat-tile-photo__slide";
      photoEl.appendChild(img);
      slides.push(img);
    });
    let current = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setInterval(() => {
      slides[current].classList.remove("active");
      current = (current + 1) % slides.length;
      slides[current].classList.add("active");
    }, 2600);
  }

  function buildGallery(container, images, alt) {
    let current = 0;
    let timer;
    const track = document.createElement("div");
    track.className = "catalog-gallery__track";
    images.forEach((src, i) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = alt;
      img.className = "catalog-gallery__slide" + (i === 0 ? " active" : "");
      track.appendChild(img);
    });
    const dots = document.createElement("div");
    dots.className = "catalog-gallery__dots";
    images.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "catalog-gallery__dot" + (i === 0 ? " active" : "");
      dot.addEventListener("click", () => {
        stopAuto();
        goTo(i);
        startAuto();
      });
      dots.appendChild(dot);
    });
    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "catalog-gallery__arrow catalog-gallery__arrow--prev";
    prevBtn.innerHTML = "&#8592;";
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "catalog-gallery__arrow catalog-gallery__arrow--next";
    nextBtn.innerHTML = "&#8594;";

    const slides = () => track.querySelectorAll(".catalog-gallery__slide");
    const dotEls = () => dots.querySelectorAll(".catalog-gallery__dot");

    function goTo(idx) {
      slides()[current].classList.remove("active");
      dotEls()[current].classList.remove("active");
      current = (idx + images.length) % images.length;
      slides()[current].classList.add("active");
      dotEls()[current].classList.add("active");
    }
    function startAuto() { timer = setInterval(() => goTo(current + 1), 3500); }
    function stopAuto() { clearInterval(timer); }

    prevBtn.addEventListener("click", () => { stopAuto(); goTo(current - 1); startAuto(); });
    nextBtn.addEventListener("click", () => { stopAuto(); goTo(current + 1); startAuto(); });

    prevBtn.setAttribute("aria-label", "Предыдущее фото");
    nextBtn.setAttribute("aria-label", "Следующее фото");
    dotEls().forEach((d, i) => d.setAttribute("aria-label", "Фото " + (i + 1)));

    container.appendChild(track);
    container.appendChild(dots);
    container.appendChild(prevBtn);
    container.appendChild(nextBtn);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) startAuto();
  }

  // Quote modal open/close/submit logic lives in assets/js/quote-modal.js
  // (shared with the homepage hero orbit) and exposes window.openQuoteModal.

  window.addEventListener("hashchange", render);
  window.addEventListener("langchange", render);
  render();
  }
})();
