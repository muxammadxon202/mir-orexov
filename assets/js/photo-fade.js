/* =========================================================================
   Mir Orexov — photo-fade
   Cross-fade mini-slider for any [data-pfade] container holding several
   <img> (first has class "active"), an optional .pfade-caption and
   .pfade-dots. All [data-pfade] boxes on the page advance together on one
   shared clock, so the "How we work" cards change photo in lockstep. Each
   card is independently swipeable (pointer drag / touch) and pauses on
   hover/interaction without breaking the others' shared timing. Captions
   follow RU/EN via data-caption-*, and reduced-motion is respected.
   ========================================================================= */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TICK = 3400; // ms — shared beat for every [data-pfade] box
  const PAUSE_MS = 8000;
  const refreshers = [];
  const controllers = [];

  function isEn() {
    return !!(window.i18n && window.i18n.getLang && window.i18n.getLang() === "en");
  }

  document.querySelectorAll("[data-pfade]").forEach((box) => {
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
    let pausedUntil = 0; // timestamp; box skips shared ticks until this passes

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
    function pause(ms) { pausedUntil = Date.now() + ms; }

    paintCaption();
    refreshers.push(paintCaption); // re-render caption text on language toggle
    controllers.push({
      tick() { if (Date.now() >= pausedUntil) setActive(idx + 1); },
    });

    box.addEventListener("mouseenter", () => pause(Infinity));
    box.addEventListener("mouseleave", () => pause(0));

    // ---- Swipe / drag ------------------------------------------------------
    let downX = null;
    const THRESHOLD = 35;
    box.addEventListener("pointerdown", (e) => {
      downX = e.clientX;
      pause(Infinity);
      try { box.setPointerCapture(e.pointerId); } catch (_) {}
    });
    box.addEventListener("pointerup", (e) => {
      if (downX === null) return;
      const dx = e.clientX - downX;
      downX = null;
      if (dx <= -THRESHOLD) setActive(idx + 1);
      else if (dx >= THRESHOLD) setActive(idx - 1);
      pause(PAUSE_MS);
    });
    box.addEventListener("pointercancel", () => { downX = null; pause(PAUSE_MS); });
  });

  // One shared beat drives every card, so idle cards change in lockstep.
  if (!reduce && controllers.length) {
    setInterval(() => controllers.forEach((c) => c.tick()), TICK);
  }

  // Keep captions in sync when the RU/EN switch is used.
  document.querySelectorAll(".lang-switch button").forEach((b) =>
    b.addEventListener("click", () => setTimeout(() => refreshers.forEach((fn) => fn()), 0))
  );
})();
