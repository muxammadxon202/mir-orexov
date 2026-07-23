/* =========================================================================
   Mir Orexov — photo-fade
   Cross-fade mini-slider for any [data-pfade] container holding several
   <img> (first has class "active"), an optional .pfade-caption and
   .pfade-dots. Auto-advances, shows a per-photo caption (RU/EN via
   data-caption-*), is swipeable (pointer drag / touch), builds dots, pauses
   on hover or interaction, and respects reduced-motion. Used by the
   "How we work" process steps.
   ========================================================================= */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const BASE = 3400; // ms per photo
  const refreshers = [];

  function isEn() {
    return !!(window.i18n && window.i18n.getLang && window.i18n.getLang() === "en");
  }

  document.querySelectorAll("[data-pfade]").forEach((box, bi) => {
    const imgs = Array.from(box.querySelectorAll("img"));
    if (imgs.length < 2) return;

    imgs.forEach((im, i) => im.classList.toggle("active", i === 0));

    const capEl = box.querySelector(".pfade-caption");
    const dotsWrap = box.querySelector(".pfade-dots");
    const dots = [];
    if (dotsWrap) {
      imgs.forEach((_, i) => {
        const s = document.createElement("span");
        if (i === 0) s.classList.add("active");
        dotsWrap.appendChild(s);
        dots.push(s);
      });
    }

    let idx = 0;

    function caption(i) {
      const im = imgs[i];
      return (isEn() ? im.dataset.captionEn : im.dataset.captionRu) || im.dataset.captionRu || "";
    }
    function paintCaption() {
      if (!capEl) return;
      const text = caption(idx);
      capEl.textContent = text;
      capEl.classList.toggle("show", !!text);
    }
    function setActive(i) {
      imgs[idx].classList.remove("active");
      if (dots[idx]) dots[idx].classList.remove("active");
      idx = (i + imgs.length) % imgs.length;
      imgs[idx].classList.add("active");
      if (dots[idx]) dots[idx].classList.add("active");
      paintCaption();
    }

    paintCaption();
    refreshers.push(paintCaption); // re-render caption text on language toggle

    // ---- Autoplay ----------------------------------------------------------
    let timer = null;
    const period = BASE + bi * 350; // slight desync between the four cards
    function start() { if (!reduce && !timer) timer = setInterval(() => setActive(idx + 1), period); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function pause() { stop(); clearTimeout(pause._t); pause._t = setTimeout(start, 8000); }

    box.addEventListener("mouseenter", stop);
    box.addEventListener("mouseleave", start);

    // ---- Swipe / drag ------------------------------------------------------
    let downX = null;
    const THRESHOLD = 35;
    box.addEventListener("pointerdown", (e) => {
      downX = e.clientX;
      stop();
      try { box.setPointerCapture(e.pointerId); } catch (_) {}
    });
    box.addEventListener("pointerup", (e) => {
      if (downX === null) return;
      const dx = e.clientX - downX;
      downX = null;
      if (dx <= -THRESHOLD) setActive(idx + 1);
      else if (dx >= THRESHOLD) setActive(idx - 1);
      pause();
    });
    box.addEventListener("pointercancel", () => { downX = null; pause(); });

    start();
  });

  // Keep captions in sync when the RU/EN switch is used.
  document.querySelectorAll(".lang-switch button").forEach((b) =>
    b.addEventListener("click", () => setTimeout(() => refreshers.forEach((fn) => fn()), 0))
  );
})();
