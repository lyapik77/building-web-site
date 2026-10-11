/* ============================================================
   МОБИЛЬНОЕ МЕНЮ
   ============================================================ */
(function () {
  var burger = document.getElementById('burger');
  var nav = document.getElementById('mainNav');

  if (!burger || !nav) return;

  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
})();

/* ============================================================
   ПЛАВНОЕ ПОЯВЛЕНИЕ БЛОКОВ ПРИ СКРОЛЛЕ
   ============================================================ */
(function () {
  var items = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  items.forEach(function (el) { observer.observe(el); });
})();

/* ============================================================
   ОБРАБОТКА ФОРМЫ ЗАЯВКИ (отправка на бэк: POST /api/request/createRequest)
   Если клиент авторизован, заявка привяжется к его аккаунту.
   ============================================================ */
(function () {
  var form = document.getElementById('projectForm');
  var success = document.getElementById('formSuccess');
  var errorBox = document.getElementById('formError');

  if (!form || !success) return;

  var fields = [form.name, form.phone, form.email];

  function showError(text) {
    if (!errorBox) return;
    errorBox.textContent = text || '';
    errorBox.classList.toggle('is-visible', !!text);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    success.classList.remove('is-visible');
    showError('');

    var body = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim()
    };

    var bad = false;
    fields.forEach(function (input) {
      if (!input.value.trim()) {
        input.style.borderBottomColor = '#E4876B';
        bad = true;
      }
    });
    if (bad) { showError('Заполните все поля'); return; }

    var digits = body.phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) {
      form.phone.style.borderBottomColor = '#E4876B';
      showError('Введите корректный номер телефона');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      form.email.style.borderBottomColor = '#E4876B';
      showError('Введите корректный email');
      return;
    }

    var btn = form.querySelector('button[type=submit]');
    btn.disabled = true;

    Api.post('/request/createRequest', body)
      .then(function () {
        success.classList.add('is-visible');
        form.reset();
      })
      .catch(function (err) { showError(err.message); })
      .then(function () { btn.disabled = false; });
  });

  form.querySelectorAll('input, textarea').forEach(function (input) {
    input.addEventListener('input', function () {
      input.style.borderBottomColor = '';
      showError('');
    });
  });
})();
