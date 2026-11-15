(() => {
  'use strict';
  const root = document.documentElement;
  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove('is-loading'); return; }
  root.classList.remove('no-js');
  gsap.registerPlugin(ScrollTrigger);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t = s => (reduce ? 0 : s);
  const $ = (s, r = document) => r.querySelector(s);
  const small = () => innerWidth < 900;
  const hero = $('#hero'), plot = $('#uchastok');
  const rail = c => root.style.setProperty('--rail-ink', c);
  if (reduce) root.classList.remove('is-loading');

  /* ---------- Шкала ---------- */
  const thermo = $('.thermo'), numEl = $('.thermo__num'), labelEl = $('.thermo__label');
  for (let i = 0; i < 14; i++) {
    const tick = document.createElement('i');
    tick.style.setProperty('--k', i / 13);
    if (i % 5 === 0) tick.className = 'is-long';
    $('.thermo__scale').append(tick);
  }
  const th = { v: -27 };
  const renderT = () => {
    const v = Math.round(th.v);
    numEl.textContent = (v < 0 ? '−' : v > 0 ? '+' : '') + Math.abs(v) + '°';
    thermo.style.setProperty('--f', Math.min(1, Math.max(0, (th.v + 30) / 130)).toFixed(4));
  };
  window.setTemp = (value, label) => {
    labelEl.textContent = label;
    gsap.to(th, { v: value, duration: t(0.6), ease: 'power2.out', overwrite: true, onUpdate: renderT });
  };
  renderT();

  /* ---------- Иней ---------- */
  const frostEl = $('.frost'), ctx = frostEl.getContext('2d');
  const mk = () => document.createElement('canvas');
  const fs = { open: 0, k: 0 };
  let W = 0, H = 0, sc = 1, tex = null, trail = null, tctx = null, frame = 0;

  const rStart = () => Math.min(innerWidth, innerHeight) * (small() ? 0.30 : 0.24);
  const rEnd = () => Math.hypot(hero.clientWidth, hero.clientHeight) * 0.8;
  const radius = () => ((1 - fs.k) * fs.open * rStart() + fs.k * rEnd()) * sc;

  function fern(g) {
    const e = Math.random() * 4 | 0, u = Math.random();
    let x = e < 2 ? u * W : (e === 2 ? 0 : W);
    let y = e < 2 ? (e === 0 ? 0 : H) : u * H;
    let a = Math.atan2(H / 2 - y, W / 2 - x) + (Math.random() - 0.5);
    const n = 6 + (Math.random() * 5 | 0), branches = new Set();
    while (branches.size < 2 + (Math.random() * 3 | 0)) branches.add(1 + (Math.random() * (n - 1) | 0));
    g.beginPath();
    g.moveTo(x, y);
    for (let i = 1; i <= n; i++) {
      a += (Math.random() - 0.5) * 0.5;
      const l = (14 + Math.random() * 20) * sc;
      x += Math.cos(a) * l; y += Math.sin(a) * l;
      g.lineTo(x, y);
      if (branches.has(i)) {
        const ba = a + (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.5), bl = (8 + Math.random() * 10) * sc;
        g.lineTo(x + Math.cos(ba) * bl, y + Math.sin(ba) * bl);
        g.moveTo(x, y);
      }
    }
    g.stroke();
  }

  function frostTexture() {
    const c = mk(); c.width = W; c.height = H;
    const g = c.getContext('2d'), mobile = small();
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(198,214,228,.97)');
    grad.addColorStop(1, 'rgba(138,165,191,.97)');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff';
    for (let i = 0; i < (mobile ? 600 : 1400); i++) {
      g.globalAlpha = 0.08 + Math.random() * 0.27;
      g.beginPath(); g.arc(Math.random() * W, Math.random() * H, (0.5 + Math.random() * 1.7) * sc, 0, 6.2832); g.fill();
    }
    g.globalAlpha = 1; g.strokeStyle = 'rgba(255,255,255,.38)'; g.lineWidth = sc; g.lineCap = 'round';
    for (let i = 0; i < (mobile ? 40 : 90); i++) fern(g);
    const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) / 2);
    v.addColorStop(0, 'rgba(62,92,128,0)'); v.addColorStop(1, 'rgba(62,92,128,.42)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    return c;
  }

  function blob(g, x, y, r, a) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function draw() {
    if (!tex || !W || !H) return;
    const time = reduce ? 0 : performance.now() / 1000;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(tex, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(trail, 0, 0);
    const R = radius();
    if (R > 1) {
      const cx = W * (small() ? 0.5 : 0.62), cy = H * (small() ? 0.36 : 0.44);
      for (let i = 0; i < 10; i++) {
        const ang = (i - 1) / 9 * 6.2832, off = i ? 0.42 * R : 0;
        blob(ctx, cx + Math.cos(ang) * off, cy + Math.sin(ang) * off, R * (0.62 + 0.08 * Math.sin(time * 0.7 + i * 1.3)), 1);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    // «замерзание» следа: 0.012 каждый кадр, собрано в 0.048 раз в 4 кадра — иначе 8-битная альфа залипает на ~16%
    if (!reduce && (++frame & 3) === 0) {
      tctx.globalCompositeOperation = 'destination-out';
      tctx.fillStyle = 'rgba(0,0,0,.048)';
      tctx.fillRect(0, 0, W, H);
      tctx.globalCompositeOperation = 'source-over';
    }
  }

  function build() {
    sc = Math.min(devicePixelRatio || 1, 1.5);
    const nw = Math.round(hero.clientWidth * sc), nh = Math.round(hero.clientHeight * sc);
    if (tex && nw === W && nh === H) return;
    // вкладка в фоне или ещё не разложена: размеры 0 — ждём resize, иначе drawImage падает и останавливает весь скрипт
    if (!nw || !nh) { tex = null; return; }
    W = frostEl.width = nw; H = frostEl.height = nh;
    tex = frostTexture();
    trail = mk(); trail.width = W; trail.height = H; tctx = trail.getContext('2d');
    draw();
  }
  build();

  if (matchMedia('(pointer: fine)').matches && !reduce) {
    let lx = null, ly = 0;
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
      const n = lx === null ? 1 : Math.ceil(Math.hypot(x - lx, y - ly) / (24 * sc));
      for (let i = 1; i <= n; i++) blob(tctx, lx === null ? x : lx + (x - lx) * i / n, lx === null ? y : ly + (y - ly) * i / n, 74 * sc, 0.55);
      lx = x; ly = y;
    });
    hero.addEventListener('pointerleave', () => { lx = null; });
  }

  let raf = 0, inView = true;
  const tick = () => { raf = 0; draw(); sync(); };
  const sync = () => {
    const on = inView && !document.hidden && !reduce;
    if (on && !raf) raf = requestAnimationFrame(tick);
    else if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }).observe(hero);
  document.addEventListener('visibilitychange', sync);
  sync();

  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { build(); if (reduce) draw(); }, 150); });
  // размер Hero может появиться без события resize (вкладка была скрыта)
  if ('ResizeObserver' in window) new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { build(); if (reduce) draw(); }, 150); }).observe(hero);

  /* ---------- Открытие ---------- */
  const h1 = $('h1', hero), lines = gsap.utils.toArray('.line__in', h1);
  const late = [$('.topbar', hero), $('.hero__lead'), $('.hero__row'), $('.hero__hint')];

  function intro() {
    const r = h1.getBoundingClientRect();
    gsap.set(h1, { autoAlpha: 1, x: innerWidth / 2 - (r.left + r.width / 2), y: innerHeight / 2 - (r.top + r.height / 2), scale: 1 });
    gsap.set(lines, { yPercent: 110 });
    gsap.set(late, { autoAlpha: 0, y: 14 });
    gsap.timeline()
      .to(lines, { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.08 }, 0)
      .to(h1, { x: 0, y: 0, duration: 1, ease: 'power3.inOut' }, 1.05)
      .to(fs, { open: 1, duration: 1.3, ease: 'power2.out' }, 1.05)
      .call(() => root.classList.remove('is-loading'), null, 2.05)
      .to(late, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 }, 1.95);
  }
  if (reduce) { fs.open = 1; draw(); }
  else Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]).then(intro);

  if (!reduce) gsap.to('.arrow', { y: 4, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  /* ---------- Прокрутка Hero ---------- */
  const hp = { p: 0 };
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: hero, start: 'top top', end: '+=70%', pin: true, scrub: 0.6, onEnterBack: () => rail('var(--night)') }
  })
    .to(hp, { p: 1, duration: 1, onUpdate: () => { const u = Math.max(0, (hp.p - 0.25) / 0.75); fs.k = u * u; if (reduce) draw(); } }, 0)
    .to('.hero__fade', { autoAlpha: 0, y: -24, duration: 0.4 }, 0.6);

  /* ---------- Стадии сцены ---------- */
  const stages = gsap.utils.toArray('.stage');
  const temps = [[-27, 'улица'], [24, 'дом'], [90, 'парная'], [38, 'чан']];
  const stageOf = p => (p < 0.30 ? 0 : p < 0.55 ? 1 : p < 0.80 ? 2 : 3);
  let cur = 0;
  gsap.set(stages, { autoAlpha: 0 });
  gsap.set(stages[0], { autoAlpha: 1 });

  function goStage(i) {
    const out = stages[cur], inn = stages[i];
    cur = i;
    plot.dataset.stage = i;
    gsap.killTweensOf([out, inn]);
    gsap.to(out, { autoAlpha: 0, y: -10, duration: t(0.45), ease: 'power3.out' });
    gsap.fromTo(inn, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: t(0.45), ease: 'power3.out' });
    setTemp(...temps[i]);
  }

  const pp = { p: 0 };
  gsap.to(pp, {
    p: 1, ease: 'none',
    scrollTrigger: {
      id: 'plot', trigger: plot, start: 'top top', end: '+=400%', pin: true, scrub: 0.8,
      onEnter: () => rail('var(--ink-night)'), onEnterBack: () => rail('var(--ink-night)')
    },
    onUpdate: () => {
      const s = stageOf(pp.p);
      if (s !== cur) goStage(s);
      window.dispatchEvent(new CustomEvent('plot:progress', { detail: { p: pp.p } }));
    }
  });

  ScrollTrigger.create({
    trigger: '#dalshe', start: 'top 50%', end: 'bottom top',
    onEnter: () => rail('var(--ink)'), onEnterBack: () => rail('var(--ink)'), onLeaveBack: () => rail('var(--ink-night)')
  });

  document.querySelectorAll('.hotspot').forEach(b => b.addEventListener('click', () => {
    const st = ScrollTrigger.getById('plot'), k = [0.42, 0.67, 0.92][b.dataset.go - 1];
    window.scrollTo({ top: st.start + (st.end - st.start) * k, behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ---------- Счёт ---------- */
  const items = { banya: false, chan: false };
  const names = { banya: ['Добавить баню', 'Баня в счёте'], chan: ['Добавить чан', 'Чан в счёте'] };
  const total = $('[data-total]');
  const money = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';

  document.querySelectorAll('.toggle').forEach(btn => btn.addEventListener('click', () => {
    const k = btn.dataset.item, on = (items[k] = !items[k]), row = $(`[data-row="${k}"]`);
    btn.setAttribute('aria-pressed', on);
    btn.textContent = names[k][+on];
    if (on) {
      row.hidden = false;
      gsap.fromTo(row, { height: 0, autoAlpha: 0 }, { height: 'auto', autoAlpha: 1, duration: t(0.35), ease: 'power3.out', overwrite: true, clearProps: 'height' });
    } else {
      gsap.to(row, { height: 0, autoAlpha: 0, duration: t(0.35), ease: 'power3.out', overwrite: true, onComplete: () => { row.hidden = true; } });
    }
    total.textContent = money(15000 + 4000 * (items.banya + items.chan));
  }));

  /* ---------- Загрузка 3D ---------- */
  if (!reduce && !navigator.connection?.saveData) {
    const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise(r => addEventListener('load', r, { once: true }));
    const near = new Promise(r => {
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); r(); } }, { rootMargin: '150% 0px' });
      io.observe(plot);
    });
    Promise.all([loaded, near]).then(() => import('./scene.js?v=2')).catch(() => {});
  }
})();
