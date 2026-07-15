// Mobile nav toggle
document.addEventListener("DOMContentLoaded", () => {
  // The 2.5s brand preloader runs on every visit.
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
    const setMenu = (open) => {
      navbar.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", () => setMenu(!navbar.classList.contains("menu-open")));
    // Close on nav link tap, Escape, or a click outside the bar
    navbar.querySelectorAll(".nav-menu a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navbar.classList.contains("menu-open")) setMenu(false);
    });
    document.addEventListener("click", (e) => {
      if (navbar.classList.contains("menu-open") && !navbar.contains(e.target)) setMenu(false);
    });

    // Elevation shadow once the page is scrolled
    const onScroll = () => navbar.classList.toggle("scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Footer logo acts as a "back to top" shortcut instead of reloading the
  // homepage — handy once you've scrolled all the way down to the footer.
  document.querySelectorAll(".pf-logo-row").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

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

  // Count-up animation for stat numbers, triggered when they scroll into view.
  // Values look like "32+", "600т+" — parse the leading integer and preserve
  // whatever suffix follows ("+", "т+"), so only the number animates.
  function armStatCounters() {
    const statNums = document.querySelectorAll(".stat-num");
    if (!statNums.length) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const runCount = (el) => {
      if (el.dataset.counted) return;
      const match = el.textContent.trim().match(/^(\d+)(.*)$/);
      if (!match) return;
      el.dataset.counted = "1";
      const target = parseInt(match[1], 10);
      const suffix = match[2];
      el.classList.add("counted");
      if (prefersReduced) {
        el.textContent = target + suffix;
        return;
      }
      const duration = 1600;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 4); // easeOutQuart — smooth settle
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(tick);
    };

    if ("IntersectionObserver" in window) {
      const statObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              runCount(entry.target);
              statObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      statNums.forEach((el) => statObserver.observe(el));
    } else {
      statNums.forEach(runCount);
    }
  }

  // The intro preloader covers the screen for ~2.5s. If the counters were armed
  // immediately, the hero stats (in view on load) would count up *behind* the
  // preloader and be done before it lifts — so only the scrolled-to footer
  // stats appeared to animate. Arm the counters once the preloader is gone.
  const preloaderEl = document.querySelector(".preloader");
  if (preloaderEl && !preloaderEl.classList.contains("hidden")) {
    let armed = false;
    const armOnce = () => {
      if (armed) return;
      armed = true;
      armStatCounters();
    };
    const poll = setInterval(() => {
      if (preloaderEl.classList.contains("hidden")) {
        clearInterval(poll);
        armOnce();
      }
    }, 100);
    // Safety net in case the preloader never gets the hidden class.
    setTimeout(() => {
      clearInterval(poll);
      armOnce();
    }, 4000);
  } else {
    armStatCounters();
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

// Form status/progress strings, resolved at send time so they follow the
// current RU/EN toggle (window.i18n). Shared with quote-modal.js.
window.formMessages = function () {
  const en = window.i18n && window.i18n.getLang() === "en";
  return {
    sending: en ? "Sending…" : "Отправка…",
    success: en
      ? "Request sent! We will contact you shortly."
      : "Заявка отправлена! Мы свяжемся с вами в ближайшее время.",
    error: en
      ? "Could not send the request. Please try again or message us on WhatsApp."
      : "Не удалось отправить заявку. Попробуйте ещё раз или напишите в WhatsApp.",
  };
};

// The backend sleeps on Render's free tier and takes ~30s to cold-start.
// Ping it as soon as a page with any request form loads, so it is already
// awake by the time the visitor submits.
if (document.querySelector("#request-form, #quote-modal")) {
  fetch("https://mir-orexov-backend.onrender.com/healthz").catch(() => {});
}

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
      // Not just [required] fields — a field like #phone is optional but
      // still carries a pattern (only digits/+/spaces/parens/dashes), so an
      // invalid non-empty value needs its own error shown too.
      form.querySelectorAll("[required], [pattern]").forEach((field) => {
        const errorEl = field.parentElement.querySelector(".field-error");
        if (errorEl) errorEl.classList.toggle("show", !field.checkValidity());
      });
      const firstInvalid = form.querySelector(":invalid");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const msg = window.formMessages();

    submitBtn.disabled = true;
    submitBtn.classList.add("btn-loading");
    submitBtn.dataset.originalText = submitBtn.textContent;
    submitBtn.textContent = msg.sending;
    showStatus(statusEl, "", "");

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");

      showStatus(statusEl, msg.success, "success");
      form.reset();
    } catch (err) {
      showStatus(statusEl, msg.error, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove("btn-loading");
      submitBtn.textContent = submitBtn.dataset.originalText;
    }
  });

  form.querySelectorAll("[required], [pattern]").forEach((field) => {
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
