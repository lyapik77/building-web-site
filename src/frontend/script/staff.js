/* ============================================================
   ПАНЕЛЬ МЕНЕДЖЕРА И АДМИНИСТРАТОРА
   Менеджер: заявки, объекты (создание, статусы, привязка клиентов), список пользователей.
   Администратор дополнительно: удаление, смена ролей, создание пользователей.
   ============================================================ */
(function () {
  var esc = UI.esc;
  var me = Auth.user();

  /* ---------- Защита страницы ---------- */
  if (!Auth.token() || !Auth.isStaff(me)) { location.replace('/staff-login'); return; }

  var isAdmin = false;
  var state = { requests: [], objects: [], users: [] };

  Api.get('/user/auth').then(function (data) {
    Auth.save(data.token, data.user);
    me = data.user;
    if (!Auth.isStaff(me)) { Auth.logout('/staff-login'); return; }
    start();
  }).catch(function (err) {
    if (err.status === 401) { Auth.logout('/staff-login'); return; }
    UI.toast(err.message, 'error');
  });

  function onApiError(err) {
    if (err.status === 401) { Auth.logout('/staff-login'); return; }
    UI.toast(err.message, 'error');
  }

  function start() {
    isAdmin = me.role === 'ADMIN';
    document.getElementById('app').hidden = false;
    document.getElementById('userName').textContent = me.name + ' ' + me.surname;
    document.getElementById('userRole').textContent = UI.ROLE[me.role];
    document.getElementById('newUserBtn').hidden = !isAdmin;
    if (!isAdmin) {
      document.getElementById('usersHint').textContent = 'Клиенты и сотрудники компании (просмотр).';
    }
    loadRequests();
    loadObjects();
    loadUsers();
  }

  document.getElementById('logoutBtn').addEventListener('click', function () { Auth.logout('/staff-login'); });

  /* ---------- Вкладки ---------- */
  var navBtns = document.querySelectorAll('.cab-nav__btn');
  function showTab(name) {
    if (!document.getElementById('tab-' + name)) name = 'requests';
    navBtns.forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-tab') === name); });
    document.querySelectorAll('.cab-section').forEach(function (s) {
      s.classList.toggle('is-active', s.id === 'tab-' + name);
    });
    if (history.replaceState) history.replaceState(null, '', '#' + name);
  }
  navBtns.forEach(function (b) {
    b.addEventListener('click', function () { showTab(b.getAttribute('data-tab')); });
  });
  showTab(location.hash.replace('#', '') || 'requests');

  /* ---------- Утилиты ---------- */
  function empty(cols, text) {
    return '<tr><td colspan="' + cols + '" class="loading">' + text + '</td></tr>';
  }
  function options(map, current) {
    return Object.keys(map).map(function (k) {
      return '<option value="' + k + '"' + (k === current ? ' selected' : '') + '>' + esc(map[k].label) + '</option>';
    }).join('');
  }
  function includes(haystack, q) {
    return String(haystack || '').toLowerCase().indexOf(q) !== -1;
  }
  function idOf(el) {
    return el.closest('[data-id]').getAttribute('data-id');
  }

  /* Диалоги */
  document.querySelectorAll('dialog [data-close]').forEach(function (b) {
    b.addEventListener('click', function () { b.closest('dialog').close(); });
  });
  function openDialog(dlg) {
    var form = dlg.querySelector('form');
    form.reset();
    UI.formMsg(form, '');
    dlg.showModal();
    var first = form.querySelector('input');
    if (first) first.focus();
  }

  /* ============================================================
     ЗАЯВКИ
     ============================================================ */
  function loadRequests() {
    return Api.get('/request/getRequest').then(function (items) {
      state.requests = items;
      document.getElementById('cntRequests').textContent = items.length;
      renderRequests();
    }).catch(function (err) {
      document.getElementById('requestsBody').innerHTML = empty(6, 'Не удалось загрузить заявки');
      onApiError(err);
    });
  }

  function renderRequests() {
    var q = document.getElementById('reqSearch').value.trim().toLowerCase();
    var st = document.getElementById('reqFilter').value;
    var all = state.requests;

    var waiting = all.filter(function (r) { return r.status === 'Waiting'; }).length;
    document.getElementById('requestStats').innerHTML =
      '<div class="stat"><b>' + all.length + '</b><span>Всего</span></div>' +
      '<div class="stat"><b>' + waiting + '</b><span>Ожидают</span></div>' +
      '<div class="stat"><b>' + (all.length - waiting) + '</b><span>Обработаны</span></div>';

    var rows = all.filter(function (r) {
      if (st && r.status !== st) return false;
      if (!q) return true;
      return includes(r.name, q) || includes(r.email, q) || includes(r.phone, q) || includes(UI.fmtPhone(r.phone), q);
    });

    var body = document.getElementById('requestsBody');
    if (!rows.length) {
      body.innerHTML = empty(6, all.length ? 'Ничего не найдено' : 'Заявок пока нет');
      return;
    }
    body.innerHTML = rows.map(function (r) {
      return '<tr data-id="' + r.id + '">' +
        '<td class="num">' + r.id + '</td>' +
        '<td>' + UI.fmtDate(r.createdAt) + '</td>' +
        '<td>' + esc(r.name) + (r.UserId ? '<span class="sub">клиент с аккаунтом</span>' : '') + '</td>' +
        '<td>' + esc(UI.fmtPhone(r.phone)) + '<span class="sub">' + esc(r.email) + '</span></td>' +
        '<td><select data-act="req-status" aria-label="Статус заявки">' + options(UI.REQUEST_STATUS, r.status) + '</select></td>' +
        '<td class="actions">' + (isAdmin ? '<button class="link-btn link-btn--danger" data-act="req-delete" type="button">Удалить</button>' : '') + '</td>' +
        '</tr>';
    }).join('');
  }

  document.getElementById('reqSearch').addEventListener('input', renderRequests);
  document.getElementById('reqFilter').addEventListener('change', renderRequests);

  document.getElementById('requestsBody').addEventListener('change', function (e) {
    if (e.target.getAttribute('data-act') !== 'req-status') return;
    var id = idOf(e.target);
    var status = e.target.value;
    Api.put('/request/updateStatus/' + id, { status: status }).then(function () {
      state.requests.forEach(function (r) { if (String(r.id) === id) r.status = status; });
      renderRequests();
      UI.toast('Статус заявки №' + id + ' обновлён');
    }).catch(function (err) { onApiError(err); renderRequests(); });
  });

  document.getElementById('requestsBody').addEventListener('click', function (e) {
    if (e.target.getAttribute('data-act') !== 'req-delete') return;
    var id = idOf(e.target);
    if (!confirm('Удалить заявку №' + id + '? Это действие нельзя отменить.')) return;
    Api.del('/request/' + id).then(function () {
      UI.toast('Заявка удалена');
      return loadRequests();
    }).catch(onApiError);
  });

  /* ============================================================
     ОБЪЕКТЫ
     ============================================================ */
  function loadObjects() {
    return Api.get('/object/findAll').then(function (items) {
      state.objects = items;
      document.getElementById('cntObjects').textContent = items.length;
      renderObjects();
    }).catch(function (err) {
      document.getElementById('objectsBody').innerHTML = empty(5, 'Не удалось загрузить объекты');
      onApiError(err);
    });
  }

  function renderObjects() {
    var q = document.getElementById('objSearch').value.trim().toLowerCase();
    var st = document.getElementById('objFilter').value;
    var rows = state.objects.filter(function (o) {
      if (st && o.status !== st) return false;
      return !q || includes(o.name, q) || includes(o.location, q);
    });

    var body = document.getElementById('objectsBody');
    if (!rows.length) {
      body.innerHTML = empty(5, state.objects.length ? 'Ничего не найдено' : 'Объектов пока нет. Создайте первый.');
      return;
    }
    body.innerHTML = rows.map(function (o) {
      var chips = (o.users || []).map(function (u) {
        return '<span class="chip" data-user="' + u.id + '" title="' + esc(u.email) + '">' +
          esc(u.name + ' ' + u.surname) +
          '<button type="button" data-act="obj-unlink" aria-label="Отвязать клиента">×</button></span>';
      }).join('');
      return '<tr data-id="' + o.id + '">' +
        '<td class="num">' + o.id + '</td>' +
        '<td>' + esc(o.name) + '<span class="sub">' + esc(o.location) + '</span></td>' +
        '<td><select data-act="obj-status" aria-label="Статус объекта">' + options(UI.OBJECT_STATUS, o.status) + '</select></td>' +
        '<td><div class="chips">' + chips +
        '<button class="link-btn" data-act="obj-link" type="button">+ привязать клиента</button></div></td>' +
        '<td class="actions">' + (isAdmin ? '<button class="link-btn link-btn--danger" data-act="obj-delete" type="button">Удалить</button>' : '') + '</td>' +
        '</tr>';
    }).join('');
  }

  document.getElementById('objSearch').addEventListener('input', renderObjects);
  document.getElementById('objFilter').addEventListener('change', renderObjects);

  var objBody = document.getElementById('objectsBody');
  var linkObjectId = null;

  objBody.addEventListener('change', function (e) {
    if (e.target.getAttribute('data-act') !== 'obj-status') return;
    var id = idOf(e.target);
    var status = e.target.value;
    Api.put('/object/update/' + id, { status: status }).then(function () {
      state.objects.forEach(function (o) { if (String(o.id) === id) o.status = status; });
      UI.toast('Статус объекта обновлён');
    }).catch(function (err) { onApiError(err); renderObjects(); });
  });

  objBody.addEventListener('click', function (e) {
    var act = e.target.getAttribute('data-act');
    if (!act) return;
    var id = idOf(e.target);

    if (act === 'obj-link') {
      linkObjectId = id;
      var obj = state.objects.filter(function (o) { return String(o.id) === id; })[0];
      document.getElementById('linkTitle').textContent = 'Привязать клиента к «' + (obj ? obj.name : '') + '»';
      var linked = (obj && obj.users || []).map(function (u) { return u.id; });
      document.getElementById('clientEmails').innerHTML = state.users
        .filter(function (u) { return u.role === 'USER' && linked.indexOf(u.id) === -1; })
        .map(function (u) {
          return '<option value="' + esc(u.email) + '">' + esc(u.name + ' ' + u.surname) + '</option>';
        }).join('');
      openDialog(document.getElementById('linkDialog'));
    }

    if (act === 'obj-unlink') {
      var userId = e.target.closest('.chip').getAttribute('data-user');
      if (!confirm('Отвязать клиента от объекта?')) return;
      Api.del('/object/' + id + '/users/' + userId).then(function () {
        UI.toast('Клиент отвязан');
        return loadObjects();
      }).catch(onApiError);
    }

    if (act === 'obj-delete') {
      if (!confirm('Удалить объект №' + id + '? Это действие нельзя отменить.')) return;
      Api.del('/object/' + id).then(function () {
        UI.toast('Объект удалён');
        return loadObjects();
      }).catch(onApiError);
    }
  });

  /* Новый объект */
  document.getElementById('newObjectBtn').addEventListener('click', function () {
    openDialog(document.getElementById('objectDialog'));
  });
  var objectForm = document.getElementById('objectForm');
  objectForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = objectForm.querySelector('button[type=submit]');
    var body = { name: objectForm.name.value.trim(), location: objectForm.location.value.trim() };
    if (!body.name || !body.location) { UI.formMsg(objectForm, 'Заполните название и адрес'); return; }
    UI.busy(btn, true, 'Создаём…');
    Api.post('/object/create', body).then(function () {
      document.getElementById('objectDialog').close();
      UI.toast('Объект создан');
      return loadObjects();
    }).catch(function (err) { UI.formMsg(objectForm, err.message); })
      .then(function () { UI.busy(btn, false); });
  });

  /* Привязка клиента */
  var linkForm = document.getElementById('linkForm');
  linkForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = linkForm.querySelector('button[type=submit]');
    var email = linkForm.email.value.trim();
    if (!email) { UI.formMsg(linkForm, 'Введите email клиента'); return; }
    UI.busy(btn, true, 'Привязываем…');
    Api.post('/object/' + linkObjectId + '/users', { email: email }).then(function () {
      document.getElementById('linkDialog').close();
      UI.toast('Клиент привязан к объекту');
      return loadObjects();
    }).catch(function (err) { UI.formMsg(linkForm, err.message); })
      .then(function () { UI.busy(btn, false); });
  });

  /* ============================================================
     ПОЛЬЗОВАТЕЛИ
     ============================================================ */
  function loadUsers() {
    return Api.post('/user/users').then(function (items) {
      state.users = items;
      document.getElementById('cntUsers').textContent = items.length;
      renderUsers();
    }).catch(function (err) {
      document.getElementById('usersBody').innerHTML = empty(6, 'Не удалось загрузить пользователей');
      onApiError(err);
    });
  }

  function renderUsers() {
    var q = document.getElementById('userSearch').value.trim().toLowerCase();
    var role = document.getElementById('userFilter').value;
    var rows = state.users.filter(function (u) {
      if (role && u.role !== role) return false;
      return !q || includes(u.name + ' ' + u.surname, q) || includes(u.email, q);
    });

    var body = document.getElementById('usersBody');
    if (!rows.length) {
      body.innerHTML = empty(6, state.users.length ? 'Ничего не найдено' : 'Пользователей нет');
      return;
    }
    body.innerHTML = rows.map(function (u) {
      var self = u.id === me.id;
      var roleCell;
      if (isAdmin && !self) {
        roleCell = '<select data-act="user-role" aria-label="Роль">' +
          Object.keys(UI.ROLE).map(function (k) {
            return '<option value="' + k + '"' + (k === u.role ? ' selected' : '') + '>' + esc(UI.ROLE[k]) + '</option>';
          }).join('') + '</select>';
      } else {
        roleCell = '<span class="badge ' + (u.role === 'USER' ? 'badge--off' : 'badge--work') + '">' + esc(UI.ROLE[u.role]) + '</span>';
      }
      return '<tr data-id="' + u.id + '">' +
        '<td class="num">' + u.id + '</td>' +
        '<td>' + esc(u.name + ' ' + u.surname) + (self ? ' <span class="sub">это вы</span>' : '') +
        '<span class="sub">' + esc(u.email) + '</span></td>' +
        '<td>' + esc(UI.fmtPhone(u.phone)) + '</td>' +
        '<td>' + roleCell + '</td>' +
        '<td>' + UI.fmtDate(u.createdAt) + '</td>' +
        '<td class="actions">' + (isAdmin && !self ? '<button class="link-btn link-btn--danger" data-act="user-delete" type="button">Удалить</button>' : '') + '</td>' +
        '</tr>';
    }).join('');
  }

  document.getElementById('userSearch').addEventListener('input', renderUsers);
  document.getElementById('userFilter').addEventListener('change', renderUsers);

  var usersBody = document.getElementById('usersBody');
  usersBody.addEventListener('change', function (e) {
    if (e.target.getAttribute('data-act') !== 'user-role') return;
    var id = idOf(e.target);
    var role = e.target.value;
    if (!confirm('Изменить роль пользователя на «' + UI.ROLE[role] + '»?')) { renderUsers(); return; }
    Api.put('/user/' + id + '/role', { role: role }).then(function () {
      UI.toast('Роль обновлена');
      return loadUsers();
    }).catch(function (err) { onApiError(err); renderUsers(); });
  });

  usersBody.addEventListener('click', function (e) {
    if (e.target.getAttribute('data-act') !== 'user-delete') return;
    var id = idOf(e.target);
    if (!confirm('Удалить пользователя №' + id + '? Это действие нельзя отменить.')) return;
    Api.del('/user/' + id).then(function () {
      UI.toast('Пользователь удалён');
      return Promise.all([loadUsers(), loadObjects(), loadRequests()]);
    }).catch(onApiError);
  });

  /* Новый пользователь (ADMIN) */
  document.getElementById('newUserBtn').addEventListener('click', function () {
    openDialog(document.getElementById('userDialog'));
  });
  var userForm = document.getElementById('userForm');
  userForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = userForm.querySelector('button[type=submit]');
    var body = {
      name: userForm.name.value.trim(),
      surname: userForm.surname.value.trim(),
      phone: userForm.phone.value.trim(),
      email: userForm.email.value.trim(),
      password: userForm.password.value,
      role: userForm.role.value
    };
    if (!body.name || !body.surname || !body.phone || !body.email || !body.password) {
      UI.formMsg(userForm, 'Заполните все поля');
      return;
    }
    if (body.password.length < 6) { UI.formMsg(userForm, 'Пароль должен быть не короче 6 символов'); return; }
    UI.busy(btn, true, 'Создаём…');
    Api.post('/user/create', body).then(function () {
      document.getElementById('userDialog').close();
      UI.toast('Пользователь создан');
      return loadUsers();
    }).catch(function (err) { UI.formMsg(userForm, err.message); })
      .then(function () { UI.busy(btn, false); });
  });
})();
