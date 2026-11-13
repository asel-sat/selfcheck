/* Меню сайта самопроверки ОААиККО (отдельный открытый сайт для ППС).
   Подключается одной строкой сразу после <body>:
   <script src="../nav.js"></script>   (на главной: src="nav.js")
   Сайт самостоятельный: ссылок на основной портал ОААиККО в меню нет. */
(function(){
  var MENU = [
    {t:'Главная', href:''},
    {t:'Тестовые задания', href:'tests/'},
    {t:'Письменные/устные задания', href:'written/'},
    {t:'Самопроверка УМКД', href:'umkd/'}
  ];
  var KZ = {'Главная':'Басты бет','Самопроверка':'Өзін-өзі тексеру','Все сервисы самопроверки (рус/қаз)':'Барлық өзін-өзі тексеру сервистері (қаз/орыс)','Тестовые задания':'Тест тапсырмалары','Письменные/устные задания':'Жазбаша/ауызша тапсырмалар','Самопроверка УМКД':'ПОӘК-ті өзін-өзі тексеру','Результаты':'Нәтижелер','Экспертиза УМКД':'ПОӘК сараптамасы','Мониторинговые посещения':'Мониторингтік сабаққа қатысу','Экзаменационные материалы':'Емтихан материалдары','Качество ОП':'БББ сапасы','Материалы':'Материалдар','пароль':'құпиясөз','Разделы сайта самопроверки ОААиККО':'Академиялық талдау және білім сапасын бақылау кеңсесінің өзін-өзі тексеру сайтының бөлімдері','ОААиККО':'Академиялық талдау және білім сапасын бақылау кеңсесі','Офис академической аналитики и контроля качества образования':'Академиялық талдау және білім сапасын бақылау кеңсесі'};
  var isKz = function(){ var l = (document.documentElement.lang || '').toLowerCase(); return l === 'kk' || l === 'kz'; };
  var L = function(x){ return isKz() && KZ[x] ? KZ[x] : x; };
  var me = document.currentScript, base = me.src.replace(/nav\.js(\?.*)?$/, '');
  var here = location.href.split('#')[0].split('?')[0].replace(/index\.html$/, '');
  var url = function(h){ return /^https?:/.test(h) ? h : base + h; };
  var isHere = function(h){ return here === url(h); };
  var css = '.oa-nav{background:#14284a;color:#fff;font:700 13px/1.2 "PT Sans",system-ui,-apple-system,"Segoe UI",Arial,sans-serif;position:relative;z-index:50}'
   + '.oa-nav *{box-sizing:border-box}'
   + '.oa-in{max-width:1280px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:flex;flex-wrap:wrap;align-items:stretch;gap:0 4px}'
   + '.oa-brand{color:#fff;text-decoration:none;padding:10px 12px 10px 0;margin-right:6px;border-right:1px solid rgba(255,255,255,.2);letter-spacing:.04em;display:flex;align-items:center;gap:6px}'
   + '.oa-it{position:relative;display:flex}'
   + '.oa-a,.oa-b{color:#fff;opacity:.82;text-decoration:none;background:none;border:0;border-bottom:3px solid transparent;font:inherit;text-transform:uppercase;letter-spacing:.04em;padding:10px 10px 7px;cursor:pointer;display:flex;align-items:center;gap:5px}'
   + '.oa-a:hover,.oa-b:hover,.oa-it.open>.oa-b{opacity:1}'
   + '.oa-a.on,.oa-b.on{opacity:1;border-bottom-color:#fff}'
   + '.oa-a:focus-visible,.oa-b:focus-visible,.oa-dd a:focus-visible,.oa-brand:focus-visible{outline:2px solid #e2bb5a;outline-offset:-2px}'
   + '.oa-dd{display:none;position:absolute;top:100%;left:0;min-width:300px;background:#fff;color:#1b2230;border:1px solid #d9dde5;border-radius:4px;box-shadow:0 8px 24px rgba(0,0,0,.18);padding:6px 0;font-weight:400;text-transform:none;letter-spacing:0}'
   + '.oa-it.open .oa-dd{display:block}'
   + '.oa-dd a{display:flex;align-items:center;gap:8px;justify-content:space-between;white-space:nowrap;padding:8px 14px;color:inherit;text-decoration:none;font-size:14px}'
   + '.oa-dd a:hover{background:#eef2f9}'
   + '.oa-dd a.on{font-weight:700;background:#eef2f9}'
   + '.oa-lock{font-size:10px;font-weight:700;letter-spacing:.04em;padding:1px 6px;border-radius:8px;background:#fbf1d6;color:#8a6400;text-transform:uppercase}'
   + '@media (prefers-color-scheme:dark){.oa-nav{background:#0d1a31}.oa-dd{background:#1a2029;color:#e3e7ee;border-color:#2d3644}.oa-dd a:hover,.oa-dd a.on{background:#232b36}.oa-lock{background:#2e2711;color:#e2bb5a}}'
   + '@media (max-width:640px){.oa-brand{width:100%;border-right:0;border-bottom:1px solid rgba(255,255,255,.15)}.oa-dd{position:fixed;left:8px;right:8px;top:auto;min-width:0}}'
   + '@media print{.oa-nav{display:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var nav = document.createElement('nav'); nav.className = 'oa-nav'; nav.setAttribute('aria-label', L('Разделы сайта самопроверки ОААиККО'));
  var lastKz = null;
  var render = function(){
    var kz = isKz(); if (kz === lastKz) return; lastKz = kz;
    nav.setAttribute('aria-label', L('Разделы сайта самопроверки ОААиККО'));
    var h = '<div class="oa-in"><a class="oa-brand" href="' + url('') + '" title="' + L('Офис академической аналитики и контроля качества образования') + '">' + L('ОААиККО') + '</a>';
    MENU.forEach(function(m, i){
      if (!m.items) { h += '<div class="oa-it"><a class="oa-a' + (isHere(m.href) ? ' on' : '') + '" href="' + url(m.href) + '">' + L(m.t) + '</a></div>'; return; }
      var on = m.items.some(function(x){ return isHere(x.href); });
      h += '<div class="oa-it"><button class="oa-b' + (on ? ' on' : '') + '" type="button" aria-expanded="false" aria-controls="oa-dd' + i + '">' + L(m.t) + ' ▾</button><div class="oa-dd" id="oa-dd' + i + '">'
        + m.items.map(function(x){ return '<a href="' + url(x.href) + '"' + (isHere(x.href) ? ' class="on" aria-current="page"' : '') + '>' + L(x.t) + (m.lock ? ' <span class="oa-lock">' + L('пароль') + '</span>' : '') + '</a>'; }).join('') + '</div></div>';
    });
    nav.innerHTML = h + '</div>';
  };
  render();
  me.parentNode.insertBefore(nav, me);
  var close = function(except){ nav.querySelectorAll('.oa-it.open').forEach(function(x){ if (x !== except) { x.classList.remove('open'); x.querySelector('.oa-b').setAttribute('aria-expanded', 'false'); } }); };
  nav.addEventListener('click', function(e){ var b = e.target.closest('.oa-b'); if (!b) return; e.stopPropagation(); var it = b.parentNode; close(it); var o = it.classList.toggle('open'); b.setAttribute('aria-expanded', o ? 'true' : 'false'); });
  document.addEventListener('click', function(){ close(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
  try { new MutationObserver(render).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']}); } catch (e) {}
})();
