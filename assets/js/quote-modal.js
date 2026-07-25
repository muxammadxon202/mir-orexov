// Shared "Request a Quote" modal — used by catalog.html (leaf cards) and
// index.html (hero orbit). Expects the #quote-modal markup to be present on
// the page. Exposes window.openQuoteModal(itemName, itemImg).
(function () {
  const modal = document.querySelector("#quote-modal");
  if (!modal) return;

  const modalForm = modal.querySelector("#quote-modal-form");
  const modalItemEl = modal.querySelector("#quote-modal-item");
  const modalCard = modal.querySelector(".modal-card") || modal;
  const closeBtn = modal.querySelector("#quote-modal-close");
  let lastFocused = null;

  // The markup already carries role="dialog" aria-modal="true" on .modal-card;
  // set them defensively in case a page ships the card without them.
  if (!modalCard.getAttribute("role")) modalCard.setAttribute("role", "dialog");
  if (!modalCard.hasAttribute("aria-modal")) modalCard.setAttribute("aria-modal", "true");

  const isEn = () => window.i18n && window.i18n.getLang() === "en";

  const FOCUSABLE = [
    "a[href]",
    "area[href]",
    "button:not([disabled])",
    'input:not([type="hidden"]):not([disabled])',
    "select:not([disabled])",
    "textarea:not([disabled])",
    "iframe",
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  // Only things a keyboard can actually reach: hidden fields (the volume field
  // is display:none for some products) and the disabled submit button while a
  // request is in flight must not become trap stops.
  function focusableIn(root) {
    return Array.prototype.filter.call(root.querySelectorAll(FOCUSABLE), (el) => {
      return el.offsetParent !== null && !el.hasAttribute("inert") && el.getAttribute("aria-hidden") !== "true";
    });
  }

  function focusSafely(el) {
    if (!el) return;
    try {
      el.focus({ preventScroll: true });
    } catch (e) {
      el.focus();
    }
  }

  // Everything outside the dialog goes inert while it is open, so neither the
  // pointer nor a screen reader's virtual cursor can wander into the page
  // underneath. `inert` is not in every browser yet — aria-hidden is the
  // fallback, and any element that was already aria-hidden keeps it on close.
  let inerted = [];
  const SKIP_TAGS = { SCRIPT: 1, STYLE: 1, LINK: 1, TEMPLATE: 1, NOSCRIPT: 1 };
  function setBackgroundInert(on) {
    if (on) {
      if (inerted.length) return;
      inerted = Array.prototype.filter.call(document.body.children, (el) => {
        return el !== modal && !SKIP_TAGS[el.tagName];
      });
      inerted.forEach((el) => {
        el.dataset.qmAriaHidden = el.getAttribute("aria-hidden") === "true" ? "1" : "";
        el.setAttribute("inert", "");
        el.setAttribute("aria-hidden", "true");
      });
    } else {
      inerted.forEach((el) => {
        el.removeAttribute("inert");
        if (!el.dataset.qmAriaHidden) el.removeAttribute("aria-hidden");
        delete el.dataset.qmAriaHidden;
      });
      inerted = [];
    }
  }

  // Background scroll lock. Hiding the body overflow removes the scrollbar and
  // the page jumps sideways by its width, so the gap is paid back as padding.
  let scrollLock = null;
  function lockScroll() {
    if (scrollLock) return;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    scrollLock = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = gap + "px";
  }
  function unlockScroll() {
    if (!scrollLock) return;
    document.body.style.overflow = scrollLock.overflow;
    document.body.style.paddingRight = scrollLock.paddingRight;
    scrollLock = null;
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
      dotEls()[current].removeAttribute("aria-current");
      current = (idx + images.length) % images.length;
      slides()[current].classList.add("active");
      dotEls()[current].classList.add("active");
      dotEls()[current].setAttribute("aria-current", "true");
      slides().forEach((s, i) => {
        if (i === current) s.removeAttribute("aria-hidden");
        else s.setAttribute("aria-hidden", "true");
      });
    }
    function startAuto() { timer = setInterval(() => goTo(current + 1), 3500); }
    function stopAuto() { clearInterval(timer); }

    prevBtn.addEventListener("click", () => { stopAuto(); goTo(current - 1); startAuto(); });
    nextBtn.addEventListener("click", () => { stopAuto(); goTo(current + 1); startAuto(); });

    // Arrow/dot names follow the RU/EN toggle, including a switch made while
    // the dialog is open.
    function applyLabels() {
      const en = isEn();
      prevBtn.setAttribute("aria-label", en ? "Previous photo" : "Предыдущее фото");
      nextBtn.setAttribute("aria-label", en ? "Next photo" : "Следующее фото");
      dotEls().forEach((d, i) => {
        d.setAttribute("aria-label", en
          ? "Photo " + (i + 1) + " of " + images.length
          : "Фото " + (i + 1) + " из " + images.length);
      });
    }
    applyLabels();
    window.addEventListener("langchange", applyLabels);

    container.appendChild(track);
    container.appendChild(dots);
    container.appendChild(prevBtn);
    container.appendChild(nextBtn);
    dotEls()[0].setAttribute("aria-current", "true");
    slides().forEach((s, i) => { if (i) s.setAttribute("aria-hidden", "true"); });
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) startAuto();
    return () => {
      clearInterval(timer);
      window.removeEventListener("langchange", applyLabels);
    };
  }

  let stopGalleryAuto = null;

  function openQuoteModal(itemName, itemImg, extra) {
    extra = extra || {};
    modalItemEl.textContent = itemName;
    const thumb = modal.querySelector("#quote-modal-thumb");
    const galleryEl = modal.querySelector("#quote-modal-gallery");
    const weightEl = modal.querySelector("#quote-modal-weight");

    if (stopGalleryAuto) { stopGalleryAuto(); stopGalleryAuto = null; }
    if (galleryEl) galleryEl.innerHTML = "";

    if (extra.gallery && extra.gallery.length > 1) {
      if (thumb) thumb.style.display = "none";
      if (galleryEl) {
        galleryEl.style.display = "block";
        stopGalleryAuto = buildGallery(galleryEl, extra.gallery, itemName);
      }
    } else {
      if (galleryEl) galleryEl.style.display = "none";
      if (thumb) {
        if (itemImg) {
          thumb.src = itemImg;
          thumb.style.display = "";
        } else {
          thumb.style.display = "none";
        }
      }
    }

    if (weightEl) {
      const weightText = isEn() ? extra.weightEn : extra.weight;
      weightEl.textContent = weightText || "";
      weightEl.style.display = weightText ? "" : "none";
    }

    const volumeField = modal.querySelector("#qm-volume-field");
    const volumeLabel = modal.querySelector("#qm-volume-label");
    const volumeInput = modal.querySelector("#qm-volume");
    const volumeError = modal.querySelector("#qm-volume-error");

    if (extra.hideQty) {
      if (volumeField) volumeField.style.display = "none";
      if (volumeInput) volumeInput.required = false;
    } else if (volumeField && volumeLabel && volumeInput && volumeError) {
      volumeField.style.display = "";
      volumeInput.required = true;
      const field = extra.qtyField || {
        label: "Сколько тонн",
        labelEn: "Volume (tons)",
        placeholder: "например, 20",
        placeholderEn: "e.g. 20",
        error: "Укажите объём в тоннах",
        errorEn: "Please enter the volume in tons",
        type: "number",
        min: "0.1",
        step: "0.1",
      };
      volumeLabel.textContent = field.label;
      volumeLabel.dataset.en = field.labelEn;
      volumeInput.placeholder = field.placeholder;
      volumeInput.dataset.enPlaceholder = field.placeholderEn;
      volumeInput.type = field.type || "text";
      if (field.min !== undefined) volumeInput.min = field.min; else volumeInput.removeAttribute("min");
      if (field.step !== undefined) volumeInput.step = field.step; else volumeInput.removeAttribute("step");
      volumeError.textContent = field.error;
      volumeError.dataset.en = field.errorEn;
      if (isEn()) {
        volumeLabel.textContent = field.labelEn;
        volumeInput.placeholder = field.placeholderEn;
        volumeError.textContent = field.errorEn;
      }
    }

    modalForm.reset();
    modalForm.querySelectorAll(".field-error").forEach((el) => el.classList.remove("show"));
    const statusEl = modalForm.querySelector(".form-status");
    statusEl.classList.remove("show", "success", "error");

    // The volume field can be swapped per product, so let the form-error
    // wiring re-check the markup before the dialog is shown.
    if (window.formA11y) window.formA11y.refresh();

    // Remember where the visitor was so focus can go back there on close.
    lastFocused = document.activeElement;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    lockScroll();
    setBackgroundInert(true);
    requestAnimationFrame(() => {
      // First real control in the form, with the close button as a fallback.
      const target = focusableIn(modalForm)[0] || closeBtn || modalCard;
      focusSafely(target);
    });
  }

  function closeQuoteModal() {
    if (!modal.classList.contains("open")) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    setBackgroundInert(false);
    unlockScroll();
    // Focus goes back to the trigger — but only if it is still on the page and
    // no longer inert, otherwise the browser would drop focus onto <body>.
    if (lastFocused && document.contains(lastFocused)) focusSafely(lastFocused);
    lastFocused = null;
  }

  if (closeBtn) closeBtn.addEventListener("click", closeQuoteModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeQuoteModal();
  });

  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("open")) return;

    if (e.key === "Escape" || e.key === "Esc") {
      e.preventDefault();
      closeQuoteModal();
      return;
    }

    // Focus trap: while the dialog is open, Tab cycles inside it instead of
    // escaping into the page underneath.
    if (e.key !== "Tab") return;
    const visible = focusableIn(modalCard);
    if (!visible.length) return;
    const first = visible[0];
    const last = visible[visible.length - 1];
    // Focus outside the card (e.g. after the overlay was clicked, or after the
    // submit button was disabled mid-send) — pull it back in.
    if (!modalCard.contains(document.activeElement)) {
      e.preventDefault();
      focusSafely(e.shiftKey ? last : first);
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      focusSafely(last);
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      focusSafely(first);
    }
  });

  modalForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!modalForm.checkValidity()) {
      modalForm.querySelectorAll("[required]").forEach((field) => {
        const errorEl = field.parentElement.querySelector(".field-error");
        if (errorEl) errorEl.classList.toggle("show", !field.checkValidity());
      });
      const firstInvalid = modalForm.querySelector(":invalid");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const statusEl = modalForm.querySelector(".form-status");
    const submitBtn = modalForm.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(modalForm).entries());
    data.item = modalItemEl.textContent;
    const msg = window.formMessages
      ? window.formMessages()
      : { sending: "Отправка…", success: "Заявка отправлена! Мы свяжемся с вами в ближайшее время.", error: "Не удалось отправить заявку. Попробуйте ещё раз или напишите в WhatsApp." };

    submitBtn.disabled = true;
    submitBtn.classList.add("btn-loading");
    submitBtn.dataset.originalText = submitBtn.textContent;
    submitBtn.textContent = msg.sending;

    try {
      const res = await fetch("https://mir-orexov-backend.onrender.com/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      statusEl.textContent = msg.success;
      statusEl.classList.add("show", "success");
      setTimeout(closeQuoteModal, 1800);
    } catch (err) {
      statusEl.textContent = msg.error;
      statusEl.classList.add("show", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove("btn-loading");
      submitBtn.textContent = submitBtn.dataset.originalText;
    }
  });

  modalForm.querySelectorAll("[required]").forEach((field) => {
    field.addEventListener("blur", () => {
      const errorEl = field.parentElement.querySelector(".field-error");
      if (errorEl) errorEl.classList.toggle("show", !field.checkValidity());
    });
  });

  window.openQuoteModal = openQuoteModal;
  window.closeQuoteModal = closeQuoteModal;
})();
