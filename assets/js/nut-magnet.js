/* ============================================================
   NUT MAGNET BUTTON — Mir Orexov
   Путь: /assets/js/nut-magnet.js
   Подключить перед </body>:
   <script src="/assets/js/nut-magnet.js" defer></script>

   Разметка:
   <a class="nutbtn" href="..." data-nut-magnet>
     <span class="nutbtn__field"   aria-hidden="true"></span>
     <span class="nutbtn__surface" aria-hidden="true"></span>
     <span class="nutbtn__label">Смотреть каталог</span>
   </a>

   Опции через атрибуты:
     data-nut-count="22"   — количество орехов (14–28)
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     ФОРМЫ
     Силуэт заливкой (.body) + деталь линией (.line).
     Заливка обязательна: контур на 20–36px не читается.
     ---------------------------------------------------------- */
  var SHAPES = {

    /* Ядро грецкого ореха — самая опознаваемая ореховая форма */
    walnut:
      '<svg viewBox="0 0 24 24">' +
      '<path class="body" d="M12 2.4c-1.1 0-1.9.7-3 .7C5.7 3.1 3.1 6 3.1 9.9c0 5.3 4.2 9.8 7.1 11.6' +
      '.9.6 1.3.6 2.2 0 2.9-1.8 7.1-6.3 7.1-11.6 0-3.9-2.6-6.8-5.9-6.8-1.1 0-1.9-.7-3-.7Z"/>' +
      '<path class="line" d="M12 4.4v15.4"/>' +
      '<path class="line" d="M8.5 6.6c-1.5 1.7-1.7 4.2-.6 6.1"/>' +
      '<path class="line" d="M15.5 6.6c1.5 1.7 1.7 4.2.6 6.1"/>' +
      '<path class="line" d="M8.2 14.8c1 1.6 2.2 2.7 3.8 3.6"/>' +
      '<path class="line" d="M15.8 14.8c-1 1.6-2.2 2.7-3.8 3.6"/>' +
      '</svg>',

    /* Миндаль */
    almond:
      '<svg viewBox="0 0 24 24">' +
      '<path class="body" d="M12 2.1c4 3.7 6.2 8.2 6.2 12.2 0 4.4-2.8 7.7-6.2 7.7s-6.2-3.3-6.2-7.7' +
      'c0-4 2.2-8.5 6.2-12.2Z"/>' +
      '<path class="line" d="M12 6.2v12"/>' +
      '</svg>',

    /* Фисташка — треснувшая скорлупа */
    pistachio:
      '<svg viewBox="0 0 24 24">' +
      '<path class="body" d="M11.1 2.3C7.4 4.7 5.2 9 5.2 13.5c0 4.6 2.4 8.2 5.9 8.4V2.3Z"/>' +
      '<path class="body" d="M12.9 2.3c3.7 2.4 5.9 6.7 5.9 11.2 0 4.6-2.4 8.2-5.9 8.4V2.3Z"/>' +
      '<path class="line" d="M11.1 3.6C8.1 5.9 6.4 9.5 6.4 13.5"/>' +
      '<path class="line" d="M12.9 3.6c3 2.3 4.7 5.9 4.7 9.9"/>' +
      '</svg>',

    /* Фундук */
    hazelnut:
      '<svg viewBox="0 0 24 24">' +
      '<path class="body" d="M12 21.8c4.1 0 7-3.3 7-7.6 0-3.8-2.7-6.9-7-6.9s-7 3.1-7 6.9c0 4.3 2.9 7.6 7 7.6Z"/>' +
      '<path class="body" d="M12 8.6c-3 0-5.4-1-5.4-2.4S9 3.3 12 3.3s5.4 1.5 5.4 2.9-2.4 2.4-5.4 2.4Z"/>' +
      '<path class="line" d="M12 3.3V1.4"/>' +
      '<path class="line" d="M8.4 12.4c-.9 1.6-.9 3.6 0 5.2"/>' +
      '</svg>',

    /* Курага — компания продаёт и сухофрукты */
    apricot:
      '<svg viewBox="0 0 24 24">' +
      '<path class="body" d="M12 3c4.7 0 8.4 3.6 8.4 8.6S16.7 21 12 21s-8.4-4.4-8.4-9.4S7.3 3 12 3Z"/>' +
      '<path class="line" d="M12 3.4c-1.9 2.7-2.8 5.6-2.8 8.5s.9 5.8 2.8 8.5"/>' +
      '</svg>'
  };

  var KEYS = ['walnut', 'almond', 'pistachio', 'hazelnut', 'apricot'];

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqHover  = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* Детерминированный ПСЧ — одинаковая раскладка при каждой загрузке */
  function seeded(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* ----------------------------------------------------------
     Построение орехов
     ---------------------------------------------------------- */
  function build(btn) {
    var field = btn.querySelector('.nutbtn__field');
    if (!field || field.childElementCount) return;

    var count = parseInt(btn.getAttribute('data-nut-count'), 10) || 22;

    /* На узком экране радиус ужимаем, иначе орехи вылезут за вьюпорт
       и появится горизонтальный скролл */
    var narrow = window.innerWidth < 640;
    var k = narrow ? 0.48 : 1;
    if (narrow) count = Math.min(count, 14);

    var rand = seeded(count * 7919 + 13);
    var frag = document.createDocumentFragment();

    for (var i = 0; i < count; i++) {
      /* Два кольца разной плотности — россыпь, а не ободок вокруг кнопки */
      var ring   = i % 2;
      var angle  = (i / count) * Math.PI * 2 + rand() * 0.5;
      var radius = (ring === 0 ? 92 + rand() * 34 : 138 + rand() * 46) * k;
      var size   = (ring === 0 ? 26 + Math.round(rand() * 10)
                               : 20 + Math.round(rand() * 8)) * (narrow ? 0.8 : 1);

      var el = document.createElement('span');
      el.className = 'nut';
      el.style.setProperty('--x', Math.round(Math.cos(angle) * radius) + 'px');
      el.style.setProperty('--y', Math.round(Math.sin(angle) * radius * 0.64) + 'px');
      el.style.setProperty('--r', Math.round(rand() * 320 - 160) + 'deg');
      el.style.setProperty('--size', Math.round(size) + 'px');
      el.style.setProperty('--delay', (i % 6) * 20 + 'ms');
      el.innerHTML = SHAPES[KEYS[i % 5]];

      frag.appendChild(el);
    }

    field.appendChild(frag);
    return true;
  }

  /* ----------------------------------------------------------
     ТЕЛЕФОН: разовый сбор при появлении кнопки на экране.
     Наведения нет — поэтому триггер по скроллу.
     ---------------------------------------------------------- */
  function watchOnce(btn) {
    if (!('IntersectionObserver' in window)) {
      btn.classList.add('is-settled');
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.disconnect();

        // Небольшая пауза, чтобы пользователь успел увидеть исходную россыпь
        setTimeout(function () {
          btn.classList.add('is-attracting');
          setTimeout(function () {
            btn.classList.remove('is-attracting');
            btn.classList.add('is-settled');
          }, 900);
        }, 420);
      });
    }, { threshold: 0.55 });

    io.observe(btn);
  }

  /* ---------------------------------------------------------- */

  function init() {
    if (mqReduce.matches) return;   // без анимации не создаём DOM вообще

    var buttons = document.querySelectorAll('[data-nut-magnet]');
    if (!buttons.length) return;

    Array.prototype.forEach.call(buttons, function (btn) {
      if (!build(btn)) return;
      if (!mqHover.matches) watchOnce(btn);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
