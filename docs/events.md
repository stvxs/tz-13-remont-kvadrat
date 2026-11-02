
# События GA4 - Квадрат Ремонт

| Событие | Назначение | Статус |
|---|---|---|
| page_view | Просмотр страницы | DebugView подтвердил на главной `page_location=http://localhost/index.html`, `page_title=Квадрат Ремонт - ремонт квартир под ключ`; на калькуляторе `page_location=http://localhost/calculator.html`, `page_title=Калькулятор ремонта - Квадрат Ремонт` |
| scroll | Прокрутка страницы | Проверено в GA4 DebugView: `percent_scrolled=90` |
| click | Переход по внешней ссылке | DebugView подтвердил автоматическое событие Telegram-ссылки: `link_url=https://t.me/kvadrat_sales`, `outbound=true`; ручная отправка удалена во избежание дублей |
| file_download | Скачивание файла | DebugView подтвердил PDF чек-листа: `file_name=/files/checklist-priemka-25-points.pdf`, `file_extension=pdf`; отдельно подтверждалось событие скачивания PDF договора. |
| form_start | Начало заполнения формы | DebugView подтверждён: `form_id=lead-form`; автоматическое Enhanced Measurement, ручная отправка удалена |
| form_submit | Отправка формы | Проверено в DebugView: одно событие, `form_id=lead-form`; за ним следует `generate_lead` |
| generate_lead | Отправка заявки | Проверено в GA4 DebugView: `lead_repair_type=designer`, `area_m2=50`, `lead_source=direct`; имя, телефон и e-mail отсутствуют в раскрытых параметрах. Заявка ранее подтверждена в Google Sheets. |
| cta_click | Нажатие на CTA-ссылку | DebugView подтвердил два места: в шапке `button_name=Рассчитать ремонт`, `page_section=header`; в основном содержимом `button_name=Рассчитать стоимость`, `page_section=content` |
| repair_type_select | Выбор типа ремонта | Проверено в GA4 DebugView: при выборе капитального ремонта параметр `repair_type=capital`. В калькуляторе начальное значение — пустой обязательный пункт «Выберите тип ремонта», поэтому пользователь должен сделать осознанный выбор. |
| repair_calc | Расчёт стоимости ремонта | Проверено в GA4 DebugView: `repair_type`, `area_m2`, `total_price`, `days` совпали с контрольным примером И-13 |
| portfolio_filter | Изменение фильтра портфолио | Проверено визуально и в DebugView: `object_type=secondary`; `new_build` оставляет капитальный пример, `secondary` — косметический и дизайнерский. |
| project_view | Открытие демонстрационной карточки | Проверено в DebugView: `project_id=demo-designer`, `repair_type=designer`. Используются только демонстрационные данные. |
| stage_open | Раскрытие этапа ремонта по нажатию | Проверено в GA4 DebugView: `stage_id=stage_8`; все 8 карточек визуально проверены |
| promo_copy | Копирование промокода | Проверено в GA4 DebugView: событие содержит `promo_code=SMETA24`. Передача кода через форму в Apps Script и запись в столбец N Google Sheets также подтверждены скриншотами. |
| contact_click | Нажатие на телефон или почту | Подтверждено в GA4 DebugView: `contact_type=phone` и `contact_type=email`; номера и адреса не передаются |
| messenger_click | Нажатие на мессенджер | Подтверждено в GA4 DebugView: `messenger=telegram`; URL и личные данные не передаются |
| social_click | Нажатие на ссылку соцсети | Подтверждено в DebugView для Instagram в двух местах: `network=instagram`, `page_section=footer` и `page_section=thanks`. Ссылки демонстрационные, аккаунты не созданы |
| form_error | Ошибка отправки формы | Проверено в GA4 DebugView: `error_type=validation`, `field_name=phone`; в событии нет значений личных данных. Ошибка изолирована на неверном телефоне. |
| video_play | Запуск учебной анимации «Как мы принимаем электрику» | Подтверждено в GA4 DebugView; `video_title=Как мы принимаем электрику`. Это собственная SVG-анимация, не видеозапись и не файл MP4/WebM. |
| gallery_view | Увеличение изображения карточки | Проверено в DebugView: `project_id=demo-designer`, `photo_index=1`; показывается AI-визуализация демонстрационного примера. |

## Примечания

- События проверялись в GA4 Realtime и DebugView; для `stage_open` DebugView подтвердил параметр `stage_id=stage_8`.
- `click` и `form_start` собираются GA4 Enhanced Measurement; ручной `click` и `form_start` удалены. Поскольку форма отменяет нативную отправку и передаёт данные через `fetch`, `form_submit` вручную отправляется один раз после HTML-валидации. В DebugView пользователь видел `form_submit`, за которым следовал `generate_lead`.
- `generate_lead` проверено: тестовая заявка записывается в Google Sheets, событие фиксируется в GA4. В DebugView подтверждены `lead_repair_type=designer`, `area_m2=50`, `lead_source=direct`; имя, телефон и e-mail не передаются среди раскрытых параметров события.
- Для `stage_open` используется параметр `stage_id`, как указано в ТЗ и коде.
- Параметры `repair_calc` проверены по контрольному примеру И-13 в DebugView. Для `repair_type_select` событие отправляется при изменении dropdown; пустой начальный пункт требует явного выбора. После добавления placeholder пользователь подтвердил нативную валидацию и событие DebugView с `repair_type=capital`.
- В `portfolio.html` фильтрация происходит на клиенте по типу жилья и диапазону площади. В браузере подтверждено, что диапазон «До 50 м²» оставляет карточку 42 м². Изменение фильтра отправляет `portfolio_filter`; открытие карточки — `project_view`; увеличение AI-визуализации — `gallery_view`. DebugView подтвердил `object_type=secondary`, `project_id=demo-designer`, `repair_type=designer`, `photo_index=1`. Custom-события портфолио обрабатываются в `js/analytics.js`.
- `gallery_view` срабатывает при увеличении AI-визуализации выбранной демонстрационной карточки. Изображения не являются фотографиями реальных объектов.
- На `stages.html` добавлены ссылка на демонстрационный PDF и авторская SVG-анимация с управлением. Скриншоты GA4 DebugView подтвердили `file_download` (включая текст ссылки) и `video_play` с `video_title=Как мы принимаем электрику`. PDF — учебный макет без реальных реквизитов/условий; анимация не является видеозаписью реального объекта или MP4/WebM.
- На `checklist.html` добавлены 25 пунктов приёмки, PDF, кнопка копирования `SMETA24` и CTA на калькулятор. PDF формируется скриптом `scripts/build_checklist_pdf.py` из тех же HTML-пунктов; его ссылка использует автоматическое измерение скачивания GA4. После успешного копирования код сохраняется в `sessionStorage` и подставляется в необязательное поле `promo_code` формы заявки; он передаётся в Apps Script/Google Sheets, но не отправляется в GA4. Пользователь добавил заголовок `promo_code` в колонку N листа `leads` и обновил развёртывание Apps Script. Контрольная отправка подтвердила запись `SMETA24` в столбец N; DebugView подтвердил событие `promo_copy` с параметром `promo_code=SMETA24`.
- Для `social_click` пользователь отдельно подтвердил в DebugView Instagram-ссылку в подвале (`page_section=footer`) и основной блок страницы `thanks.html` (`page_section=thanks`). Другие демонстрационные ссылки и реальные переходы из публикаций ещё не проверялись.
- Скачивание PDF договора и PDF чек-листа подтверждено событием `file_download`. Для чек-листа DebugView дополнительно подтвердил `file_name=/files/checklist-priemka-25-points.pdf` и `file_extension=pdf`.
- Статусы «Настроено» не означают, что событие прошло отдельную проверку в GA4.


## Скриншоты из архива пользователя

В `screens/ga4/` сохранены отобранные кадры DebugView по `page_view` главной и калькулятора, `scroll`, калькулятору, пути формы, промокоду, портфолио, этапам, скачиванию PDF и кликам. Несколько значений параметров показаны на отдельных кадрах одного и того же сценария; их список дан в `screens/README.md`.

Для страницы контактов кадра DebugView `page_view` с раскрытыми `page_location` и `page_title` в архиве нет. Проверка не закрыта, ожидаемые значения не записываются как подтверждённые. Скриншоты Google Sheets и Apps Script из архива не добавлены: первые показывают значения строк, вторые — URL/идентификаторы развёртывания.
