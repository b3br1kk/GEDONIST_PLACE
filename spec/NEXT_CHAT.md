# Продолжение в новом чате

Скажи в новом чате: «Продолжаем проект Место гедониста, пролёт».

Что сделать Claude в начале:
1. Клонировать b3br1kk/GEDONIST_PLACE, прочитать STATE.md (разделы «16.11.2026, поздний вечер» и «17.11.2026, ночь») и этот файл.
2. Загрузить навыки blender-artist (text-to-blender → blender-animation, blender-cameras, blender-rendering, animation-quality-gate).
3. Проверить оба моста: Blender__execute_blender_code (порт 9876) и blender-assets__get_addon_status (9877). Если Blender не запущен — открыть его через computer use (приложение «Blender 5.3.0.0»), мост 9876 стартует сам. Открыть 3d/interior/interior.blend (bpy.ops.wm.open_mainfile через timer), выполнить exec(bpy.data.texts["real_lib.py"].as_string()).
4. Свет вечера: eve(0.6) из real_lib.py (ext_eve из ext_lib.py не работает — мира INT_World больше нет). Рендеры дольше ~60 с запускать через rq([...]) — очередь в таймере, иначе мост отваливается по таймауту 80 с.
5. Сделать черновик ускоренного пролёта (render.opengl animation, 960×600, MP4) → показать пользователю.
6. После «да»: eve(0.6); камера CamFly; Cycles OptiX, 1600×1000, 64 сэмпла, адаптивный порог 0.015, шумодав OptiX (альбедо+нормали), bounces 8/4/3/8, transparent 64, persistent data; компоновщик GEDO_Comp включён (дымка + свечение); PNG в 3d/interior/fly60/f_####.png; render(animation=True). Перед стартом предупредить: ~2–2,5 ч, видеокарту не занимать.
7. Затем: MP4 60 fps crf 16 + WebP-кадры для скролла, карта участка поверх последнего кадра (кликабельны дом, баня, чан, терраса).
