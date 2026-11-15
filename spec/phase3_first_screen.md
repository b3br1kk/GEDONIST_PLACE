# ТЗ фазы 3, контрольная точка: Hero «оттаивание» + сцена «Участок»

Файлы на выходе: `docs/index.html`, `docs/styles.css`, `docs/app.js` (обычный скрипт: Hero, шкала, счёт), `docs/scene.js` (ES-модуль: 3D-сцена). Всё локально, никаких CDN. Язык страницы `ru`.

Читать перед работой: `design-system/gedonist/MASTER.md` (токены, шрифты, форма), `copy/index.md` (все тексты дословно), `docs/vendor/VENDOR.md` (теги подключения).

Готовые ассеты (не менять): `docs/assets/img/hero-hall.webp` (2200×1467), `hero-hall-900.webp`, `hall.webp`, `banya.webp`, `chan.webp`, `scene-poster.webp`, модель `docs/assets/models/site.glb` (300 КБ, без Draco, Y вверх).

## 0. Структура страницы
```
<div class="demo-banner">…</div>            статичная полоса 32px, фон --night, текст --ink-night-2 0.8125rem
<div class="thermo" aria-hidden="true">      фиксированная шкала, справа
<main>
  <section id="hero" class="hero">           100svh
  <section id="uchastok" class="plot">       pinned-сцена
  <section id="dalshe" class="next">         заглушка
</main>
```
Шапка `.topbar` лежит внутри Hero (position:absolute, top:0), не липкая. Ссылки шапки: «Участок» → #uchastok, остальные → #dalshe. На ширине < 900px ссылки шапки скрыты, остаётся название и строка «Сингапай, 10 минут от Нефтеюганска» переносится под название мелким текстом.

## 1. Шкала-градусник `.thermo`
- Десктоп: `position:fixed; right:28px; top:50%; transform:translateY(-50%)`. Вертикальная линия 1px высотой 46vh, 14 делений через 10° от −30 до +100 (каждое 5-е длиннее). «Ртуть» — столбик шириной 3px цвета --carpet от низа до текущего значения. Слева от линии, у верхушки ртути: число (Sofia Sans Extra Condensed 600, 5rem) и под ним подпись зоны (Golos 0.8125rem).
- Мобайл (< 900px): `right:12px; bottom:12px; top:auto; transform:none`; только число 3rem и подпись, без линии; под ними полупрозрачная подложка не нужна — цвет берётся из `--rail-ink`.
- Цвет шкалы: CSS-переменная `--rail-ink` на `:root`. В Hero `--night`, в сцене `--ink-night`, в #dalshe `--ink`. Менять через ScrollTrigger onEnter/onEnterBack секций, переход цвета 0.3s.
- API в app.js: `window.setTemp(value, label)` — плавно (0.6s power2.out) ведёт число и ртуть. Формат: `−27°`, `+24°` (минус U+2212, плюс явный). Значение в Hero −27 «улица».

## 2. Hero
Слои снизу вверх: `<picture>` с фото зала (object-fit:cover, object-position:50% 40%; на ширине ≤ 900 — `hero-hall-900.webp`), `<canvas class="frost" aria-hidden="true">`, контент.
Фон секции до загрузки фото: --frost-1.

Композиция, десктоп 1440×900: блок текста прижат к левому нижнему углу, отступ слева `clamp(1.25rem, 5vw, 5rem)`, снизу 4.5rem. H1 в две строки («Место» / «гедониста»), под ним лид (max-width 27rem, 1.25rem/1.45), под ним ряд: кнопка «Собрать свой отдых» (href #uchastok) и ссылка «Посмотреть участок ↓» (стрелка покачивается по y на 4px, 1.6s, yoyo — это единственная анимированная стрелка на сайте). Подсказка про стекло — в правом нижнем углу (right 6.5rem, bottom 4.5rem), 0.875rem, цвет --night с opacity .7. Цвет всего текста Hero: --night.
Мобайл 390×844: H1 3.25rem, блок текста снизу (bottom 5.5rem), кнопка на всю ширину блока, ссылка под ней, подсказка мобильная под ссылкой. Ничего не вылезает за 390px.

### Иней (canvas 2D), app.js
- Размер canvas = размер Hero × min(devicePixelRatio, 1.5). Пересоздавать при resize (debounce 150ms).
- Один раз рисуется текстура инея в offscreen-canvas `frostTex`: вертикальный градиент #DDE9F0 → #B9CCDA с alpha 0.97; затем 1400 (мобайл 600) белых точек r 0.5–2.2px alpha 0.08–0.35; затем 90 (мобайл 40) «папоротников»: ломаная из 6–10 отрезков по 14–34px от случайной точки края внутрь, с 2–4 короткими ответвлениями, stroke rgba(255,255,255,.38) 1px; затем виньетка по краям rgba(110,140,168,.28).
- Второй offscreen `trail` — следы пальца/курсора. Только при `(pointer:fine)`: на pointermove ставить мягкое пятно (radialGradient, r = 74px × dpr, alpha центра 0.55) в точку курсора. Каждый кадр `trail` «замерзает»: залить `rgba(0,0,0,0.012)` в режиме `destination-out`.
- Кадр: clear → drawImage(frostTex) → `destination-out`: drawImage(trail) и центральная проталина → вернуть `source-over`.
- Центральная проталина: центр (62% ширины, 44% высоты) на десктопе, (50%, 36%) на мобайле. Радиус `R`. Рисуется как 9 мягких кругов (radialGradient alpha 1 → 0), центры на окружности радиуса `0.42R` вокруг центра плюс один в центре, радиус каждого `R × (0.62 + 0.08 × sin(t × 0.7 + i × 1.3))`, t — время в секундах. Так край живой и неровный, без чёткой геометрии.
- rAF-цикл работает, только пока Hero в зоне видимости (IntersectionObserver) и вкладка активна.

### Открытие (прелоадер → Hero), один gsap.timeline, старт после `document.fonts.ready` (но не позже 1.2s)
Стартовые состояния задаются ТОЛЬКО через gsap.set (не в CSS): R = 0; `.topbar`, лид, ряд кнопок, подсказка — autoAlpha 0, y 14; H1 — смещён в центр экрана (x,y вычислить из getBoundingClientRect) и scale 1; каждая строка H1 обёрнута в `span.line > span.line__in`, `line` с overflow:hidden и padding-bottom .12em, `line__in` yPercent 110.
1. 0.0s: строки H1 поднимаются, yPercent 110 → 0, 0.9s, power4.out, stagger 0.08.
2. 1.05s: H1 перелетает на своё место (x,y → 0), 1.0s, power3.inOut. Одновременно R: 0 → `min(vw,vh) × 0.24` (мобайл × 0.30), 1.3s, power2.out.
3. 1.95s: `.topbar`, лид, кнопки, подсказка: autoAlpha 1, y 0, 0.6s, power3.out, stagger 0.08.
На время открытия `html` получает класс `is-loading` (overflow:hidden), снимается в конце шага 2. Весь сценарий ≤ 2.6s.
`prefers-reduced-motion: reduce`: таймлайна нет, всё видно сразу, R = конечному значению, цикл рисует один кадр.

### Прокрутка Hero
ScrollTrigger: `trigger:#hero, start:"top top", end:"+=70%", pin:true, scrub:0.6`.
- 0–0.25 прогресса: ничего не меняется (пауза чтения), проталина только «дышит».
- 0.25–1.0: R растёт от стартового до `Math.hypot(w,h) × 0.8` (ease power2.in по прогрессу).
- 0.6–1.0: блок текста, подсказка и шапка: autoAlpha 1 → 0, y 0 → −24.
Scroll-Then-Act + Reset-On-Leave: при возврате наверх всё возвращается.

## 3. Сцена «Участок» `#uchastok`
Разметка:
```
<section id="uchastok" class="plot" data-stage="0">
  <h2 class="visually-hidden">…</h2>
  <div class="scene3d" role="img" aria-label="Объёмный макет участка: дом с верандой, баня и чан среди сосен">
    <img class="scene3d__poster" src="assets/img/scene-poster.webp" alt="" width="1200" height="800">
    <canvas class="scene3d__canvas" aria-hidden="true"></canvas>
    <button class="hotspot" data-go="1">Дом</button> … data-go="2" Баня, data-go="3" Чан
  </div>
  <div class="plot__text">  4 × <article class="stage" data-i="0..3">…</article>  </div>
  <aside class="bill" aria-live="polite">…</aside>
  <p class="plot__note">сноска</p>
</section>
```
Фон секции: CSS-переменная `--plot-bg`, меняется по стадиям (цвета в MASTER.md), transition 0.6s. Текст на ней --ink-night.

Композиция, десктоп: `.scene3d` занимает весь экран (100vw × 100svh) под текстом; `.plot__text` — колонка слева: left `clamp(1.25rem, 5vw, 5rem)`, по вертикали по центру, ширина 24rem. Стадии лежат друг на друге (grid, одна ячейка), активная — autoAlpha 1, остальные 0. В стадии: строка температуры (Sofia 600, 1.5rem, цвет --sail: «−27° · улица»), H3 (Prata), текст, строка цены (числа Sofia 600 1.5rem, остальное Golos), для бани и чана — кнопка-переключатель (вторичная: прозрачная, рамка 1px --ink-night-2, текст --ink-night; в состоянии `aria-pressed="true"` — фон --cream, текст --ink, надпись меняется по copy), маленькое фото 9rem × 9rem (object-fit:cover, radius 6px) с подписью 0.8125rem. Фото и подпись стоят в ряд под текстом. Фото грузить `loading="lazy"`.
`.bill` — правый нижний угол (right 7rem, bottom 2.5rem), ширина 17rem, фон --cream, цвет --ink, radius 2px, тень из MASTER, padding 1rem 1.125rem, лёгкий поворот −1.2deg. Строки: слева название, справа сумма (Sofia 600 1.5rem, tabular-nums), между ними пунктир (border-bottom dotted). Итог отделён линией 1px. Числа форматировать с неразрывным пробелом: `15 000 ₽`.
`.plot__note` — снизу слева, 0.75rem, цвет --ink-night-2, max-width 30rem.
Мобайл (< 900px): `.scene3d` — верхние 52svh; `.plot__text` — нижняя часть (top 52svh, padding 1rem 1.25rem), фон --plot-bg; H3 1.625rem; фото 5.5rem; `.bill` не плавает, а превращается в полосу над нижним краем: одна строка «Итого — N ₽» слева от шкалы (fixed внутри pinned-секции: bottom 12px, left 12px, ширина auto, поворот 0); сноска скрыта на мобайле и показывается в #dalshe.

### Прокрутка сцены (app.js создаёт ScrollTrigger, scene.js слушает событие)
`trigger:#uchastok, start:"top top", end:"+=400%", pin:true, scrub:0.8`. Прогресс p:
- 0.00–0.22 — пауза чтения, стадия 0.
- стадии: 0 при p < 0.30; 1 при 0.30 ≤ p < 0.55; 2 при 0.55 ≤ p < 0.80; 3 при p ≥ 0.80. Смена стадии: `section.dataset.stage`, перекрёстное появление текста 0.45s power3.out (уходящая y 0 → −10, входящая y 12 → 0), `setTemp` по стадии: −27 «улица», +24 «дом», +90 «парная», +38 «чан». Single-trigger: смена срабатывает один раз на переход, не на каждый кадр.
- На каждом обновлении: `window.dispatchEvent(new CustomEvent('plot:progress', {detail:{p}}))`.
- Клик по `.hotspot[data-go=N]` прокручивает страницу к середине стадии N (gsap.to(window,{scrollTo}) без плагина нельзя — использовать `window.scrollTo({top, behavior:'smooth'})`, top = st.start + (st.end − st.start) × [0.42, 0.67, 0.92][N−1]).
- Хотспоты: маленькая метка: кружок 10px --cream + подпись 0.8125rem Golos 500 на подложке rgba(13,26,40,.72), radius 4px; focus-visible по MASTER. Позицию задаёт scene.js через `style.transform = translate(x,y)`; пока сцена не готова — скрыты.

### Счёт
Состояние `{banya:false, chan:false}`. База 15 000. Переключатели в стадиях 2 и 3 меняют состояние, `aria-pressed` и текст кнопки; счёт перерисовывается, новая строка появляется с высотой 0 → auto (0.35s power3.out), итог перещёлкивается без «накрутки» счётчика. Итог: 15 000 / 19 000 / 23 000 ₽.

## 4. 3D-сцена `docs/scene.js` (type="module", three r185 через importmap из VENDOR.md)
Загрузка: динамически, когда `#uchastok` ближе 1.5 экрана (IntersectionObserver, rootMargin "150% 0px"), и не раньше события load. Если нет WebGL, `prefers-reduced-motion: reduce` или `navigator.connection?.saveData` — сцену не создавать, остаётся постер, тексты и счёт работают по прокрутке как обычно.
- `WebGLRenderer({canvas, antialias:true, alpha:true})`, pixelRatio min(dpr, 2) (мобайл 1.5), `outputColorSpace = SRGBColorSpace`, `toneMapping = ACESFilmicToneMapping`, exposure 1.05, тени PCFSoftShadowMap. Размер по контейнеру через ResizeObserver.
- GLTFLoader → `assets/models/site.glb`. Узлы-группы: Land, House, Terrace, Banya, Chan, Trees. Всем мешам castShadow = true, receiveShadow = true. Материалы по имени: `G_Glow_House`, `G_Glow_Banya`, `G_Water_Chan` — у них анимируется `emissiveIntensity`; `G_Sail` — side DoubleSide.
- Координаты three: X — восток, Y — вверх, Z — юг. Дом ≈ (2, 0, −3), веранда ≈ (2, 0.5, 4.75), баня ≈ (−10.4, 1.5, 12.5), чан ≈ (−15.6, 1.6, 13.4).
- Свет: HemisphereLight(#7C96B8, #1A2230, 0.9); DirectionalLight «луна» (#BFD4FF, 1.6) из (−20, 40, 10), castShadow, карта 2048, границы теневой камеры ±36, bias −0.0005; PointLight дом (#FFB768, distance 24, decay 2) в (2, 2.2, 6.5); PointLight баня (#FF9040, distance 13) в (−6.2, 1.8, 12.5); PointLight чан (#6FE0D0, distance 9) в (−15.6, 2.4, 13.4). Точечные без теней.
- Туман: FogExp2 цвета фона секции, плотность 0.006; цвет тумана ведётся вместе с `--plot-bg` (lerp к цвету стадии).
- Снег: Points, 700 частиц (мобайл 280) в объёме 70 × 30 × 70 вокруг центра, размер 0.18, белые, opacity 0.8, падают 1.2–2.4 ед/с, слегка сносит по X, зацикливаются. depthWrite false.
- Пар над чаном: 14 спрайтов (мягкий круг, CanvasTexture), всплывают от (−15.6, 1.8, 13.4) вверх на 3.5 ед., расширяясь от 0.6 до 2.2, opacity 0 → 0.35 → 0. Дым из трубы бани: 8 спрайтов от (−12.2, 4.9, 11.8), серо-голубой. Общая видимость пара умножается на вес стадии.
- Камера: PerspectiveCamera fov 30 (если aspect < 1 — fov 44 и все позиции × 1.18 от точки взгляда). Ключевые кадры по прогрессу p (позиция → точка взгляда):
  - K0, p 0.00–0.22: (46, 40, 52) → (0, 1, 2). В паузе камера «дышит»: азимут ±2° синусом с периодом 9s.
  - K1, p = 0.42: (16, 9, 28) → (1, 2.2, 1).
  - K2, p = 0.67: (6, 6.5, 28) → (−9.5, 1.6, 12.5).
  - K3, p = 0.92–1.00: (−17, 5.5, 29) → (−15, 1.6, 13.4).
  Между ключами — интерполяция позиции и точки взгляда со сглаживанием smoothstep; итоговое положение камеры дополнительно демпфируется (lerp 0.08 за кадр), чтобы не дёргалось.
- Свет по стадиям (веса w1,w2,w3 — плавные 0..1 вокруг своих ключей): `G_Glow_House.emissiveIntensity` 0.25 → 3.2 при p от 0.24 до 0.40 и остаётся; PointLight дома 0 → 70. `G_Glow_Banya` 0.2 → 3.0 при p 0.50–0.64; свет бани 0 → 36. `G_Water_Chan` 0.3 → 2.4 при p 0.74–0.90; свет чана 0 → 16.
- Хотспоты: якоря дом (2, 7.2, −3), баня (−10.4, 5, 12.5), чан (−15.6, 3.4, 13.4); каждый кадр проецировать в координаты контейнера и ставить transform. Прозрачность хотспота = 1 при p < 0.26, 0.55 на остальных стадиях, 0 у активной стадии.
- Цикл rAF работает только когда `.scene3d` в зоне видимости и вкладка активна. После первого кадра: `container.dataset.ready = "true"`, постер гаснет (opacity 0, 0.6s) — CSS по атрибуту.
- Для проверки: `window.__plot = { setProgress(p) }` — мгновенно ставит камеру и свет в положение p (без демпфирования) и рендерит кадр.
- Уборка не нужна (одна сцена на страницу). canvas: `touch-action: pan-y`.

## 5. Заглушка `#dalshe`
Фон --cream, текст --ink. H2 слева (Prata 3rem), абзац (max 34rem), кнопка главная со ссылкой из copy (target _blank, rel noopener). Отступы 7rem сверху и 6rem снизу (мобайл 4rem / 4rem). Здесь же на мобайле сноска сцены.

## 6. Обязательные мелочи
- `<title>`: «Место гедониста — дом с баней и чаном, Сингапай». meta description из лида. `theme-color` #0D1A28. Фавикон — inline SVG data-URI: красный кружок-ртуть на тёмном квадрате.
- GSAP и ScrollTrigger — `defer`, из vendor. app.js — `defer`. scene.js подключает app.js динамическим `import()`.
- В `addons/` three используется только `loaders/GLTFLoader.js` и `utils/BufferGeometryUtils.js` (зависимость загрузчика) — остальное не импортировать.
- Без JS страница читается: тексты всех стадий видны списком (класс `no-js` на html снимается скриптом).
- Zero-Bug: стартовые сдвиги только через gsap.set; никаких `height:1.15em; overflow:hidden` у навигации; line-height кириллицы ≥ 1.3 в тексте; нет горизонтальной прокрутки на 390px (`rect.right <= innerWidth` у всех элементов).
- 0 ошибок в консоли.

## Критерии приёмки (builder проверяет сам перед отчётом)
1. `python3 -m http.server` из docs/, страница открывается, 0 console.error.
2. На 1440×900 и 390×844 нет горизонтальной прокрутки.
3. Все тексты совпадают с copy/index.md дословно, типографика русская.
4. `document.querySelector('.scene3d').dataset.ready === "true"` через 4s после прокрутки к сцене (в headless с программным WebGL).
5. `window.__plot.setProgress(0.42)` меняет кадр; итог счёта меняется 15 000 → 19 000 → 23 000 ₽.

## Запрещено
Менять тексты и цены; добавлять секции, отзывы, иконки-эмодзи, счётчики, градиентный текст, стекло-блюр как украшение; подключать что-либо с CDN; выдумывать факты о базе; читать и менять файлы вне проекта.

## Формат отчёта (не длиннее 25 строк)
Таблица «критерий | PASS/FAIL | замер», список созданных файлов с числом строк, отступления от ТЗ с причиной, что не удалось проверить.
