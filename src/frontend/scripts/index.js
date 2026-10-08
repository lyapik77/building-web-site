/* ============================================================
   БУРГЕР-МЕНЮ
   ============================================================ */
(function(){
  const burger = document.getElementById('burger');
  const nav = document.getElementById('mainNav');
  if(!burger || !nav) return;

  burger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(isOpen));
  });

  // Закрываем меню при клике по ссылке
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
})();

/* ============================================================
   АНИМАЦИЯ ПОЯВЛЕНИЯ ПРИ СКРОЛЛЕ
   ============================================================ */
(function(){
  const items = document.querySelectorAll('.reveal');
  if(!items.length) return;

  if(!('IntersectionObserver' in window)){
    // Фолбэк для старых браузеров
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  items.forEach(el => observer.observe(el));
})();

/* ============================================================
   ФОРМА
   ============================================================ */
(function(){
  const form = document.getElementById('projectForm');
  const success = document.getElementById('formSuccess');
  if(!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name    = form.querySelector('#name');
    const contact = form.querySelector('#contact');

    let valid = true;

    [name, contact].forEach(field => {
      if(!field) return;
      if(!field.value.trim()){
        field.style.borderBottomColor = '#ff6b6b';
        valid = false;
      } else {
        field.style.borderBottomColor = '';
      }
    });

    if(!valid) return;

    // Здесь можно отправить данные на сервер
    // fetch('/api/lead', { method:'POST', body:new FormData(form) });

    if(success){
      success.classList.add('is-visible');
    }
    form.reset();

    setTimeout(() => {
      if(success) success.classList.remove('is-visible');
    }, 5000);
  });

  // Сброс красной подсветки при вводе
  form.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('input', () => {
      field.style.borderBottomColor = '';
    });
  });
})();