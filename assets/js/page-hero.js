// About page: floating bars, hero parallax, stage reveal.
// Every effect is opt-in per element (.hero-page, .page-hero__media img,
// [data-reveal]) so this file is inert on any page that does not use them.
(function () {
  "use strict";

  const page = document.querySelector(".hero-page");
  const hero = document.querySelector(".page-hero");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  // --- Floating bars --------------------------------------------------
  // The contact strip and the navbar are fixed over the hero photograph, so
  // two things have to be kept in sync with the layout:
  //   1. --topbar-h, so the navbar always sits exactly under the strip
  //      (the strip wraps to two lines on narrow phones);
  //   2. .nav-lifted, which swaps both bars from transparent-on-photo to
  //      cream-on-content. main.js flips .scrolled at 8px, which is far too
  //      early here — the bars must stay clear until the curtain is nearly
  //      closed, otherwise a cream bar sits on top of the photo.
  // This runs even under reduced motion: it is legibility, not decoration.
  if (page && hero) {
    const topbar = document.querySelector(".top-bar");
    const navbar = document.querySelector(".navbar");

    // Heights are read here and cached, so the scroll handler below never
    // touches layout.
    let trigger = 0;
    const measure = () => {
      if (topbar) {
        page.style.setProperty("--topbar-h", topbar.offsetHeight + "px");
      }
      // 80% of the hero: by then the content has covered most of the photo.
      trigger = hero.offsetHeight * 0.8;
    };

    let lifted = null;
    const syncBars = () => {
      const on = window.scrollY > trigger;
      if (on === lifted) return;
      lifted = on;
      if (topbar) topbar.classList.toggle("nav-lifted", on);
      if (navbar) navbar.classList.toggle("nav-lifted", on);
    };

    // Deliberately not rAF-throttled: this is two reads of cached values and a
    // class toggle that only fires on an actual state change. Deferring it to
    // a frame callback would leave the bars unreadable whenever frames are
    // throttled (background tab, low-power mode) and the user scrolls back.
    measure();
    syncBars();
    window.addEventListener("scroll", syncBars, { passive: true });
    window.addEventListener("resize", () => { measure(); syncBars(); }, { passive: true });
    // The strip's height depends on the loaded font metrics.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  }

  if (reduce.matches) return;

  // --- Hero parallax -------------------------------------------------
  // The photo eases from scale(1.08) to scale(1) and dims as the content
  // curtain rises over it. Driven off scrollY inside rAF so the handler
  // itself never touches layout.
  const heroImg = document.querySelector(".page-hero__media img");

  if (heroImg && hero) {
    let ticking = false;

    const paint = () => {
      ticking = false;
      const h = hero.offsetHeight || 1;
      // 0 at the top of the page, 1 once the hero is fully covered
      const p = Math.min(Math.max(window.scrollY / h, 0), 1);
      heroImg.style.transform = "scale(" + (1.08 - 0.08 * p).toFixed(4) + ")";
      heroImg.style.filter = "brightness(" + (1 - 0.25 * p).toFixed(3) + ")";
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(paint);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    paint();
  }

  // --- Stage reveal ---------------------------------------------------
  // Fires once per element; the transition itself lives in the stylesheet.
  const targets = document.querySelectorAll("[data-reveal]");
  if (!targets.length) return;

  // Only now does the stylesheet get permission to hide these elements: if
  // this file never runs, they stay visible instead of leaving a blank page.
  document.documentElement.classList.add("js-reveal");

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("revealed"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("revealed");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => io.observe(el));
})();
