// يخلي واجهة Apps Script الحالية (Index.html) تشتغل برّه Google:
// كل google.script.run.X(...) يصير طلب للـ API، وتفعيل الواتساب يصير تفعيل إيميل.
(function () {
  var API = window.KK_API;

  function runner(ok, no) {
    var base = {
      withSuccessHandler: function (f) { return runner(f, no); },
      withFailureHandler: function (f) { return runner(ok, f); }
    };
    return new Proxy(base, {
      get: function (t, fn) {
        if (fn in t) return t[fn];
        return function () {
          var args = [].slice.call(arguments);
          fetch(API, { method: 'POST', body: JSON.stringify({ fn: fn, args: args }) })
            .then(function (r) { return r.json(); })
            .then(function (x) { if (x.ok) { if (ok) ok(x.data); } else if (no) no(new Error(x.err)); })
            .catch(function (e) { if (no) no(e); });
        };
      }
    });
  }
  window.google = { script: { run: runner(null, null) } };
  window.kkCall = function (fn) {
    var args = [].slice.call(arguments, 1);
    return new Promise(function (ok, no) { var r = google.script.run.withSuccessHandler(ok).withFailureHandler(no); r[fn].apply(r, args); });
  };

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});

  function toEmail() {
    var box = document.getElementById('waBox');
    if (!box || box.dataset.mail) return;
    box.dataset.mail = '1';
    var sec = box.querySelector('.sec');
    if (sec) sec.innerHTML = 'إشعارات الإيميل<small>EMAIL NOTIFICATIONS</small>';
    var steps = box.querySelector('.steps');
    if (steps) steps.outerHTML = '<p style="margin:0 0 8px;color:var(--mute)">اكتب إيميلك حتى يوصلك الرد على طلبات إجازتك وطلبات البديل. راح توصلك رسالة تجربة.</p>';
    var ph = document.getElementById('waPhone');
    if (ph) { ph.type = 'email'; ph.setAttribute('inputmode', 'email'); ph.setAttribute('dir', 'ltr'); ph.placeholder = 'الإيميل مالك (مثل name@gmail.com)'; }
    var key = document.getElementById('waKey');
    if (key) { key.value = '0'; key.style.display = 'none'; }
    var st = document.getElementById('waState');
    if (st) new MutationObserver(function () {
      var h = st.innerHTML, n = h.replace(/الواتساب/g, 'الإيميل').replace(/تغيير الرقم/g, 'تغيير الإيميل');
      if (n !== h) st.innerHTML = n;
      var b = document.getElementById('waChange');
      if (b) b.onclick = function () { document.getElementById('waForm').classList.remove('hide'); };
    }).observe(st, { childList: true, subtree: true });
  }
  document.addEventListener('DOMContentLoaded', toEmail);
})();
