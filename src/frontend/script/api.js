/* ============================================================
   API-КЛИЕНТ, СЕССИЯ И ОБЩИЕ УТИЛИТЫ
   Подключается на всех страницах, которые работают с бэком.

   Адрес API:
   - если страница открыта с сервера бэка (http://localhost:4000) — берётся /api;
   - иначе можно указать явно: <meta name="api-base" content="http://localhost:4000/api">
   ============================================================ */
(function (w) {
  var TOKEN_KEY = 'vysota_token';
  var USER_KEY = 'vysota_user';

  var metaBase = document.querySelector('meta[name="api-base"]');
  var BASE = (metaBase && metaBase.content) ||
    (location.protocol === 'file:' ? 'http://localhost:4000/api' : '/api');

  /* ---------- Сессия ---------- */
  var Auth = {
    token: function () {
      try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
    },
    user: function () {
      try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (e) { return null; }
    },
    save: function (token, user) {
      try {
        localStorage.setItem(TOKEN_KEY, token);
        if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      } catch (e) {}
    },
    clear: function () {
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } catch (e) {}
    },
    isStaff: function (user) {
      return !!user && (user.role === 'ADMIN' || user.role === 'MANAGER');
    },
    home: function (user) {
      return Auth.isStaff(user) ? '/staff' : '/account';
    },
    logout: function (to) {
      Auth.clear();
      location.href = to || '/login';
    }
  };

  /* ---------- HTTP ---------- */
  function ApiError(message, status) {
    this.name = 'ApiError';
    this.message = message;
    this.status = status;
  }
  ApiError.prototype = Object.create(Error.prototype);

  function request(method, path, body, opts) {
    opts = opts || {};
    var headers = { 'Content-Type': 'application/json' };
    var token = Auth.token();
    if (token && opts.auth !== false) headers['Authorization'] = 'Bearer ' + token;

    return fetch(BASE + path, {
      method: method,
      headers: headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    }).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
        if (!res.ok) {
          var msg = (data && data.message) || 'Ошибка запроса (' + res.status + ')';
          throw new ApiError(msg, res.status);
        }
        return data;
      });
    }, function () {
      throw new ApiError('Нет связи с сервером. Попробуйте позже.', 0);
    });
  }

  var Api = {
    base: BASE,
    get: function (p, o) { return request('GET', p, undefined, o); },
    post: function (p, b, o) { return request('POST', p, b || {}, o); },
    put: function (p, b, o) { return request('PUT', p, b || {}, o); },
    del: function (p, o) { return request('DELETE', p, undefined, o); }
  };

  /* ---------- Утилиты интерфейса ---------- */
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ESC[c]; });
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  function fmtPhone(p) {
    var d = String(p == null ? '' : p).replace(/\D/g, '');
    if (d.length === 11 && (d[0] === '7' || d[0] === '8')) {
      return '+7 (' + d.slice(1, 4) + ') ' + d.slice(4, 7) + '-' + d.slice(7, 9) + '-' + d.slice(9);
    }
    return p || '—';
  }

  var REQUEST_STATUS = {
    Waiting: { label: 'Ожидает', cls: 'badge--wait' },
    Processed: { label: 'Обработана', cls: 'badge--ok' }
  };
  var OBJECT_STATUS = {
    inProcess: { label: 'В работе', cls: 'badge--work' },
    Completed: { label: 'Завершён', cls: 'badge--ok' },
    Suspended: { label: 'Приостановлен', cls: 'badge--wait' },
    Closed: { label: 'Закрыт', cls: 'badge--off' }
  };
  var ROLE = { USER: 'Клиент', MANAGER: 'Менеджер', ADMIN: 'Администратор' };

  function badge(map, key) {
    var s = map[key] || { label: key || '—', cls: 'badge--off' };
    return '<span class="badge ' + s.cls + '">' + esc(s.label) + '</span>';
  }

  var toastTimer;
  function toast(message, type) {
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.className = 'toast is-visible' + (type === 'error' ? ' toast--error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 3600);
  }

  /** Показывает ошибку под формой (элемент .form-msg) */
  function formMsg(form, text, ok) {
    var el = form.querySelector('.form-msg');
    if (!el) return;
    el.textContent = text || '';
    el.className = 'form-msg' + (text ? (ok ? ' is-ok' : ' is-error') : '');
  }

  function busy(btn, on, label) {
    if (!btn) return;
    if (on) {
      btn.dataset.label = btn.textContent;
      btn.disabled = true;
      if (label) btn.textContent = label;
    } else {
      btn.disabled = false;
      if (btn.dataset.label) btn.textContent = btn.dataset.label;
    }
  }

  w.Api = Api;
  w.Auth = Auth;
  w.UI = {
    esc: esc,
    fmtDate: fmtDate,
    fmtPhone: fmtPhone,
    badge: badge,
    toast: toast,
    formMsg: formMsg,
    busy: busy,
    REQUEST_STATUS: REQUEST_STATUS,
    OBJECT_STATUS: OBJECT_STATUS,
    ROLE: ROLE
  };
})(window);
