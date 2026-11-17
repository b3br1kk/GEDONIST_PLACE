(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.remove('no-js');
  const G = window.gsap;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const small = () => innerWidth < 900;
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const smooth = v => v * v * (3 - 2 * v);

  const stand = $('#dvor'), frame = $('.stand__frame', stand), media = $('.stand__media', stand);
  const video = $('.stand__video', stand), veil = $('.stand__veil', stand);
  const hall = $('.hall', stand), topbar = $('.topbar', stand), strip = $('.strip', stand);
  const peek = $('.peek', stand), peekSub = $('[data-peek-sub]', stand), skipBtn = $('.skip', stand);
  const map = $('.map', stand), mapHead = $('.map__head', stand), mapH2 = $('h2', mapHead);
  const glows = $('.glows', stand), printer = $('.printer', map), stub = $('.stub', map);
  const closeBtn = $('.card__close', map), backBtn = $('.back', map);
  video.muted = true;

  /* ---------- Шкала ---------- */
  const thermo = $('.thermo'), numEl = $('.thermo__num'), labelEl = $('.thermo__label');
  for (let i = 0; i < 14; i++) {
    const tick = document.createElement('i');
    tick.style.setProperty('--k', i / 13);
    if (i % 5 === 0) tick.className = 'is-long';
    $('.thermo__scale').append(tick);
  }
  const th = { v: 24 };
  const renderT = () => {
    const v = Math.round(th.v);
    numEl.textContent = (v < 0 ? '−' : v > 0 ? '+' : '') + Math.abs(v) + '°';
    thermo.style.setProperty('--f', clamp01((th.v + 30) / 130).toFixed(4));
  };
  const rail = c => root.style.setProperty('--rail-ink', c);
  function setTemp(v, label, dur = 0.6) {
    labelEl.textContent = label;
    if (G && !reduce && dur) G.to(th, { v, duration: dur, ease: 'power2.out', overwrite: true, onUpdate: renderT });
    else { if (G) G.killTweensOf(th); th.v = v; renderT(); }
  }
  rail('var(--ink)');
  renderT();

  /* ---------- Открытие ---------- */
  root.classList.remove('is-loading');
  if (G && !reduce) {
    G.from([topbar, ...hall.children, strip], { autoAlpha: 0, y: 14, duration: 0.8, ease: 'power3.out', stagger: 0.07, delay: 0.1, clearProps: 'transform' });
  }

  /* ---------- Иней на створках окна ---------- */
  function fern(g, W, H, s) {
    const e = Math.random() * 4 | 0, u = Math.random();
    let x = e < 2 ? u * W : (e === 2 ? 0 : W), y = e < 2 ? (e === 0 ? 0 : H) : u * H;
    let a = Math.atan2(H / 2 - y, W / 2 - x) + (Math.random() - 0.5);
    g.beginPath(); g.moveTo(x, y);
    const n = 4 + (Math.random() * 4 | 0);
    for (let i = 1; i <= n; i++) {
      a += (Math.random() - 0.5) * 0.6;
      const l = (5 + Math.random() * 8) * s;
      x += Math.cos(a) * l; y += Math.sin(a) * l;
      g.lineTo(x, y);
      if (Math.random() < 0.45) {
        const ba = a + (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.5), bl = (3 + Math.random() * 5) * s;
        g.lineTo(x + Math.cos(ba) * bl, y + Math.sin(ba) * bl); g.moveTo(x, y);
      }
    }
    g.stroke();
  }
  function frostURL(w, h) {
    const s = Math.min(2, devicePixelRatio || 1), W = Math.max(8, Math.round(w * s)), H = Math.max(8, Math.round(h * s));
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.1, W / 2, H / 2, Math.hypot(W, H) / 2);
    gr.addColorStop(0, 'rgba(226,236,244,.18)'); gr.addColorStop(1, 'rgba(236,243,248,.78)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff';
    for (let i = 0; i < W * H / 170; i++) { g.globalAlpha = 0.08 + Math.random() * 0.3; g.beginPath(); g.arc(Math.random() * W, Math.random() * H, (0.4 + Math.random()) * s, 0, 6.2832); g.fill(); }
    g.globalAlpha = 1; g.strokeStyle = 'rgba(255,255,255,.34)'; g.lineWidth = 0.7 * s; g.lineCap = 'round';
    for (let i = 0; i < 12; i++) fern(g, W, H, s);
    return c.toDataURL('image/png');
  }
  const paneFrost = () => $$('.peek__pane', peek).forEach(p => { if (p.clientWidth) p.style.backgroundImage = `url(${frostURL(p.clientWidth, p.clientHeight)})`; });
  paneFrost();

  /* ---------- Снег за окном ---------- */
  const snowC = $('.peek__snow', peek), sg = snowC.getContext('2d');
  let flakes = [], snowRaf = 0, snowOn = false;
  function snowSize() {
    const s = Math.min(2, devicePixelRatio || 1);
    snowC.width = Math.round(snowC.clientWidth * s); snowC.height = Math.round(snowC.clientHeight * s);
    flakes = Array.from({ length: 34 }, () => ({ x: Math.random(), y: Math.random(), r: 0.5 + Math.random() * 1.1, v: 0.04 + Math.random() * 0.07, d: Math.random() * 6.28 }));
  }
  function snowTick(t) {
    snowRaf = 0;
    const W = snowC.width, H = snowC.height, s = W / Math.max(1, snowC.clientWidth);
    sg.clearRect(0, 0, W, H); sg.fillStyle = 'rgba(240,246,250,.85)';
    for (const f of flakes) {
      f.y += f.v / 60; if (f.y > 1.05) { f.y = -0.05; f.x = Math.random(); }
      const x = (f.x + Math.sin(t / 1400 + f.d) * 0.015) * W;
      sg.beginPath(); sg.arc(x, f.y * H, f.r * s, 0, 6.2832); sg.fill();
    }
    if (snowOn) snowRaf = requestAnimationFrame(snowTick);
  }
  const snowSync = (vis = snowVisible) => {
    snowVisible = vis;
    const on = vis && !document.hidden && !reduce && stand.dataset.state === 'hall';
    if (on === snowOn) return;
    snowOn = on;
    if (on && !snowRaf) snowRaf = requestAnimationFrame(snowTick);
  };
  let snowVisible = true;
  snowSize();
  if (reduce) snowTick(0);
  new IntersectionObserver(([e]) => snowSync(e.isIntersecting)).observe(snowC);
  document.addEventListener('visibilitychange', () => snowSync());

  /* ---------- Видео пролёта ---------- */
  const DUR = 370 / 60;
  const srcFor = () => (!small() && Math.min(2, devicePixelRatio || 1) * frame.clientWidth > 1100 ? 'assets/video/fly-1600.mp4?v=1' : 'assets/video/fly-960.mp4?v=1');
  function loadVideo() {
    if (video.getAttribute('src')) return;
    video.src = srcFor(); video.preload = 'auto'; video.load();
  }
  function waitReady(ms) {
    return new Promise(res => {
      if (video.readyState >= 4) return res(true);
      let done = false;
      const fin = ok => { if (done) return; done = true; clearTimeout(tm); video.removeEventListener('canplaythrough', yes); video.removeEventListener('error', no); res(ok); };
      const yes = () => fin(true), no = () => fin(false);
      const tm = setTimeout(() => fin(video.readyState >= 2), ms);
      video.addEventListener('canplaythrough', yes); video.addEventListener('error', no);
    });
  }
  // видео тянем заранее, когда страница уже показалась, или как только к кнопке потянулись
  if (!navigator.connection?.saveData) {
    const later = () => setTimeout(loadVideo, 900);
    if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
  }
  ['pointerenter', 'focus', 'touchstart'].forEach(ev => peek.addEventListener(ev, loadVideo, { once: true, passive: true }));

  /* ---------- Состояния: зал → пролёт → двор ---------- */
  let busy = false, syncId = 0;
  const setState = s => { stand.dataset.state = s; snowSync(); };
  const fieldPx = () => [topbar.offsetHeight, small() ? Math.round(stand.clientHeight * 0.44) : topbar.offsetHeight];

  function flightSync() {
    const t = video.currentTime;
    const k = smooth(clamp01((t - 1.2) / 1.5));
    th.v = 24 + (-27 - 24) * k; renderT();
    labelEl.textContent = k < 0.5 ? 'зал' : 'улица';
    rail(t < 2.1 ? 'var(--ink)' : 'var(--ink-night)');
    if (stand.dataset.state === 'fly') syncId = video.requestVideoFrameCallback ? video.requestVideoFrameCallback(flightSync) : requestAnimationFrame(flightSync);
  }

  async function goYard() {
    if (stand.dataset.state !== 'hall' || busy) return;
    busy = true;
    if (reduce || !G) return showMapInstant();
    loadVideo();
    if (video.readyState < 4) { peek.setAttribute('aria-busy', 'true'); peekSub.textContent = 'открываем дверь…'; }
    const ok = await waitReady(8000);
    peek.removeAttribute('aria-busy'); peekSub.textContent = 'баня, чан, веранда';
    if (!ok) return showMapInstant();
    video.currentTime = 0;
    try { await video.play(); } catch (e) { return showMapInstant(); }
    stand.classList.add('is-vid');
    setState('fly');
    const [ct, cb] = fieldPx();
    stand.style.setProperty('--ct', ct + 'px'); stand.style.setProperty('--cb', cb + 'px');
    G.timeline()
      .to([hall, strip], { autoAlpha: 0, y: -14, duration: 0.45, ease: 'power3.out' }, 0)
      .to(topbar, { autoAlpha: 0, duration: 0.35, ease: 'power2.out' }, 0.1)
      .to(stand, { '--ct': '0px', '--cb': '0px', duration: 1.2, ease: 'power3.inOut' }, 0.15);
    skipBtn.hidden = false;
    G.fromTo(skipBtn, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, delay: 0.7 });
    flightSync();
    video.addEventListener('ended', enterMap, { once: true });
  }

  function skip() {
    if (stand.dataset.state !== 'fly') return;
    video.removeEventListener('ended', enterMap);
    video.pause();
    video.addEventListener('seeked', enterMap, { once: true });
    video.currentTime = Math.max(0, (video.duration || DUR) - 0.02);
  }

  function showMapInstant() {
    stand.classList.remove('is-vid');
    if (G) G.set([hall, strip], { autoAlpha: 0 }); else { hall.style.visibility = 'hidden'; strip.style.visibility = 'hidden'; }
    enterMap();
  }

  function enterMap() {
    if (stand.dataset.state === 'map') return;
    skipBtn.hidden = true;
    stand.style.setProperty('--ct', '0px'); stand.style.setProperty('--cb', '0px');
    setState('map');
    setTemp(-27, 'улица', 0.3);
    rail('var(--ink-night)');
    map.hidden = false;
    if (small()) enablePan();
    if (G) {
      G.killTweensOf([hall, strip]);
      G.set([hall, strip], { autoAlpha: 0 });
      G.to(topbar, { autoAlpha: 1, duration: 0.5 });
      const m = reduce ? 0 : 1;
      // from() с clearProps: после входа видимость снова решает CSS (карточка прячет заголовок и кнопки)
      G.from([mapHead, backBtn, $('.chips', map), stub], { autoAlpha: 0, y: 10 * m, duration: 0.6 * m, ease: 'power3.out', stagger: 0.06 * m, clearProps: 'opacity,visibility,transform' });
      G.from($$('.pin', stand), { autoAlpha: 0, y: 8 * m, duration: 0.5 * m, ease: 'power3.out', stagger: 0.09 * m, delay: 0.15 * m, clearProps: 'opacity,visibility,transform' });
      if (!small()) G.from(printer, { autoAlpha: 0, y: 24 * m, duration: 0.7 * m, ease: 'power3.out', delay: 0.3 * m, clearProps: 'opacity,visibility,transform' });
    }
    mapH2.focus({ preventScroll: true });
    busy = false;
  }

  function backToHall() {
    if (stand.dataset.state !== 'map' || busy) return;
    busy = true;
    closeCard(false);
    const swap = () => {
      map.hidden = true;
      disablePan();
      video.pause();
      if (video.readyState >= 1) video.currentTime = 0;
      stand.classList.remove('is-vid');
      setState('hall');
      stand.style.removeProperty('--ct'); stand.style.removeProperty('--cb');
      setTemp(24, 'зал', 0);
      rail('var(--ink)');
      printer.classList.remove('is-open'); stub.setAttribute('aria-expanded', 'false');
      if (G) G.set([hall, strip, topbar], { autoAlpha: 1, y: 0 });
      else { hall.style.visibility = ''; strip.style.visibility = ''; }
      peek.focus({ preventScroll: true });
    };
    if (!G || reduce) { swap(); busy = false; return; }
    G.timeline({ onComplete: () => { busy = false; } })
      .to(veil, { opacity: 1, duration: 0.3, ease: 'power2.in' })
      .add(swap)
      .to(veil, { opacity: 0, duration: 0.5, ease: 'power2.out' }, '+=0.05');
  }

  peek.addEventListener('click', goYard);
  skipBtn.addEventListener('click', skip);
  backBtn.addEventListener('click', backToHall);
  $$('[data-open-map]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    stand.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    goYard();
  }));

  /* ---------- Сдвиг двора пальцем (телефон) ---------- */
  function enablePan() {
    if (stand.classList.contains('is-pan')) return;
    media.style.transition = 'none';
    stand.classList.add('is-pan');
    frame.scrollLeft = (media.offsetWidth - frame.clientWidth) / 2;
    void media.offsetWidth;
    media.style.transition = '';
  }
  function disablePan() {
    stand.classList.remove('is-pan');
    frame.scrollLeft = 0;
  }
  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      paneFrost(); snowSize();
      if (stand.dataset.state === 'map') { if (small()) enablePan(); else disablePan(); }
    }, 150);
  });

  /* ---------- Двор: наведение по маскам, карточки ---------- */
  const KEYS = ['house', 'terrace', 'banya', 'chan'];
  const TEMPS = { house: [24, 'дом'], terrace: [-27, 'веранда'], banya: [90, 'парная'], chan: [38, 'чан'] };
  // центры построек в кадре (по маскам из Blender)
  const POS = { house: [0.75, 0.28], terrace: [0.58, 0.39], banya: [0.284, 0.695], chan: [0.107, 0.8] };
  let hit = null, hot = null, cur = null;
  const hitImg = new Image();
  hitImg.onload = () => {
    const c = document.createElement('canvas'); c.width = hitImg.width; c.height = hitImg.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(hitImg, 0, 0);
    hit = { w: c.width, h: c.height, d: g.getImageData(0, 0, c.width, c.height).data };
  };
  hitImg.src = 'assets/map/hit.png?v=1';
  function keyAt(x, y) {
    if (!hit) return null;
    const r = media.getBoundingClientRect(), u = (x - r.left) / r.width, v = (y - r.top) / r.height;
    if (u < 0 || u >= 1 || v < 0 || v >= 1) return null;
    const i = hit.d[((v * hit.h | 0) * hit.w + (u * hit.w | 0)) * 4];
    return KEYS[Math.round(i / 60) - 1] || null;
  }
  const byK = (sel, k) => $(`${sel}[data-k="${k}"]`, stand);
  function setHot(k) {
    if (k === hot) return;
    if (hot) { byK('.glow', hot).classList.remove('is-hot'); byK('.pin', hot).classList.remove('is-hot'); }
    hot = k;
    if (k) { byK('.glow', k).classList.add('is-hot'); byK('.pin', k).classList.add('is-hot'); }
    media.classList.toggle('is-over', !!k);
  }
  function select(k, focus = true) {
    if (stand.dataset.state !== 'map') return;
    if (cur === k) return closeCard();
    const prev = cur;
    cur = k;
    KEYS.forEach(n => {
      const on = n === k;
      byK('.glow', n).classList.toggle('is-on', on);
      byK('.pin', n).setAttribute('aria-expanded', on);
      const chip = $(`.chips [data-k="${n}"]`, map); if (chip) chip.setAttribute('aria-pressed', on);
      $(`#card-${n}`).hidden = !on;
    });
    glows.classList.add('has-on');
    map.classList.add('has-card'); stand.classList.add('has-card');
    closeBtn.hidden = false;
    setTemp(...TEMPS[k]);
    const card = $(`#card-${k}`);
    card.scrollTop = 0;
    if (G && !reduce) G.fromTo(card, { autoAlpha: 0, y: prev ? 6 : 14 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out', clearProps: 'transform' });
    if (focus) $('h3', card).focus({ preventScroll: true });
    if (stand.classList.contains('is-pan')) {
      frame.scrollTo({ left: POS[k][0] * media.offsetWidth - frame.clientWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
      // постройку поднимаем в свободную полосу над шторкой; открывшийся низ прячется под ней
      const H = frame.clientHeight, top = topbar.offsetHeight, sheet = card.getBoundingClientRect().top - frame.getBoundingClientRect().top;
      const lift = Math.max(0, Math.min(POS[k][1] * H - (top + sheet) / 2, H - sheet - 4));
      stand.style.setProperty('--lift', Math.round(lift) + 'px');
    }
  }
  function closeCard(refocus = true) {
    if (!cur) return;
    const k = cur;
    cur = null;
    KEYS.forEach(n => {
      byK('.glow', n).classList.remove('is-on');
      byK('.pin', n).setAttribute('aria-expanded', 'false');
      const chip = $(`.chips [data-k="${n}"]`, map); if (chip) chip.setAttribute('aria-pressed', 'false');
      $(`#card-${n}`).hidden = true;
    });
    glows.classList.remove('has-on');
    map.classList.remove('has-card'); stand.classList.remove('has-card');
    stand.style.removeProperty('--lift');
    closeBtn.hidden = true;
    if (stand.dataset.state === 'map') setTemp(-27, 'улица');
    if (refocus) byK('.pin', k).focus({ preventScroll: true });
  }

  if (fine) {
    media.addEventListener('pointermove', e => { if (stand.dataset.state === 'map') setHot(e.target.closest('.pin')?.dataset.k || keyAt(e.clientX, e.clientY)); });
    media.addEventListener('pointerleave', () => setHot(null));
  }
  media.addEventListener('click', e => {
    if (stand.dataset.state !== 'map') return;
    const pin = e.target.closest('.pin');
    const k = pin ? pin.dataset.k : keyAt(e.clientX, e.clientY);
    if (k) select(k, !!pin || e.detail === 0); else closeCard(false);
  });
  $$('.pin', stand).forEach(p => {
    p.addEventListener('focus', () => setHot(p.dataset.k));
    p.addEventListener('blur', () => setHot(null));
  });
  $$('.chips button', map).forEach(b => b.addEventListener('click', () => select(b.dataset.k)));
  closeBtn.addEventListener('click', () => closeCard());
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (stand.dataset.state === 'fly') skip();
    else if (cur) closeCard();
    else if (printer.classList.contains('is-open')) { printer.classList.remove('is-open'); stub.setAttribute('aria-expanded', 'false'); stub.focus(); }
  });

  /* ---------- Чек ---------- */
  const bill = { days: 'wd', banya: false, chan: false };
  const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const pad = n => String(n).padStart(2, '0');
  const now = new Date();
  $('[data-now]', map).textContent = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  function printRow(row) {
    row.hidden = false;
    row.removeAttribute('data-new'); void row.offsetWidth; row.setAttribute('data-new', '');
  }
  function renderBill(changed) {
    const house = bill.days === 'wd' ? 15000 : 20000;
    $('[data-days-name]', map).textContent = bill.days === 'wd' ? 'будни' : 'пт–вс';
    $('[data-days-price]', map).textContent = fmt(house);
    $('[data-days-sum]', map).textContent = fmt(house);
    ['banya', 'chan'].forEach(k => { const r = $(`[data-row="${k}"]`, map); if (bill[k]) { if (r.hidden || changed === k) printRow(r); } else r.hidden = true; });
    if (changed === 'house') printRow($('[data-row="house"]', map));
    const total = house + 4000 * (bill.banya + bill.chan);
    $('[data-total]', map).textContent = fmt(total) + ' ₽';
    $('[data-total-stub]', map).textContent = fmt(total) + ' ₽';
  }
  $$('.toggle', map).forEach(btn => btn.addEventListener('click', () => {
    const k = btn.dataset.item, on = (bill[k] = !bill[k]);
    btn.setAttribute('aria-pressed', on);
    btn.textContent = on ? (k === 'banya' ? 'Баня в чеке' : 'Чан в чеке') : (k === 'banya' ? 'Добавить баню' : 'Добавить чан');
    renderBill(on ? k : null);
  }));
  $$('input[name="days"]', map).forEach(r => r.addEventListener('change', () => { bill.days = r.value; renderBill('house'); }));
  stub.addEventListener('click', () => {
    const open = printer.classList.toggle('is-open');
    stub.setAttribute('aria-expanded', open);
  });
  renderBill();

  /* ---------- Цвет шкалы на светлой заглушке ---------- */
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) rail('var(--ink)');
    else rail(stand.dataset.state === 'hall' ? 'var(--ink)' : 'var(--ink-night)');
  }, { rootMargin: '-50% 0px -50% 0px' }).observe($('#dalshe'));
})();
