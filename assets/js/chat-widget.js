// Floating contact widget: a round button bottom-right that expands into a
// stack of direct contact channels (Phone/WhatsApp/Telegram/Email/Instagram).
(function () {
  const widget = document.querySelector(".chat-widget");
  if (!widget) return;

  const toggle = widget.querySelector(".chat-widget-toggle");
  toggle.addEventListener("click", () => {
    widget.classList.toggle("open");
    toggle.setAttribute("aria-expanded", widget.classList.contains("open"));
  });

  document.addEventListener("click", (e) => {
    if (!widget.contains(e.target)) widget.classList.remove("open");
  });
})();
