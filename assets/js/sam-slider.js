// Generic image/video slider used by .sam-slider blocks (raw-material,
// production, logistics, Sam Box, and the expo/trade-fair gallery).
// Same behaviour as the inline initializer on about.html, extracted so pages
// that only need the slider (e.g. the homepage) can load it standalone.
(function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isEn = () => document.documentElement.lang === 'en';

  // The stylesheet has no .sr-only helper and this file may not touch the CSS,
  // so the screen-reader-only rules for the generated status region live here.
  function srOnly(el) {
    el.style.cssText = 'position:absolute;width:1px;height:1px;margin:-1px;' +
      'padding:0;border:0;overflow:hidden;white-space:nowrap;' +
      'clip:rect(0 0 0 0);clip-path:inset(50%);';
  }

  function initSlider(slider) {
    const slides  = slider.querySelectorAll('.sam-slide');
    const dots    = slider.querySelectorAll('.sam-dot');
    const caption = slider.querySelector('.sam-slider__caption');
    if (!slides.length) return;
    let current = 0, timer;

    // ===== Accessibility scaffolding =====
    // The block is announced as a named carousel, reachable with Tab and
    // driven with the arrow keys; slide changes go out through a polite live
    // region since the caption swap alone is silent for screen readers.
    slider.setAttribute('role', 'group');
    if (!slider.hasAttribute('tabindex')) slider.setAttribute('tabindex', '0');

    const status = document.createElement('div');
    status.className = 'sam-slider__status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    srOnly(status);
    slider.appendChild(status);

    // Accessible name: an explicit data-carousel-label(-en) wins, otherwise the
    // heading of the section the slider sits in, otherwise a generic label.
    // The heading is read live because i18n.js has already swapped its text by
    // the time a langchange lands.
    const section = slider.closest('section');
    const headingEl = section ? section.querySelector('h1, h2, h3') : null;
    function labelText() {
      const explicit = isEn()
        ? (slider.dataset.carouselLabelEn || slider.dataset.carouselLabel)
        : slider.dataset.carouselLabel;
      if (explicit) return explicit;
      const generic = isEn() ? 'Photo gallery' : 'Фотогалерея';
      const head = headingEl ? headingEl.textContent.trim() : '';
      return head ? generic + ': ' + head : generic;
    }

    function applyLabels() {
      slider.setAttribute('aria-label', labelText());
      // Localised: aria-roledescription is read out verbatim, so an English
      // word inside a Russian page would be spoken by a Russian voice.
      slider.setAttribute('aria-roledescription', isEn() ? 'carousel' : 'карусель');
      dots.forEach((d, i) => {
        d.setAttribute('aria-label', isEn()
          ? 'Photo ' + (i + 1) + ' of ' + slides.length
          : 'Фото ' + (i + 1) + ' из ' + slides.length);
      });
    }

    // Some pages ship the arrows with Russian labels only; hand i18n.js an
    // English counterpart so the EN toggle relabels them as well.
    [['prev', 'Previous'], ['next', 'Next']].forEach(([dir, en]) => {
      const btn = slider.querySelector('.sam-arrow--' + dir);
      if (btn && btn.hasAttribute('aria-label') && !btn.dataset.enAriaLabel) {
        btn.dataset.enAriaLabel = en;
      }
    });

    // Only the active slide is exposed; the others sit at opacity 0 but would
    // otherwise still be read out, alt text and all.
    function syncSlideState() {
      slides.forEach((s, i) => {
        if (i === current) s.removeAttribute('aria-hidden');
        else s.setAttribute('aria-hidden', 'true');
      });
      dots.forEach((d, i) => {
        d.type = 'button';
        if (i === current) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
    }

    function announce() {
      const s = slides[current];
      const text = (isEn() ? s.dataset.captionEn : s.dataset.captionRu) || '';
      const position = isEn()
        ? 'Slide ' + (current + 1) + ' of ' + slides.length
        : 'Слайд ' + (current + 1) + ' из ' + slides.length;
      status.textContent = text ? position + ': ' + text : position;
    }

    function updateCaption() {
      if (!caption) return;
      const s = slides[current];
      caption.textContent = isEn() ? s.dataset.captionEn : s.dataset.captionRu;
    }
    window.addEventListener('langchange', () => { updateCaption(); applyLabels(); });

    function goTo(idx) {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (idx + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
      updateCaption();
      syncSlideState();
      announce();
      if (slides[current].tagName === 'VIDEO') {
        slides[current].currentTime = 0;
        slides[current].play().catch(() => {});
      }
    }

    updateCaption();
    applyLabels();
    syncSlideState();
    // No announce() here on purpose: the first slide is not a change.

    // Photo slides advance on a fixed timer; a video slide instead waits for
    // its own "ended" event so it always plays through in full first.
    let videoEndedCleanup = null;
    function startAuto() {
      const active = slides[current];
      // A video that already finished (e.g. it ended while autoplay was paused
      // on hover) will never fire "ended" again — fall back to the timer.
      if (active.tagName === 'VIDEO' && !active.ended) {
        const onEnded = () => { goTo(current + 1); maybeStartAuto(); };
        active.addEventListener('ended', onEnded, { once: true });
        videoEndedCleanup = () => active.removeEventListener('ended', onEnded);
      } else {
        timer = setTimeout(() => { goTo(current + 1); maybeStartAuto(); }, 3500);
      }
    }
    function stopAuto() {
      clearTimeout(timer);
      if (videoEndedCleanup) { videoEndedCleanup(); videoEndedCleanup = null; }
    }

    // Autoplay is a moving distraction: it holds still while the pointer is
    // over the slider or the keyboard focus is inside it, and never runs at
    // all under prefers-reduced-motion.
    let paused = false;
    function maybeStartAuto() {
      if (!paused && !reduceMotion.matches) startAuto();
    }
    function nudge(idx) { stopAuto(); goTo(idx); maybeStartAuto(); }
    function setPaused(on) {
      if (paused === on) return;
      paused = on;
      if (on) stopAuto(); else maybeStartAuto();
    }

    if (window.PointerEvent) {
      // Pointer type is checked so a tap on a phone does not leave autoplay
      // stuck "hovered" (touch also emits compatibility mouseenter events).
      slider.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setPaused(true); });
      slider.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') setPaused(false); });
    } else {
      slider.addEventListener('mouseenter', () => setPaused(true));
      slider.addEventListener('mouseleave', () => setPaused(false));
    }
    slider.addEventListener('focusin', () => setPaused(true));
    slider.addEventListener('focusout', (e) => {
      if (!slider.contains(e.relatedTarget)) setPaused(false);
    });

    const nextArrow = slider.querySelector('.sam-arrow--next');
    const prevArrow = slider.querySelector('.sam-arrow--prev');
    if (nextArrow) nextArrow.addEventListener('click', () => nudge(current + 1));
    if (prevArrow) prevArrow.addEventListener('click', () => nudge(current - 1));
    dots.forEach((d) => {
      d.addEventListener('click', () => nudge(+d.dataset.idx));
    });

    // Keyboard: arrows step through the slides whenever focus is anywhere in
    // the slider (the container itself, a dot, or an arrow button).
    slider.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); nudge(current + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(current - 1); }
      else if (e.key === 'Home') { e.preventDefault(); nudge(0); }
      else if (e.key === 'End') { e.preventDefault(); nudge(slides.length - 1); }
    });

    // Touch swipe
    let tx = 0;
    slider.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 40) nudge(current + (dx < 0 ? 1 : -1));
    }, { passive: true });

    maybeStartAuto();
  }

  document.querySelectorAll('.sam-slider').forEach(initSlider);
})();
