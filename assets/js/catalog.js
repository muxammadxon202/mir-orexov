(function () {
  const rawRoot = window.CATALOG_DATA;
  if (!rawRoot) return;

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
        card.innerHTML = child.img
          ? `<div class="cat-tile-photo"><img src="${child.img}" alt="${t(child)}" loading="lazy" /></div>`
          : `<div class="cat-tile-photo cat-tile-photo--empty">${t(child)}</div>`;
        card.innerHTML += `<div class="cat-tile-title">${t(child)}</div>`;
        if (isLeafChild) {
          const quoteBtn = document.createElement("button");
          quoteBtn.type = "button";
          quoteBtn.className = "btn btn-primary btn-sm cat-tile-quote-btn";
          quoteBtn.textContent = quoteLabel();
          const fullName = [...trail.slice(1), child].map((n) => t(n)).join(" — ");
          quoteBtn.addEventListener("click", () => openQuoteModal(fullName, child.img));
          card.appendChild(quoteBtn);
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
      const thumbEl = quoteEl.querySelector("#catalog-quote-thumb");
      if (node.img) {
        thumbEl.src = node.img;
        thumbEl.alt = fullName;
        thumbEl.style.display = "";
      } else {
        thumbEl.style.display = "none";
      }
      const quoteBtn = quoteEl.querySelector("#catalog-quote-link");
      quoteBtn.onclick = () => openQuoteModal(fullName, node.img);

      quoteEl.style.display = "";
      quoteEl.classList.remove("quote-anim");
      void quoteEl.offsetWidth; // restart the entrance animation on every visit
      quoteEl.classList.add("quote-anim");
    } else {
      quoteEl.style.display = "none";
      quoteEl.classList.remove("quote-anim");
    }
  }

  // Quote modal open/close/submit logic lives in assets/js/quote-modal.js
  // (shared with the homepage hero orbit) and exposes window.openQuoteModal.

  window.addEventListener("hashchange", render);
  window.addEventListener("langchange", render);
  render();
})();
