// Mobile nav toggle
document.addEventListener("DOMContentLoaded", () => {
  const preloader = document.querySelector(".preloader");
  if (preloader) {
    const minDisplayMs = 2500;
    const start = Date.now();
    const hidePreloader = () => {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, minDisplayMs - elapsed);
      setTimeout(() => {
        preloader.classList.add("hidden");
        document.body.style.overflow = "";
      }, wait);
    };
    document.body.style.overflow = "hidden";
    if (document.readyState === "complete") {
      hidePreloader();
    } else {
      window.addEventListener("load", hidePreloader, { once: true });
    }
  }

  const toggle = document.querySelector(".nav-toggle");
  const navbar = document.querySelector(".navbar");
  if (toggle && navbar) {
    toggle.addEventListener("click", () => {
      const open = navbar.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  // Lang switch UI + translations are handled by assets/js/i18n.js

  // Scroll-reveal for [data-animate] elements
  const animated = document.querySelectorAll("[data-animate]");
  if ("IntersectionObserver" in window && animated.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    animated.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i % 4, 3) * 60}ms`;
      observer.observe(el);
    });
  } else {
    animated.forEach((el) => el.classList.add("in-view"));
  }

  // Hero entrance animation: fires once on load, staggered by data-animate-load index
  const heroAnimated = document.querySelectorAll("[data-animate-load]");
  heroAnimated.forEach((el) => {
    const step = Number(el.dataset.animateLoad) || 0;
    el.style.transitionDelay = `${150 + step * 120}ms`;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("in-view")));
  });

  // Hero particles (generated, respects reduced-motion)
  const particleField = document.querySelector(".particles");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (particleField && !reduceMotion) {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "particle";
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDelay = `${Math.random() * 6}s`;
      p.style.animationDuration = `${5 + Math.random() * 3}s`;
      particleField.appendChild(p);
    }
  }

  initForm();
});

// ===== Request form handling =====
// Backend (Express, deployed separately on Render): POST /api/requests
// Expected JSON body matches FormData field names below.
// Server fans out to Telegram bot, email, and Google Sheets.
const API_ENDPOINT = "https://mir-orexov-backend.onrender.com/api/requests";

function initForm() {
  const form = document.querySelector("#request-form");
  if (!form) return;

  const item = new URLSearchParams(window.location.search).get("item");
  if (item) {
    const messageField = form.querySelector("#message");
    if (messageField && !messageField.value) {
      messageField.value = "Интересует: " + item;
    }
  }

  const statusEl = form.querySelector(".form-status");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.querySelectorAll("[required]").forEach((field) => {
        const errorEl = field.parentElement.querySelector(".field-error");
        if (errorEl) errorEl.classList.toggle("show", !field.checkValidity());
      });
      const firstInvalid = form.querySelector(":invalid");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());

    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.textContent;
    submitBtn.textContent = "Отправка...";
    showStatus(statusEl, "", "");

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");

      showStatus(statusEl, "Заявка отправлена! Мы свяжемся с вами в ближайшее время.", "success");
      form.reset();
    } catch (err) {
      showStatus(statusEl, "Не удалось отправить заявку. Попробуйте ещё раз или напишите в WhatsApp.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.originalText;
    }
  });

  form.querySelectorAll("[required]").forEach((field) => {
    field.addEventListener("blur", () => {
      const errorEl = field.parentElement.querySelector(".field-error");
      if (errorEl) errorEl.classList.toggle("show", !field.checkValidity());
    });
  });
}

function showStatus(el, message, type) {
  if (!el) return;
  el.textContent = message;
  el.classList.remove("success", "error", "show");
  if (type) el.classList.add(type, "show");
}
