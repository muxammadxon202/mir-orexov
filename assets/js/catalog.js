(function () {
  if (!window.CATALOG_READY) return;
  window.CATALOG_READY.then(init).catch((err) => console.error("Catalog failed to load:", err));

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

  const titleEl = document.querySelector("#catalog-title");
  const breadcrumbEl = document.querySelector("#catalog-breadcrumb");
  const gridEl = document.querySelector("#catalog-grid");
  const emptyEl = document.querySelector("#catalog-empty");
  const quoteEl = document.querySelector("#catalog-quote");

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

    titleEl.textContent = trail.map((n) => t(n)).join(" / ");

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

    const hasChildren = node.children && node.children.length > 0;
    const isLeaf = !node.children;
    const isCategoryLevel = path.length === 0;

    gridEl.style.display = hasChildren ? "" : "none";
    emptyEl.style.display = !hasChildren && !isLeaf ? "" : "none";

    if (hasChildren) {
      gridEl.innerHTML = "";
      node.children.forEach((child) => {
        // A child is a dead end for navigation — either a true leaf (no children
        // key at all) or a collapsed branch (disabled) — in both cases there is
        // nothing further to drill into, so show the quote button right on the
        // card instead of making the whole thing a link to another screen.
        const isLeafChild = !child.children || child.disabled;
        const card = document.createElement(isLeafChild ? "div" : "a");
        if (!isLeafChild) card.href = "#/" + [...path, child.id].join("/");
        card.className = "cat-tile" + (isCategoryLevel ? " cat-tile--category" : "") + (isLeafChild ? " cat-tile--disabled" : "") + (child.disabled ? " cat-tile--empty" : "");
        const descText = window.i18n && window.i18n.getLang() === "en" ? child.descEn : child.desc;
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

    if (isLeaf) {
      const fullName = trail
        .slice(1)
        .map((n) => t(n))
        .join(" — ");
      quoteEl.querySelector("#catalog-quote-name").textContent = fullName;

      const weightEl = quoteEl.querySelector("#catalog-quote-weight");
      const weightText = window.i18n && window.i18n.getLang() === "en" ? node.weightEn : node.weight;
      weightEl.textContent = weightText || "";
      weightEl.style.display = weightText ? "" : "none";

      const thumbEl = quoteEl.querySelector("#catalog-quote-thumb");
      const galleryEl = quoteEl.querySelector("#catalog-quote-gallery");
      galleryEl.innerHTML = "";

      if (node.gallery && node.gallery.length > 1) {
        thumbEl.style.display = "none";
        galleryEl.style.display = "";
        buildGallery(galleryEl, node.gallery, fullName);
      } else {
        galleryEl.style.display = "none";
        if (node.img) {
          thumbEl.src = node.img;
          thumbEl.alt = fullName;
          thumbEl.style.display = "";
        } else {
          thumbEl.style.display = "none";
        }
      }

      const quoteBtn = quoteEl.querySelector("#catalog-quote-link");
      const hideQty = path[0] === "packaging";
      quoteBtn.onclick = () => openQuoteModal(fullName, node.img, { gallery: node.gallery, weight: node.weight, weightEn: node.weightEn, hideQty });

      quoteEl.style.display = "";
      quoteEl.classList.remove("quote-anim");
      void quoteEl.offsetWidth; // restart the entrance animation on every visit
      quoteEl.classList.add("quote-anim");
    } else {
      quoteEl.style.display = "none";
      quoteEl.classList.remove("quote-anim");
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

    container.appendChild(track);
    container.appendChild(dots);
    container.appendChild(prevBtn);
    container.appendChild(nextBtn);
    startAuto();
  }

  // Quote modal open/close/submit logic lives in assets/js/quote-modal.js
  // (shared with the homepage hero orbit) and exposes window.openQuoteModal.

  window.addEventListener("hashchange", render);
  window.addEventListener("langchange", render);
  render();
  }
})();
