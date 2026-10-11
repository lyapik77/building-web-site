/* ============================================================
   ЛИЧНЫЙ КАБИНЕТ КЛИЕНТА
   ============================================================ */
(function () {
  var esc = UI.esc;
  var user = Auth.user();

  /* ---------- Защита страницы ---------- */
  if (!Auth.token()) { location.replace('/login'); return; }
  if (Auth.isStaff(user)) { location.replace('/staff'); return; }

  var app = document.getElementById('app');

  /* Обновляем токен и данные пользователя; если токен недействителен — на вход */
  Api.get('/user/auth').then(function (data) {
    Auth.save(data.token, data.user);
    user = data.user;
    if (Auth.isStaff(user)) { location.replace('/staff'); return; }
    start();
  }).catch(function (err) {
    if (err.status === 401) { Auth.logout('/login'); return; }
    UI.toast(err.message, 'error');
  });

  function start() {
    app.hidden = false;
    fillUser();
    loadObjects();
    loadRequests();
  }

  function fillUser() {
    document.getElementById('userName').textContent = user.name + ' ' + user.surname;
    var p = document.getElementById('profileForm');
    p.name.value = user.name || '';
    p.surname.value = user.surname || '';
    p.phone.value = user.phone || '';
    p.email.value = user.email || '';

    var r = document.getElementById('requestForm');
    r.name.value = user.name || '';
    r.phone.value = user.phone || '';
    r.email.value = user.email || '';
  }

  /* ---------- Вкладки ---------- */
  var navBtns = document.querySelectorAll('.cab-nav__btn');
  function showTab(name) {
    if (!document.getElementById('tab-' + name)) name = 'objects';
    navBtns.forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-tab') === name); });
    document.querySelectorAll('.cab-section').forEach(function (s) {
      s.classList.toggle('is-active', s.id === 'tab-' + name);
    });
    if (history.replaceState) history.replaceState(null, '', '#' + name);
  }
  navBtns.forEach(function (b) {
    b.addEventListener('click', function () { showTab(b.getAttribute('data-tab')); });
  });
  showTab(location.hash.replace('#', '') || 'objects');

  document.getElementById('logoutBtn').addEventListener('click', function () { Auth.logout('/login'); });

  function onApiError(err) {
    if (err.status === 401) { Auth.logout('/login'); return; }
    UI.toast(err.message, 'error');
  }

  /* ---------- Объекты ---------- */
  function loadObjects() {
    var box = document.getElementById('objectsList');
    Api.get('/object/my').then(function (items) {
      document.getElementById('cntObjects').textContent = items.length;
      if (!items.length) {
        box.innerHTML = '<div class="empty">За вами пока не закреплено ни одного объекта.<br>' +
          'После заключения договора менеджер привяжет объект к вашему аккаунту.</div>';
        return;
      }
      box.innerHTML = '<div class="cards">' + items.map(function (o) {
        return '<article class="card">' +
          '<div class="card__top"><h3>' + esc(o.name) + '</h3>' + UI.badge(UI.OBJECT_STATUS, o.status) + '</div>' +
          '<div class="card__meta">Адрес: <b>' + esc(o.location) + '</b><br>' +
          'Обновлён: <b>' + UI.fmtDate(o.updatedAt) + '</b></div>' +
          '</article>';
      }).join('') + '</div>';
    }).catch(function (err) {
      box.innerHTML = '<div class="empty">Не удалось загрузить объекты.</div>';
      onApiError(err);
    });
  }

  /* ---------- Заявки ---------- */
  function loadRequests() {
    var box = document.getElementById('requestsList');
    Api.get('/request/my').then(function (items) {
      document.getElementById('cntRequests').textContent = items.length;
      if (!items.length) {
        box.innerHTML = '<div class="empty">Вы ещё не отправляли заявок.<br>Оставьте заявку — мы свяжемся с вами.</div>';
        return;
      }
      box.innerHTML = '<div class="list">' + items.map(function (r) {
        return '<div class="list-item">' +
          '<div class="list-item__main"><span>Заявка №' + r.id + '</span>' +
          '<span class="list-item__sub">' + UI.fmtDate(r.createdAt) + ' · ' + esc(UI.fmtPhone(r.phone)) + '</span></div>' +
          UI.badge(UI.REQUEST_STATUS, r.status) + '</div>';
      }).join('') + '</div>';
    }).catch(function (err) {
      box.innerHTML = '<div class="empty">Не удалось загрузить заявки.</div>';
      onApiError(err);
    });
  }

  var reqForm = document.getElementById('requestForm');
  reqForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = reqForm.querySelector('button[type=submit]');
    var body = {
      name: reqForm.name.value.trim(),
      phone: reqForm.phone.value.trim(),
      email: reqForm.email.value.trim()
    };
    if (!body.name || !body.phone || !body.email) {
      UI.formMsg(reqForm, 'Заполните все поля');
      return;
    }
    UI.busy(btn, true, 'Отправляем…');
    Api.post('/request/createRequest', body).then(function () {
      UI.formMsg(reqForm, 'Заявка отправлена. Мы скоро свяжемся с вами.', true);
      UI.toast('Заявка отправлена');
      loadRequests();
    }).catch(function (err) {
      UI.formMsg(reqForm, err.message);
    }).then(function () { UI.busy(btn, false); });
  });

  /* ---------- Профиль ---------- */
  var profileForm = document.getElementById('profileForm');
  profileForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = profileForm.querySelector('button[type=submit]');
    var body = {
      name: profileForm.name.value.trim(),
      surname: profileForm.surname.value.trim(),
      phone: profileForm.phone.value.trim()
    };
    if (!body.name || !body.surname || !body.phone) {
      UI.formMsg(profileForm, 'Заполните все поля');
      return;
    }
    UI.busy(btn, true, 'Сохраняем…');
    Api.put('/user/me', body).then(function (data) {
      user = data.user;
      Auth.save(Auth.token(), user);
      fillUser();
      UI.formMsg(profileForm, 'Данные сохранены', true);
    }).catch(function (err) {
      UI.formMsg(profileForm, err.message);
    }).then(function () { UI.busy(btn, false); });
  });

  var pwForm = document.getElementById('passwordForm');
  pwForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = pwForm.querySelector('button[type=submit]');
    var oldPassword = pwForm.oldPassword.value;
    var newPassword = pwForm.newPassword.value;
    if (!oldPassword || !newPassword) { UI.formMsg(pwForm, 'Заполните все поля'); return; }
    if (newPassword.length < 6) { UI.formMsg(pwForm, 'Новый пароль должен быть не короче 6 символов'); return; }
    if (newPassword !== pwForm.newPassword2.value) { UI.formMsg(pwForm, 'Пароли не совпадают'); return; }
    UI.busy(btn, true, 'Сохраняем…');
    Api.put('/user/me/password', { oldPassword: oldPassword, newPassword: newPassword }).then(function () {
      pwForm.reset();
      UI.formMsg(pwForm, 'Пароль изменён', true);
    }).catch(function (err) {
      UI.formMsg(pwForm, err.message);
    }).then(function () { UI.busy(btn, false); });
  });
})();
