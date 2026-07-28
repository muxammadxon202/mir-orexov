(function () {
  const gridEl = document.querySelector("#news-grid");
  const emptyEl = document.querySelector("#news-empty");
  if (!gridEl) return;

  function t(article) {
    const lang = window.i18n ? window.i18n.getLang() : "ru";
    const isEn = lang === "en" && article.titleEn;
    return {
      title: (isEn && article.titleEn) || article.title,
      excerpt: (isEn && (article.excerptEn || article.bodyEn)) || article.excerpt || article.body,
      url: (isEn && article.urlEn) || article.url || "",
    };
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  }

  let articles = [];

  function render() {
    gridEl.innerHTML = "";
    articles.forEach((article) => {
      const { title, excerpt, url } = t(article);
      const card = document.createElement(url ? "a" : "article");
      card.className = "cat-tile news-card";
      if (url) card.href = url;
      card.innerHTML = `
        ${article.image ? `<div class="cat-tile-photo"><img src="${article.image}" alt="${title}" loading="lazy" /></div>` : ""}
        <div class="news-card-body">
          <time class="news-card-date">${formatDate(article.date)}</time>
          <h3 class="news-card-title">${title}</h3>
          <div class="news-card-excerpt"><p>${excerpt || ""}</p></div>
        </div>
      `;
      gridEl.appendChild(card);
    });
  }

  fetch("/assets/data/news.json", { cache: "no-cache" })
    .then((res) => res.json())
    .then((data) => {
      articles = (data.articles || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
      if (!articles.length) {
        gridEl.style.display = "none";
        emptyEl.style.display = "block";
        return;
      }
      render();
      window.addEventListener("langchange", render);
    })
    .catch((err) => {
      console.error("Failed to load news:", err);
      gridEl.style.display = "none";
      emptyEl.style.display = "block";
    });
})();
