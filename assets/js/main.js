/* Sergio Janikian 05 — interações da página.
   Tudo é legível sem script e sob movimento reduzido; o script só acrescenta. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- entrada do hero ---------- */
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('m-in'); }); });

  /* ---------- menu (tablet e celular) ---------- */
  var nav = $('.nav'), toggle = $('.nav__toggle');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle) {
    toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    $$('.nav__links a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
  }

  /* ---------- contagem regressiva: 28/11/2026, 9h às 17h (Brasília) ---------- */
  var START = Date.parse('2026-11-28T09:00:00-03:00');
  var END = Date.parse('2026-11-28T17:00:00-03:00');
  var cdBoxes = $$('[data-countdown]');
  var cdText = $('[data-cd-text]');
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  function tickCountdown() {
    var now = Date.now(), diff = Math.max(0, START - now);
    var d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
    var vals = { d: pad(d), h: pad(h), m: pad(m), s: pad(s) };
    cdBoxes.forEach(function (box) {
      $$('[data-cd]', box).forEach(function (b) {
        var v = vals[b.getAttribute('data-cd')];
        if (b.textContent !== v) {
          b.textContent = v;
          if (!reduce) { b.classList.remove('tick'); void b.offsetWidth; b.classList.add('tick'); }
        }
      });
    });
    if (cdText) {
      if (now < START) cdText.textContent = 'Faltam ' + d + 'd ' + h + 'h · 28/11';
      else if (now < END) cdText.textContent = 'Votação aberta até 17h';
      else cdText.textContent = 'Obrigado, Fiel';
    }
    if (now >= START) {
      cdBoxes.forEach(function (box) {
        var label = $('.countdown__label', box);
        if (label) label.textContent = now < END ? 'Votação aberta agora' : 'Eleição encerrada';
      });
    }
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ---------- números que contam ---------- */
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    var to = parseFloat(el.getAttribute('data-count')), suf = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = to + suf; return; }
    var t0 = null, dur = to > 20 ? 1400 : 900;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0' + suf;
    requestAnimationFrame(step);
  }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      if (el.hasAttribute('data-count')) countUp(el);
      if (el.hasAttribute('data-bars')) { el.classList.add('is-in'); $$('[data-count]', el).forEach(countUp); }
      io.unobserve(el);
    });
  }, { threshold: 0.35 }) : null;
  $$('[data-count]').forEach(function (el) { if (io && !el.closest('[data-bars]')) io.observe(el); });
  $$('[data-bars]').forEach(function (el) { if (io && !reduce) { el.setAttribute('data-live', ''); io.observe(el); } });

  /* ---------- pilares que expandem ---------- */
  $$('[data-expand]').forEach(function (list) {
    var items = $$('.pilar', list);
    list.setAttribute('data-ready', '');
    function open(it) { items.forEach(function (x) { x.classList.toggle('is-open', x === it); }); }
    items.forEach(function (it) {
      it.addEventListener('mouseenter', function () { if (fine) open(it); });
      it.addEventListener('focus', function () { open(it); });
      it.addEventListener('click', function () { open(it); });
    });
  });

  /* ---------- abas ---------- */
  function setupTabs(box, onChange) {
    var tabs = $$('[role="tab"]', box);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    function select(i, focus, user) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
        if (on) {
          panels[k].classList.remove('is-enter'); void panels[k].offsetWidth;
          if (!reduce) panels[k].classList.add('is-enter');
          $$('[data-count]', panels[k]).forEach(function (c) { delete c.dataset.done; countUp(c); });
        }
      });
      if (focus) tabs[i].focus();
      if (onChange) onChange(i, user);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, false, true); });
      t.addEventListener('keydown', function (e) {
        var k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (k) { e.preventDefault(); select((i + k + tabs.length) % tabs.length, true, true); }
        if (e.key === 'Home') { e.preventDefault(); select(0, true, true); }
        if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true, true); }
      });
    });
    select(0, false, false);
    return { select: select, count: tabs.length };
  }
  $$('[data-tabs]').forEach(function (box) { setupTabs(box); });

  /* ---------- capítulos do futebol: troca de foto e avanço automático ---------- */
  $$('[data-chapters]').forEach(function (box) {
    var imgs = $$('.caps__fotos img', box);
    var bars = $$('.caps__nav button', box);
    var cur = 0, auto = !reduce, paused = false, visible = false, t0 = 0, DUR = 7000;
    var api = setupTabs(box, function (i, user) {
      cur = i;
      var id = bars[i].getAttribute('aria-controls');
      imgs.forEach(function (im) { im.classList.toggle('is-on', im.getAttribute('data-for') === id); });
      if (user) auto = false;
      bars.forEach(function (b) { b.style.setProperty('--prog', auto ? 0 : 1); });
      t0 = performance.now();
    });
    box.addEventListener('mouseenter', function () { paused = true; });
    box.addEventListener('mouseleave', function () { paused = false; t0 = performance.now() - (parseFloat(bars[cur].style.getPropertyValue('--prog')) || 0) * DUR; });
    box.addEventListener('focusin', function () { paused = true; });
    if (io) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) t0 = performance.now(); }, { threshold: 0.4 }).observe(box);
    function loop(t) {
      if (auto) {
        if (visible && !paused) {
          var p = Math.min(1, (t - t0) / DUR);
          bars[cur].style.setProperty('--prog', p.toFixed(4));
          if (p >= 1) api.select((cur + 1) % api.count, false, false);
        } else if (!visible) { t0 = t - (parseFloat(bars[cur].style.getPropertyValue('--prog')) || 0) * DUR; }
        requestAnimationFrame(loop);
      }
    }
    if (auto) requestAnimationFrame(loop);
  });

  /* ---------- compromissos: número gigante acompanha ---------- */
  var compList = $('[data-comp]'), compBig = $('[data-comp-big]');
  function setComp(i) {
    var items = $$('li', compList);
    if (!items[i] || items[i].classList.contains('is-on')) return;
    items.forEach(function (li, k) { li.classList.toggle('is-on', k === i); });
    compBig.textContent = pad(i + 1);
    if (!reduce) { compBig.classList.remove('swap'); void compBig.offsetWidth; compBig.classList.add('swap'); }
  }
  if (compList && compBig) {
    $$('li', compList).forEach(function (li, i) {
      li.addEventListener('mouseenter', function () { setComp(i); });
      li.addEventListener('focus', function () { setComp(i); });
    });
  }

  /* ---------- frase do manifesto em palavras ---------- */
  var phrase = $('[data-words]'), words = [];
  if (phrase) {
    var text = phrase.textContent.trim();
    phrase.textContent = '';
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text; phrase.appendChild(sr);
    text.split(/\s+/).forEach(function (w, i, all) {
      var s = document.createElement('span');
      s.className = 'w' + (/^(próximas|gerações\.)$/i.test(w) ? ' ouro-w' : '');
      s.setAttribute('aria-hidden', 'true');
      s.textContent = w;
      phrase.appendChild(s);
      if (i < all.length - 1) phrase.appendChild(document.createTextNode(' '));
      words.push(s);
    });
    if (!reduce) root.classList.add('mo-live');
  }

  /* ---------- rolagem: progresso, seção atual, trilha, foto, frase ---------- */
  var bar = $('.nav__progress');
  var trail = $('[data-trail]'), trailItems = trail ? $$('li', trail) : [];
  if (trail && !reduce) trail.setAttribute('data-live', '');
  var develop = $('[data-develop]');
  var sections = $$('main > section[id], footer[id]');
  var navLinks = $$('.nav__link'), dotLinks = $$('.dots a');
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight, sy = window.scrollY, max = document.documentElement.scrollHeight - vh;
    if (bar) bar.style.setProperty('--p', max > 0 ? (sy / max).toFixed(4) : 0);

    var current = sections[0] && sections[0].id;
    sections.forEach(function (s) { if (s.getBoundingClientRect().top <= vh * 0.4) current = s.id; });
    navLinks.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('href') === '#' + current); });
    dotLinks.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('href') === '#' + current); });

    if (trail && !reduce) {
      var r = trail.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (vh * 0.62 - r.top) / r.height));
      trail.style.setProperty('--fill', p.toFixed(3));
      trailItems.forEach(function (li) { li.classList.toggle('is-on', li.getBoundingClientRect().top < vh * 0.62); });
    }
    if (develop && !reduce) {
      var d = develop.getBoundingClientRect();
      var q = Math.min(1, Math.max(0, (vh - d.top) / (vh * 0.85)));
      develop.style.setProperty('--gs', (1 - q).toFixed(3));
      develop.style.setProperty('--ct', (1 + 0.2 * (1 - q)).toFixed(3));
    }
    if (words.length && !reduce) {
      var w = phrase.getBoundingClientRect();
      var k = Math.min(1, Math.max(0, (vh * 0.85 - w.top) / (vh * 0.55)));
      var lit = Math.round(k * words.length);
      words.forEach(function (s, i) { s.classList.toggle('is-on', i < lit); });
    }
    if (compList && fine === false) {
      $$('li', compList).forEach(function (li, i) { var b = li.getBoundingClientRect(); if (b.top < vh * 0.55 && b.bottom > vh * 0.45) setComp(i); });
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();

  /* ---------- hero: luz e profundidade seguem o mouse ---------- */
  var hero = $('.hero');
  if (hero && fine && !reduce) {
    var layers = $$('[data-depth]', hero), glow = $('.hero__glow', hero);
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      glow.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      glow.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      layers.forEach(function (l) {
        var dp = parseFloat(l.getAttribute('data-depth'));
        l.style.transform = 'translate(' + ((x - 0.5) * dp).toFixed(1) + 'px,' + ((y - 0.5) * dp * 0.6).toFixed(1) + 'px)';
      });
    });
    hero.addEventListener('mouseleave', function () { layers.forEach(function (l) { l.style.transform = ''; }); });
  }

  /* ---------- adicionar à agenda (.ics) ---------- */
  var ics = $('[data-ics]');
  if (ics) ics.addEventListener('click', function () {
    var body = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Chapa 05//Corinthians de Verdade//PT', 'BEGIN:VEVENT',
      'UID:eleicao-corinthians-2026-chapa05', 'DTSTAMP:20261123T120000Z',
      'DTSTART:20261128T120000Z', 'DTEND:20261128T200000Z',
      'SUMMARY:Eleição Corinthians – Vote 05, Corinthians de Verdade',
      'LOCATION:Ginásio Wlamir Marques\\, Parque São Jorge\\, São Paulo',
      'DESCRIPTION:Sergio Janikian Presidente. Das 9h às 17h.',
      'BEGIN:VALARM', 'TRIGGER:-PT12H', 'ACTION:DISPLAY', 'DESCRIPTION:Amanhã é dia de votar 05', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }));
    a.download = 'eleicao-corinthians-vote-05.ics';
    document.body.appendChild(a); a.click(); a.remove();
  });

  /* ---------- compartilhar: menu nativo do celular, senão WhatsApp ---------- */
  var share = $('[data-share]');
  if (share && navigator.share && !fine) share.addEventListener('click', function (e) {
    e.preventDefault();
    navigator.share({ title: 'Vote 05 – Corinthians de Verdade', text: 'Eleição 28/11, das 9h às 17h, Ginásio Wlamir Marques, Parque São Jorge.', url: location.href }).catch(function () {});
  });

  /* ---------- barra de ação no celular ---------- */
  var abar = $('.actionbar'), heroCta = $('#cta-hero'), close = $('#votar');
  if (abar && heroCta && io) {
    var heroVis = true, closeVis = false;
    var upd = function () { var hide = heroVis || closeVis; abar.classList.toggle('is-hidden', hide); abar.inert = hide; };
    new IntersectionObserver(function (es) { heroVis = es[0].isIntersecting || es[0].boundingClientRect.top > 0; upd(); }).observe(heroCta);
    new IntersectionObserver(function (es) { closeVis = es[0].isIntersecting; upd(); }, { threshold: 0.1 }).observe(close);
    upd();
  }
})();
