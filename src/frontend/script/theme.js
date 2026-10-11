/* ============================================================
   ТЕМА ОФОРМЛЕНИЯ: светлая / тёмная
   Подключается в <head> (синхронно), чтобы не мигало при загрузке.
   Выбор запоминается в localStorage; по умолчанию — системная тема.
   Кнопка: любой элемент с атрибутом data-theme-toggle.
   ============================================================ */
(function () {
  var KEY = 'vysota_theme';
  var root = document.documentElement;

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function systemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function apply(theme) {
    root.setAttribute('data-theme', theme);
    var label = theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', label);
      b.setAttribute('title', label);
    });
  }

  apply(stored() || systemTheme());

  document.addEventListener('DOMContentLoaded', function () {
    apply(root.getAttribute('data-theme'));
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-theme-toggle]');
    if (!btn) return;
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, next); } catch (err) {}
    apply(next);
  });

  /* Пока пользователь не выбирал тему вручную — следуем за системной */
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function () { if (!stored()) apply(systemTheme()); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
  }
})();
