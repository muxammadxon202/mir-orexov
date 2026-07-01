// Shared "Request a Quote" modal — used by catalog.html (leaf cards) and
// index.html (hero orbit). Expects the #quote-modal markup to be present on
// the page. Exposes window.openQuoteModal(itemName, itemImg).
(function () {
  const modal = document.querySelector("#quote-modal");
  if (!modal) return;

  const modalForm = modal.querySelector("#quote-modal-form");
  const modalItemEl = modal.querySelector("#quote-modal-item");
  let lastFocused = null;

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
    return () => clearInterval(timer);
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
      const lang = window.i18n && window.i18n.getLang() === "en" ? "en" : "ru";
      const weightText = lang === "en" ? extra.weightEn : extra.weight;
      weightEl.textContent = weightText || "";
      weightEl.style.display = weightText ? "" : "none";
    }

    modalForm.reset();
    modalForm.querySelectorAll(".field-error").forEach((el) => el.classList.remove("show"));
    const statusEl = modalForm.querySelector(".form-status");
    statusEl.classList.remove("show", "success", "error");

    lastFocused = document.activeElement;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      const first = modalForm.querySelector("input");
      if (first) first.focus();
    });
  }

  function closeQuoteModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  modal.querySelector("#quote-modal-close").addEventListener("click", closeQuoteModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeQuoteModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeQuoteModal();
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

    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.textContent;
    submitBtn.textContent = "Отправка...";

    try {
      const res = await fetch("https://mir-orexov-backend.onrender.com/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      statusEl.textContent = "Заявка отправлена! Мы свяжемся с вами в ближайшее время.";
      statusEl.classList.add("show", "success");
      setTimeout(closeQuoteModal, 1800);
    } catch (err) {
      statusEl.textContent = "Не удалось отправить заявку. Попробуйте ещё раз или напишите в WhatsApp.";
      statusEl.classList.add("show", "error");
    } finally {
      submitBtn.disabled = false;
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
