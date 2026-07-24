// Generic image/video slider used by .sam-slider blocks (raw-material,
// production, logistics, Sam Box, and the expo/trade-fair gallery).
// Same behaviour as the inline initializer on about.html, extracted so pages
// that only need the slider (e.g. the homepage) can load it standalone.
(function(){
  function initSlider(slider) {
    const slides  = slider.querySelectorAll('.sam-slide');
    const dots    = slider.querySelectorAll('.sam-dot');
    const caption = slider.querySelector('.sam-slider__caption');
    if (!slides.length) return;
    let current = 0, timer;

    function updateCaption() {
      if (!caption) return;
      const s = slides[current];
      const isEn = document.documentElement.lang === 'en';
      caption.textContent = isEn ? s.dataset.captionEn : s.dataset.captionRu;
    }
    window.addEventListener('langchange', updateCaption);

    function goTo(idx) {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (idx + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
      updateCaption();
      if (slides[current].tagName === 'VIDEO') {
        slides[current].currentTime = 0;
        slides[current].play().catch(() => {});
      }
    }

    updateCaption();

    // Photo slides advance on a fixed timer; a video slide instead waits for
    // its own "ended" event so it always plays through in full first.
    let videoEndedCleanup = null;
    function startAuto() {
      const active = slides[current];
      if (active.tagName === 'VIDEO') {
        const onEnded = () => { goTo(current + 1); startAuto(); };
        active.addEventListener('ended', onEnded, { once: true });
        videoEndedCleanup = () => active.removeEventListener('ended', onEnded);
      } else {
        timer = setTimeout(() => { goTo(current + 1); startAuto(); }, 3500);
      }
    }
    function stopAuto() {
      clearTimeout(timer);
      if (videoEndedCleanup) { videoEndedCleanup(); videoEndedCleanup = null; }
    }

    slider.querySelector('.sam-arrow--next').addEventListener('click', () => { stopAuto(); goTo(current + 1); startAuto(); });
    slider.querySelector('.sam-arrow--prev').addEventListener('click', () => { stopAuto(); goTo(current - 1); startAuto(); });
    dots.forEach((d, i) => {
      d.setAttribute('aria-label', 'Фото ' + (i + 1));
      d.addEventListener('click', () => { stopAuto(); goTo(+d.dataset.idx); startAuto(); });
    });

    // Touch swipe
    let tx = 0;
    slider.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 40) { stopAuto(); goTo(current + (dx < 0 ? 1 : -1)); startAuto(); }
    }, { passive: true });

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) startAuto();
  }

  document.querySelectorAll('.sam-slider').forEach(initSlider);
})();
