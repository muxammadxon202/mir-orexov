// Form error accessibility for the request form (contact.html) and the quote
// modal. The markup ships each message inline as `.field-error` and the
// validation code in main.js / quote-modal.js only toggles a `.show` class on
// it — visible, but silent for screen readers and invisible to any AT that
// looks at the input rather than the page. This file adds the ARIA plumbing
// around that existing behaviour without changing it: a generated id wired
// into the input's aria-describedby, role="alert" on the message, and
// aria-invalid on the control, kept in sync through a MutationObserver on the
// class attribute.
(function () {
  let seq = 0;

  function controlIn(field) {
    return field.querySelector('input:not([type="hidden"]), select, textarea');
  }

  function addDescribedBy(control, id) {
    const ids = (control.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
    if (ids.indexOf(id) === -1) ids.push(id);
    control.setAttribute("aria-describedby", ids.join(" "));
  }

  function sync(control, errorEl) {
    control.setAttribute("aria-invalid", errorEl.classList.contains("show") ? "true" : "false");
  }

  function wire(errorEl) {
    if (errorEl.dataset.a11yWired) return;
    const field = errorEl.closest(".field") || errorEl.parentElement;
    if (!field) return;
    const control = controlIn(field);
    if (!control) return;

    errorEl.dataset.a11yWired = "1";
    if (!errorEl.id) errorEl.id = "field-error-" + ++seq;
    // The message is display:none until it matters, so role="alert" is safe to
    // set up front — nothing is announced until `.show` reveals it.
    errorEl.setAttribute("role", "alert");
    addDescribedBy(control, errorEl.id);
    sync(control, errorEl);

    if (!window.MutationObserver) return;
    new MutationObserver(() => sync(control, errorEl)).observe(errorEl, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  function wireAll() {
    document.querySelectorAll(".field-error").forEach(wire);
  }

  // Exposed so quote-modal.js can re-run it after it rebuilds the volume field
  // for a product; wire() is idempotent, so extra calls are free.
  window.formA11y = { refresh: wireAll };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireAll);
  } else {
    wireAll();
  }
})();
