/* ============================================================
   ВХОД И РЕГИСТРАЦИЯ (клиенты и сотрудники)
   body[data-mode] = "client" | "staff"
   ============================================================ */
(function () {
  var mode = document.body.getAttribute('data-mode') || 'client';
  var loginForm = document.getElementById('loginForm');
  var registerForm = document.getElementById('registerForm');

  /* Уже авторизован — отправляем в нужный раздел */
  var existing = Auth.user();
  if (Auth.token() && existing) {
    if (mode === 'staff' && !Auth.isStaff(existing)) {
      /* клиент зашёл на вход для сотрудников — остаёмся на форме */
    } else {
      location.replace(Auth.home(existing));
      return;
    }
  }

  function setInvalid(input, bad) {
    var wrap = input.closest('.f-field');
    if (wrap) wrap.classList.toggle('is-invalid', !!bad);
  }

  [loginForm, registerForm].forEach(function (form) {
    if (!form) return;
    form.querySelectorAll('input').forEach(function (input) {
      input.addEventListener('input', function () {
        setInvalid(input, false);
        UI.formMsg(form, '');
      });
    });
  });

  /* ---------- Вкладки ---------- */
  var tabs = document.querySelectorAll('.tabs__btn');
  function showTab(name) {
    if (!registerForm) return;
    tabs.forEach(function (t) {
      var active = t.getAttribute('data-tab') === name;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    loginForm.hidden = name !== 'login';
    registerForm.hidden = name !== 'register';
    if (history.replaceState) history.replaceState(null, '', name === 'register' ? '#register' : location.pathname);
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { showTab(t.getAttribute('data-tab')); });
  });
  if (location.hash === '#register') showTab('register');

  /* ---------- Вход ---------- */
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = loginForm.email.value.trim();
    var password = loginForm.password.value;
    var btn = loginForm.querySelector('button[type=submit]');

    var bad = false;
    if (!email) { setInvalid(loginForm.email, true); bad = true; }
    if (!password) { setInvalid(loginForm.password, true); bad = true; }
    if (bad) { UI.formMsg(loginForm, 'Введите email и пароль'); return; }

    UI.busy(btn, true, 'Входим…');
    Api.post('/user/login', { email: email, password: password }, { auth: false })
      .then(function (data) {
        if (mode === 'staff' && !Auth.isStaff(data.user)) {
          throw new Error('Этот вход только для сотрудников. Клиенты входят на странице «Личный кабинет».');
        }
        Auth.save(data.token, data.user);
        location.href = Auth.home(data.user);
      })
      .catch(function (err) {
        UI.formMsg(loginForm, err.message);
        UI.busy(btn, false);
      });
  });

  /* ---------- Регистрация ---------- */
  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = registerForm;
      var btn = f.querySelector('button[type=submit]');
      var vals = {
        name: f.name.value.trim(),
        surname: f.surname.value.trim(),
        phone: f.phone.value.trim(),
        email: f.email.value.trim(),
        password: f.password.value
      };

      var bad = false;
      ['name', 'surname', 'phone', 'email', 'password'].forEach(function (k) {
        if (!vals[k]) { setInvalid(f[k], true); bad = true; }
      });
      if (bad) { UI.formMsg(f, 'Заполните все поля'); return; }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) {
        setInvalid(f.email, true);
        UI.formMsg(f, 'Некорректный email');
        return;
      }
      if (vals.password.length < 6) {
        setInvalid(f.password, true);
        UI.formMsg(f, 'Пароль должен быть не короче 6 символов');
        return;
      }
      if (vals.password !== f.password2.value) {
        setInvalid(f.password2, true);
        UI.formMsg(f, 'Пароли не совпадают');
        return;
      }

      UI.busy(btn, true, 'Создаём аккаунт…');
      Api.post('/user/registration', vals, { auth: false })
        .then(function (data) {
          Auth.save(data.token, data.user);
          location.href = Auth.home(data.user);
        })
        .catch(function (err) {
          UI.formMsg(f, err.message);
          UI.busy(btn, false);
        });
    });
  }
})();
