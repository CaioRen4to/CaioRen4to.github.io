/* Portfólio Caio Renato · JS puro, sem dependências nem requisições externas.
   Ordem: recursos essenciais (tema, menu, reveal, abas, conselho, filtros) primeiro;
   o canvas decorativo vem por último e nunca derruba o resto da página. */
(function () {
  'use strict';

  var THEME_KEY = 'cr-portfolio-theme';
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* Sinaliza que o JS carregou (o script do <head> remove a classe "js" se isto nunca rodar). */
  root.classList.add('ready');

  /* ---------- Tema Dark/Light ---------- */
  var themeBtn = $('#theme-toggle');
  if (themeBtn) {
    themeBtn.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'light'));
    themeBtn.addEventListener('click', function () {
      var theme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', theme);
      themeBtn.setAttribute('aria-pressed', String(theme === 'light'));
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* sem armazenamento: só não persiste */ }
    });
  }

  /* ---------- Menu mobile ---------- */
  var menuBtn = $('.menu-btn');
  var nav = $('#nav');
  if (menuBtn && nav) {
    var setMenu = function (open) {
      nav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    };
    menuBtn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  /* ---------- Revelar seções ao rolar ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Frases rotativas do hero ---------- */
  var tagline = $('#tagline');
  if (tagline) {
    var phrases = [];
    try {
      var parsed = JSON.parse(tagline.getAttribute('data-phrases') || '[]');
      if (Array.isArray(parsed)) phrases = parsed.filter(function (p) { return typeof p === 'string' && p; });
    } catch (e) { phrases = []; }
    var phraseIndex = 0;
    if (phrases.length > 1) {
      setInterval(function () {
        if (reduceMotion.matches || document.hidden) return;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        tagline.textContent = phrases[phraseIndex];
        tagline.classList.remove('swap');
        void tagline.offsetWidth; /* reinicia a animação */
        tagline.classList.add('swap');
      }, 3800);
    }
  }

  /* ---------- Pokédex: abas acessíveis ---------- */
  var tabs = $$('[role="tab"]');
  function panelOf(tab) { return document.getElementById(tab.getAttribute('aria-controls')); }
  function countUp(panel) {
    if (!panel) return;
    $$('[data-count]', panel).forEach(function (el) {
      var target = Number(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduceMotion.matches) { el.textContent = target + suffix; return; }
      var start = performance.now();
      (function tick(now) {
        var t = Math.min((now - start) / 900, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))) + (t === 1 ? suffix : '');
        if (t < 1) requestAnimationFrame(tick);
      })(start);
    });
  }
  function selectTab(tab, focus, force) {
    if (!force && tab.getAttribute('aria-selected') === 'true') { if (focus) tab.focus(); return; }
    tabs.forEach(function (t) {
      var on = t === tab;
      var panel = panelOf(t);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
    if (!force) countUp(panelOf(tab));
  }
  if (tabs.length) selectTab(tabs[0], false, true);
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });

  /* ---------- Simulação do Conselho Cego (Fail-Closed) ---------- */
  var verdict = $('#verdict');
  var boxes = $$('input[name="fam"]');
  if (verdict) {
    var updateVerdict = function () {
      var families = boxes.filter(function (b) { return b.checked; }).length;
      verdict.classList.remove('ok', 'no');
      if (families >= 2) {
        verdict.textContent = 'CONSELHO COMPLETO: ' + families + ' famílias distintas.';
        verdict.classList.add('ok');
      } else {
        verdict.textContent = families === 0 ? 'Selecione ao menos duas famílias distintas.' : 'CONSELHO INCOMPLETO: falta mais uma família (Fail-Closed).';
        if (families === 1) verdict.classList.add('no');
      }
    };
    boxes.forEach(function (b) { b.addEventListener('change', updateVerdict); });
  }

  /* ---------- Move Set: filtro por categoria ---------- */
  var filters = $$('.filter');
  var moves = $$('#moves li');
  var statusEl = $('#filter-status');
  var labels = { all: 'todas as categorias', back: 'Backend', front: 'Frontend', data: 'Dados', auto: 'Automação e IA' };
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filters.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      var shown = 0;
      moves.forEach(function (li) {
        var match = f === 'all' || li.getAttribute('data-cat') === f;
        li.classList.toggle('dim', !match);
        if (match) shown += 1;
      });
      if (statusEl) statusEl.textContent = 'Mostrando ' + shown + ' tecnologias de ' + (labels[f] || f) + '.';
    });
  });

  /* ---------- Decorativo: brasas (canvas) e inclinação do Mega Charizard ---------- */
  var canvas = $('#embers');
  var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  var hero = $('.hero');
  if (ctx) {
    var embers = [];
    var heroVisible = true;
    var raf = 0;
    var sizeCanvas = function () {
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      var rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    var spawn = function (w, h, anywhere) {
      return {
        x: w * (0.45 + Math.random() * 0.55), y: anywhere ? Math.random() * h : h + 10,
        r: 1 + Math.random() * 2.4, vy: 0.25 + Math.random() * 0.6, vx: (Math.random() - 0.5) * 0.3,
        a: 0.15 + Math.random() * 0.55, hue: Math.random() > 0.5 ? '34,211,238' : '129,140,248'
      };
    };
    var shouldAnimate = function () { return heroVisible && !document.hidden && !reduceMotion.matches; };
    var drawEmbers = function () {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      embers.forEach(function (p, i) {
        p.y -= p.vy; p.x += p.vx;
        if (p.y < -10) embers[i] = spawn(w, h, false);
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + p.hue + ',' + p.a + ')';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = shouldAnimate() ? requestAnimationFrame(drawEmbers) : 0;
    };
    sizeCanvas();
    var count = canvas.clientWidth < 640 ? 22 : 46;
    for (var i = 0; i < count; i++) embers.push(spawn(canvas.clientWidth, canvas.clientHeight, true));
    drawEmbers();
    window.addEventListener('resize', function () {
      sizeCanvas();
      if (!raf) drawEmbers();
    });
    document.addEventListener('visibilitychange', function () {
      if (shouldAnimate() && !raf) raf = requestAnimationFrame(drawEmbers);
    });
    if ('IntersectionObserver' in window && hero) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        if (shouldAnimate() && !raf) raf = requestAnimationFrame(drawEmbers);
      }).observe(hero);
    }
  }

  var stage = $('#stage');
  var tilt = $('#tilt');
  if (stage && tilt) {
    stage.addEventListener('pointermove', function (e) {
      if (reduceMotion.matches || e.pointerType !== 'mouse') return;
      var r = stage.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = 'rotateY(' + (x * 14).toFixed(1) + 'deg) rotateX(' + (-y * 10).toFixed(1) + 'deg)';
    });
    stage.addEventListener('pointerleave', function () { tilt.style.transform = ''; });
  }
})();
