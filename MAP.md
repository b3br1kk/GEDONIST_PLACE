# MAP — карта кода (генерируется scripts/project_map.py, руками не править)

Сначала читай эту карту, затем открывай только нужный диапазон строк файла.

## app.js — 413 строк

| Строка | Тип | Имя / триггер |
|---|---|---|
| 8 | fn | $ |
| 9 | fn | $$ |
| 10 | fn | small |
| 11 | fn | clamp01 |
| 12 | fn | smooth |
| 23 | banner | Шкала ---------- |
| 32 | fn | renderT |
| 37 | fn | rail |
| 38 | fn | setTemp |
| 46 | banner | Открытие ---------- |
| 52 | banner | Иней на створках окна ---------- |
| 53 | fn | fern |
| 71 | fn | frostURL |
| 84 | fn | paneFrost |
| 87 | banner | Снег за окном ---------- |
| 90 | fn | snowSize |
| 95 | fn | snowTick |
| 106 | fn | snowSync |
| 119 | banner | Видео пролёта ---------- |
| 120 | const | DUR |
| 121 | fn | srcFor |
| 122 | fn | loadVideo |
| 126 | fn | waitReady |
| 130 | fn | fin |
| 131 | fn | yes |
| 138 | fn | later |
| 143 | banner | Состояния: зал → пролёт → двор ---------- |
| 145 | fn | setState |
| 146 | fn | fieldPx |
| 148 | fn | flightSync |
| 157 | fn | goYard |
| 182 | fn | skip |
| 190 | fn | showMapInstant |
| 196 | fn | enterMap |
| 219 | fn | backToHall |
| 223 | fn | swap |
| 254 | banner | Сдвиг двора пальцем (телефон) ---------- |
| 255 | fn | enablePan |
| 263 | fn | disablePan |
| 276 | banner | Двор: наведение по маскам, карточки ---------- |
| 277 | const | KEYS |
| 278 | const | TEMPS |
| 280 | const | POS |
| 289 | fn | keyAt |
| 296 | fn | byK |
| 297 | fn | setHot |
| 304 | fn | select |
| 332 | fn | closeCard |
| 373 | banner | Чек ---------- |
| 375 | fn | fmt |
| 376 | fn | pad |
| 379 | fn | printRow |
| 383 | fn | renderBill |
| 407 | banner | Цвет шкалы на светлой заглушке ---------- |

## index.html — 180 строк

| Строки | Блок | id | Класс |
|---|---|---|---|
| 26–168 | section | dvor | stand |
| 53–65 | header |  | topbar |
| 161–163 | nav |  | chips |
| 170–175 | section | dalshe | next |

Ассеты: app.js?v=4, assets/img/banya.webp?v=1, assets/img/chan.webp?v=1, assets/img/fly-first-1600.webp?v=1, assets/img/fly-last-1600.webp?v=1, assets/img/hall.webp?v=1, assets/img/qr-chat.svg?v=1, assets/img/terrace.webp?v=1, assets/img/yard-peek.webp?v=1, styles.css?v=3, vendor/gsap/gsap.min.js?v=1

## styles.css — 295 строк

Разделы по комментариям: 58 Стенд: зал → пролёт → двор; 110 Двор: подсветка построек и метки

| Строки | Блок (префикс селектора) | Правил |
|---|---|---|
| 1, 2, 3, 4, 5 | @font-face | 5 |
| 7–23 | :root | 1 |
| 26–26 | html | 1 |
| 33–33 | body | 1 |
| 42–44 | btn | 3 |
| 49–56 | thermo | 8 |
| 59–153 | stand | 16 |
| 70–75 | topbar | 5 |
| 81–84 | hall | 3 |
| 87–102 | peek | 16 |
| 103, 213 | @keyframes | 2 |
| 105–107 | skip | 3 |
| 108–187 | back | 2 |
| 111–123 | glows | 2 |
| 113–131 | glow | 18 |
| 136–144 | pin | 9 |
| 146–188 | map | 7 |
| 157–172 | card | 16 |
| 173–176 | toggle | 4 |
| 177–185 | days | 9 |
| 192–195 | printer | 4 |
| 196–212 | receipt | 17 |
| 216–221 | next | 6 |
| 226, 282, 287, 292 | @media | 4 |

Мелкие блоки (1 правило): 23

