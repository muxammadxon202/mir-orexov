// Shared "Request a Quote" modal — used by catalog.html (leaf cards) and
// index.html (hero orbit). Expects the #quote-modal markup to be present on
// the page. Exposes window.openQuoteModal(itemName, itemImg).
(function () {
  const modal = document.querySelector("#quote-modal");
  if (!modal) return;

  const modalForm = modal.querySelector("#quote-modal-form");
  const modalItemEl = modal.querySelector("#quote-modal-item");
  let lastFocused = null;

  function openQuoteModal(itemName, itemImg) {
    modalItemEl.textContent = itemName;
    const thumb = modal.querySelector("#quote-modal-thumb");
    if (thumb) {
      if (itemImg) {
        thumb.src = itemImg;
        thumb.style.display = "";
      } else {
        thumb.style.display = "none";
      }
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
      const res = await fetch("/api/requests", {
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
