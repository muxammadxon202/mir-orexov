/* =========================================================================
   Mir Orexov — Testimonials slider (vanilla)
   Behaviour modelled on the 21st.dev "Testimonial Slider" reference:
   adaptive 1–3 visible cards, drag / touch swipe, autoplay with pause on
   interaction, dot + arrow controls, keyboard support, reduced-motion aware.
   Data comes from window.TESTIMONIALS (assets/js/testimonials-data.js).
   ========================================================================= */
(function () {
  "use strict";

  const root = document.querySelector("[data-testimonials]");
  const data = window.TESTIMONIALS;
  if (!root || !Array.isArray(data) || !data.length) return;

  const track = root.querySelector(".tstm-track");
  const dotsWrap = root.querySelector(".tstm-dots");
  const prevBtn = root.querySelector(".tstm-arrow--prev");
  const nextBtn = root.querySelector(".tstm-arrow--next");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const AVATAR_TONES = ["#c98a3c", "#8a9a5b", "#b5654a", "#7c8a99", "#a86f9e", "#6f9e8a"];

  // ---- Build cards ---------------------------------------------------------
  function initials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  }

  data.forEach((t, i) => {
    const card = document.createElement("article");
    card.className = "tstm-card";

    const tone = AVATAR_TONES[i % AVATAR_TONES.length];
    card.innerHTML =
      '<div class="tstm-card__inner">' +
      '<svg class="tstm-quote" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 7C6.5 7 4.5 9.4 4.5 12.4V17h4.8v-4.8H7.1c0-1.7 1-2.7 2.4-2.9V7zm9 0c-3 0-5 2.4-5 5.4V17h4.8v-4.8h-2.2c0-1.7 1-2.7 2.4-2.9V7z"/></svg>' +
      '<p class="tstm-text">' + escapeHtml(t.quote) + "</p>" +
      '<div class="tstm-person">' +
      '<span class="tstm-avatar" style="--tone:' + tone + '">' +
      '<span class="tstm-initials">' + escapeHtml(initials(t.name)) + "</span>" +
      (t.photo ? '<img src="' + encodeURI(t.photo) + '" alt="" loading="lazy" />' : "") +
      "</span>" +
      '<span class="tstm-meta">' +
      '<span class="tstm-name">' + escapeHtml(t.name) + "</span>" +
      '<span class="tstm-role">' + escapeHtml([t.role, t.company].filter(Boolean).join(", ")) + "</span>" +
      '<span class="tstm-loc">' + (t.flag ? t.flag + " " : "") + escapeHtml(t.country || "") + "</span>" +
      "</span>" +
      "</div>" +
      "</div>";

    // Photo present but broken → drop it, initials stay visible underneath.
    const img = card.querySelector("img");
    if (img) img.addEventListener("error", () => img.remove());

    track.appendChild(card);
  });

  const cards = Array.from(track.children);

  // ---- Responsive visible count -------------------------------------------
  function visibleCount() {
    const w = window.innerWidth;
    if (w >= 1100) return 3;
    if (w >= 680) return 2;
    return 1;
  }

  let visible = visibleCount();
  let index = 0;
  let dir = 1;
  let maxIndex = Math.max(0, cards.length - visible);

  // ---- Dots ----------------------------------------------------------------
  function buildDots() {
    dotsWrap.innerHTML = "";
    for (let i = 0; i <= maxIndex; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tstm-dot";
      b.setAttribute("aria-label", "Отзыв " + (i + 1));
      b.addEventListener("click", () => { goTo(i); pause(); });
      dotsWrap.appendChild(b);
    }
  }

  function layout() {
    cards.forEach((c) => { c.style.flex = "0 0 " + (100 / visible) + "%"; });
    move();
  }

  // Pixel-based transform off the REAL per-slide step. Measure it from the gap
  // between two cards' layout positions (offsetLeft is immune to the track's
  // transform), not a single card's box width — those differ by a few px and a
  // percentage/box-width step drifts, piling up over 30+ cards and pushing them
  // off-screen on mobile.
  function cardWidth() {
    return cards.length > 1
      ? cards[1].offsetLeft - cards[0].offsetLeft
      : cards[0].getBoundingClientRect().width;
  }

  function move() {
    track.style.transition = reduceMotion ? "none" : "";
    track.style.transform = "translate3d(" + (-index * cardWidth()) + "px,0,0)";
    Array.from(dotsWrap.children).forEach((d, i) => d.classList.toggle("active", i === index));
    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= maxIndex;
    cards.forEach((c, i) => c.classList.toggle("is-active", i >= index && i < index + visible));
  }

  function goTo(i) {
    index = Math.max(0, Math.min(i, maxIndex));
    move();
  }

  // ---- Autoplay (ping-pong) -----------------------------------------------
  let timer = null;
  const DELAY = 4500;
  function play() {
    if (reduceMotion || timer) return;
    timer = setInterval(() => {
      if (index >= maxIndex) dir = -1;
      else if (index <= 0) dir = 1;
      goTo(index + dir);
    }, DELAY);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function pause() { stop(); clearTimeout(pause._t); pause._t = setTimeout(play, 9000); }

  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", play);

  // ---- Drag / swipe --------------------------------------------------------
  let startX = 0, dragging = false, moved = 0;
  const THRESHOLD = 40;

  function onDown(x) { dragging = true; startX = x; moved = 0; stop(); track.style.transition = "none"; }
  function onMove(x) {
    if (!dragging) return;
    moved = x - startX;
    track.style.transform = "translate3d(" + (-index * cardWidth() + moved) + "px,0,0)";
  }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    track.style.transition = "";
    if (moved < -THRESHOLD) goTo(index + 1);
    else if (moved > THRESHOLD) goTo(index - 1);
    else move();
    pause();
  }

  track.addEventListener("pointerdown", (e) => { onDown(e.clientX); track.setPointerCapture(e.pointerId); });
  track.addEventListener("pointermove", (e) => onMove(e.clientX));
  track.addEventListener("pointerup", onUp);
  track.addEventListener("pointercancel", onUp);
  // Prevent image drag ghost
  track.addEventListener("dragstart", (e) => e.preventDefault());

  // ---- Arrows + keyboard ---------------------------------------------------
  prevBtn.addEventListener("click", () => { goTo(index - 1); pause(); });
  nextBtn.addEventListener("click", () => { goTo(index + 1); pause(); });
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { goTo(index - 1); pause(); }
    else if (e.key === "ArrowRight") { goTo(index + 1); pause(); }
  });

  // ---- Resize --------------------------------------------------------------
  let rz;
  window.addEventListener("resize", () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      const v = visibleCount();
      if (v !== visible) {
        visible = v;
        maxIndex = Math.max(0, cards.length - visible);
        if (index > maxIndex) index = maxIndex;
        buildDots();
        layout();
      } else {
        // Same card count, but card width changed — re-apply the px transform
        // so the active slide stays aligned instead of drifting after resize.
        const prev = track.style.transition;
        track.style.transition = "none";
        move();
        // force reflow, then restore the animated transition
        void track.offsetWidth;
        track.style.transition = prev;
      }
    }, 150);
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  buildDots();
  layout();
  play();
})();
