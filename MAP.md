# MAP — карта кода (генерируется scripts/project_map.py, руками не править)

Сначала читай эту карту, затем открывай только нужный диапазон строк файла.

## app.js — 258 строк

| Строка | Тип | Имя / триггер |
|---|---|---|
| 9 | fn | t |
| 10 | fn | $ |
| 11 | fn | small |
| 13 | fn | rail |
| 16 | banner | Шкала ---------- |
| 25 | fn | renderT |
| 36 | banner | Иней ---------- |
| 38 | fn | mk |
| 42 | fn | rStart |
| 43 | fn | rEnd |
| 44 | fn | radius |
| 46 | fn | fern |
| 69 | fn | frostTexture |
| 89 | fn | blob |
| 95 | fn | draw |
| 120 | fn | build |
| 144 | fn | tick |
| 145 | fn | sync |
| 157 | banner | Открытие ---------- |
| 161 | fn | intro |
| 178 | banner | Прокрутка Hero ---------- |
| 182 | scroll | hero |
| 187 | banner | Стадии сцены ---------- |
| 190 | fn | stageOf |
| 195 | fn | goStage |
| 208 | scroll | plot |
| 219 | scroll | '#dalshe' |
| 229 | banner | Счёт ---------- |
| 233 | fn | money |
| 248 | banner | Загрузка 3D ---------- |

## index.html — 139 строк

| Строки | Блок | id | Класс |
|---|---|---|---|
| 29–59 | section | hero | hero |
| 36–48 | header |  | topbar |
| 61–127 | section | uchastok | plot |
| 115–124 | aside |  | bill |
| 129–134 | section | dalshe | next |

Ассеты: app.js?v=2, assets/img/banya.webp?v=1, assets/img/chan.webp?v=1, assets/img/hall.webp?v=1, assets/img/hero-hall.webp?v=1, assets/img/scene-poster.webp?v=2, styles.css?v=2, vendor/gsap/ScrollTrigger.min.js?v=1, vendor/gsap/gsap.min.js?v=1

## scene.js — 236 строк

| Строка | Тип | Имя / триггер |
|---|---|---|
| 9 | fn | clamp01 |
| 10 | fn | smooth |
| 11 | fn | ramp |
| 12 | fn | lerp |
| 13 | fn | stageOf |
| 14 | fn | bell |
| 15 | fn | V |
| 24 | fn | main |
| 99 | fn | puffs |
| 107 | fn | puffStep |
| 124 | fn | pose |
| 146 | fn | lights |
| 153 | fn | markers |
| 170 | fn | step |
| 191 | fn | render |
| 196 | fn | resize |
| 220 | fn | frame |
| 228 | fn | sync |

## styles.css — 185 строк

| Строки | Блок (префикс селектора) | Правил |
|---|---|---|
| 1, 2, 3, 4 | @font-face | 4 |
| 6–18 | :root | 1 |
| 21–21 | html | 1 |
| 28–28 | body | 1 |
| 37–39 | btn | 3 |
| 44–51 | thermo | 8 |
| 54–75 | hero | 11 |
| 61–65 | topbar | 5 |
| 69–70 | line | 2 |
| 79 | @property | 1 |
| 80–121 | plot | 7 |
| 84–90 | scene3d | 6 |
| 92–96 | hotspot | 4 |
| 98–110 | stage | 9 |
| 104–107 | toggle | 4 |
| 112–118 | bill | 7 |
| 124–128 | next | 5 |
| 131–135 | no-js | 5 |
| 137, 177, 182 | @media | 3 |

Мелкие блоки (1 правило): 18

