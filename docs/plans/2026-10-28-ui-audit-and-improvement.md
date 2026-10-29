# UI Audit & Improvement Plan — dsa-preset v0.16.3

## Goal

Провести аудит интерфейса плагина `dsa-preset` (командная палитра моделей, конфиг провайдеров, медиа-генерация, релеи) по методологии `frontend-design` и зафиксировать поэтапный план улучшений UI/UX без изменения реализации (только план). Критерии приёмки: план содержит контекст продукта, выявленные точки роста, приоритизированные задачи с путями/символами, проверяемые критерии и риски.

## Context

Репозиторий: `E:\Code\Extensions\plugin\dsh-preset`, ветка `main`, тег `v0.16.3` (commit `da520b5`). Стек: React 18 + TS, DSH plugin API, CSS с дизайн-токенами `--dsw-alias-*`, локали zh/en.

Релевантные места:

- `src/client/ModelPalette.tsx` (~573 строк) — корневой компонент: триггер (composer seat `conversation.input.model`), портал-диалог с 5 вкладками (`models | media | config | catalog | relay`), `EffortSlider`, горячие клавиши `Alt+M`/`Esc`/стрелки/`Enter`, избранное/недавние в `localStorage` (`FAVORITES_KEY`/`RECENTS_KEY`).
- `src/client/ConfigPanel.tsx` (~2281 строк) — «бог-компонент»: CRUD провайдеров, протокол-пробы, валидация API-ключа, синк OpenRouter free, пикеры импорта моделей, retry-правила, reasoning efforts, folds/badges/save-bar/welcome.
- `src/client/MediaPanel.tsx` (~252) — генерация image/video + статус задач + скачивание.
- `src/client/RelayPanel.tsx` (~177) — baiRelay + шаблоны релеев (copyable).
- `src/client/style.css` (415) — токены, диалоги/карточки/гриды, брейкпоинты 680/760/820 px.
- `src/client/locales.ts` (~700 ключей, NS `dsa-preset`) — zh+en.
- `src/client/provider-catalog.ts` (~183) — шаблоны `CUSTOM/SUBSCRIPTION/CATALOG`, 60+ встроенных провайдеров, `providerMeta` regex-матчер бренда, `BRAND_COLORS`.
- `src/client/ProviderIcon.tsx` (~182) — инлайн-монохромные `GLYPHS`, `providerBrandColor`.
- `src/client/types.ts` (~78) — `PaletteProps`, `DirectorySnapshot`, `ModelChoice`.
- `src/client/index.tsx` (~99) — регистрация composer-slot.
- `docs/index.html` (~1324, zh-CN, тёмный градиент-лендинг v0.12.0), `README.md` (~399).

## Approach

Методология `frontend-design`: контекст → направление → проверка → реализация → критика. Поскольку задача — аудит и план, реализация на этом этапе не выполняется. План разбивает работу на фазы: (1) аудит и дизайн-направление, (2) структурная декомпозиция `ConfigPanel`, (3) навигация/IA диалога, (4) визуальная идентичность и доступность, (5) адаптивность, (6) верификация.

### Дизайн-направление (предложение)

- Один запоминающийся элемент: **brand-tinted provider rail** — монохромные глифы окрашиваются акцентом бренда (`BRAND_COLORS`) при активном/наведении, остальной интерфейс функционален и сдержан.
- Палитра: существующие токены `--dsw-alias-*` (не вводить новые цвета). Акценты статусов: зелёный `#2e9e5b` (настроено/free), красный `#d64545` (отсутствует), жёлтый/предупреждение `#d99a2b`.
- Типографика: системный стек DSH (уже), моноширинный только для кодов/ID.
- Композиция: диалог с фиксированной шапкой, горизонтальными табами (вместо 5-вкладочной смеси), скроллируемым телом, sticky save-bar.

## Tasks

### Phase 0 — Аудит (read-only)

1. Инвентаризовать состояния/пропсы и побочные эффекты `ConfigPanel.tsx` (строки 1–2281): выделить группы хуков (`useState`/`useMemo`/`useCallback`/`useEffect`) и мутации API (`api.settings.mutate`, `api.credentials.set`). Результат: таблица «состояние → владелец → мутация».
   - Файлы: `src/client/ConfigPanel.tsx`.
2. Зафиксировать карту IA диалога: 5 вкладок × компоненты × общие ресурсы (токены, локали). Отметить дублирование навигации (provider rail в palette + provider cards в config).
   - Файлы: `src/client/ModelPalette.tsx` (строки 17–19, 376–420), `src/client/style.css`.
3. Проверить доступность: фокус-кольцо (`.dsa-dialog *:focus-visible` строка 408), `aria-modal`, `aria-label` заголовка, клавиатурная навигация списков, `prefers-reduced-motion` (отсутствует).
   - Файлы: `src/client/style.css`, `src/client/ModelPalette.tsx`.
4. Проверить адаптивность: брейкпоинты 680/760/820 и поведение гридов (поиск по `@media`).
   - Файлы: `src/client/style.css`.

### Phase 1 — Структурная декомпозиция `ConfigPanel`

5. Вынести хук состояния провайдера в `src/client/hooks/useProviderEditor.ts` (черновик → namespace → retry → keyDraft → busy/error/feedback). Не менять поведение, только перенос.
   - Символы: `draft`, `keyDraft`, `retryDraft`, `busy`, `error`, `feedback`, `namespace`, `retryNamespace`.
6. Разделить рендер на подкомпоненты в `src/client/components/config/`: `ProviderList`, `ProviderEditor`, `ProtocolProbe`, `ApiKeyValidation`, `ModelImportPicker`, `RetryRules`, `ReasoningEfforts`, `SaveBar`, `Welcome`. Импорты сохранить.
7. Проверить типы: `PaletteApi` из `remote-compat.ts`, `DirectorySnapshot`.

### Phase 2 — IA диалога

8. Заменить 5-вкладочный `ModelPaletteView` на двухуровневую навигацию: верхние табы «Модели / Медиа / Настройки», внутри Настроек — под-вкладки «Провайдеры / Каталог / Релеи». Обновить `aria-label` заголовка (строка 380) и подпись (строка 384).
   - Символы: `ModelPaletteView`, `view`, `show()`.
9. Убрать дублирование provider rail: в config использовать тот же компонент списка провайдеров, что и в palette (единый источник).
10. Сохранить горячие клавиши и фокус-менеджмент.

### Phase 3 — Визуальная идентичность и a11y

11. Применить brand-окраску глифов в `ProviderIcon.tsx`: параметр `colored` уже есть; включить в rail и карточках, с `currentColor` по умолчанию. Проверить контраст на светлой/тёмной теме.
12. Добавить `@media (prefers-reduced-motion: reduce)` для переходов (строки 398–412).
13. Добавить `aria-live="polite"` для статуса загрузки/ошибок и `role="status"` для пустых состояний (`.dsa-empty`).
14. Улучшить пустые состояния: иконка + текст + действие (например, «Добавить провайдера»).

### Phase 4 — Адаптивность

15. Пересмотреть брейкпоинты: единая сетка колонок с `auto-fit, minmax(240px, 1fr)` вместо фиксированных 1/2 колонок; проверить 360/768/1024/1440.
16. На мобиле: rail превращается в горизонтальный скролл-чипы; диалог занимает 100% ширины.

### Phase 5 — Верификация

17. Запустить `pnpm run typecheck` и `pnpm run test` (если есть) после каждой фазы. Проверить сборку `pnpm run build`.
18. Ручная проверка: открыть палитру (`Alt+M`), пройти все вкладки, добавить/отредактировать провайдера, проверить mobile viewport (Playwright `browser_resize`).
19. Обновить `docs/index.html` и `README.md` под новый IA (v0.16.x).

## Verification

- `pnpm run typecheck` — 0 ошибок.
- `pnpm run build` — успешная сборка.
- `pnpm run test` — все тесты зелёные (если есть).
- Ручной walkthrough по чек-листу: Alt+M → поиск → выбор → избранное → конфиг → каталог → медиа → релеи → Esc закрывает.
- Playwright: resize 360/768/1024, проверка отсутствия горизонтального скролла и кликабельности rail-чипов.

## Decisions / Risks

- План не меняет код реализации (только документ). Реализация — отдельная задача после одобрения.
- Риск регрессии при декомпозиции `ConfigPanel` (2281 строк): нужен поэтапный рефакторинг с сохранением поведения и тестов.
- Риск потери состояния при смене IA: сохранить ключи `localStorage` и контракты `PaletteProps`.
- Зависимость от DSH дизайн-токенов: не вводить новые цвета вне `--dsw-alias-*`.
- Дата плана: 2026-10-28. Версия репо: v0.16.3.
