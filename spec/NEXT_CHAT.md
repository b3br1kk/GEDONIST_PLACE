# Продолжение в новом чате

Скажи в новом чате: «Продолжаем проект Место гедониста, пролёт».

Что сделать Claude в начале:
1. Клонировать b3br1kk/GEDONIST_PLACE, прочитать STATE.md (раздел «16.11.2026, поздний вечер») и этот файл.
2. Загрузить навыки blender-artist (text-to-blender → blender-animation, blender-cameras, blender-rendering, animation-quality-gate).
3. Проверить оба моста: Blender__execute_blender_code (порт 9876) и blender-assets__get_addon_status (9877). Открыть 3d/interior/interior.blend (bpy.ops.wm.open_mainfile через timer), выполнить install_handler() из gedo_lib.py, проверить миры INT_World/EXT_WorldDay/EXT_WorldEve.
4. Сделать черновик ускоренного пролёта (render.opengl animation, 960×600, MP4) → показать пользователю.
5. После «да»: ext_eve("CamFly", 0.6); Cycles OptiX, 1600×1000, 64 сэмпла, адаптивный порог 0.015, шумодав OptiX (альбедо+нормали), bounces 8/4/3/8, transparent 64, persistent data; PNG в 3d/interior/fly60/f_####.png; render(animation=True). Перед стартом предупредить: ~2 ч, видеокарту не занимать.
6. Затем: MP4 60 fps crf 16 + WebP-кадры для скролла, карта участка поверх последнего кадра (кликабельны дом, баня, чан, терраса).
