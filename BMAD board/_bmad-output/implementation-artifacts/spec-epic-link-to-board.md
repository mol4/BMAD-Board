---
title: 'Epic link to board from story sidebar'
type: 'feature'
created: '2026-07-14'
status: 'done'
baseline_commit: 'd611764944d056e100340e2ed0a32b71bf26e4cd'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** На странице деталей story в сайдбаре поле Epic отображается простым текстом. Пользователь хочет кликнуть по нему и перейти на Board с предустановленным фильтром по этому эпику.

**Approach:** Обернуть название эпика в `<Link>` с переходом на `/board?epic={epicId}`. На странице Board читать query-параметр `epic` через `useSearchParams` и использовать его как начальное значение `selectedEpicId`.

## Boundaries & Constraints

**Always:**
- Использовать `<Link>` из `react-router-dom`
- Использовать `useSearchParams` для чтения query-параметра на BoardPage
- Инициализировать `selectedEpicId` из query-параметра при первом рендере
- Поддерживать обратную совместимость: `/board` без параметра работает как раньше
- Стиль ссылки должен визуально выделять её кликабельность (hover + accent color)

**Ask First:** N/A

**Never:**
- Не менять header на StoryDetailPage (только сайдбар)
- Не трогать DashboardPage
- Не менять существующее поведение выпадающего списка фильтра на Board — query-параметр задаёт только начальное значение
- Не добавлять новые зависимости в проект

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Клик по эпику в сайдбаре | story.epicId = "abc-123" | Переход на `/board?epic=abc-123`, Board открывается с фильтром по этому эпику | N/A |
| Board открыт без параметра | `/board` (без query) | `selectedEpicId = ''` (All Epics) — поведение без изменений | N/A |
| Board открыт с несуществующим epicId | `/board?epic=nonexistent` | Фильтр установлен в "nonexistent", доска показывает 0 stories — пользователь может выбрать другой эпик из выпадающего списка | N/A |
| Story без эпика | story.epicId = undefined / null | Эпик в сайдбаре не отображается — поведение без изменений | N/A |

</frozen-after-approval>

## Code Map

- `src/renderer/components/StoryDetailTabs.tsx` — сайдбар с отображением эпика (L161-165)
- `src/renderer/pages/BoardPage.tsx` — страница доски с выпадающим фильтром по эпику (L23, L110-149)
- `src/renderer/lib/store.ts` — `getEpic()` метод (L128)
- `src/renderer/lib/types.ts` — типы Epic, Story

## Tasks & Acceptance

**Execution:**
- [x] `src/renderer/pages/BoardPage.tsx` — добавить `useSearchParams`, читать `epic` query-параметр, установить как начальное значение `selectedEpicId` — подхватывает query-параметр при навигации
- [x] `src/renderer/components/StoryDetailTabs.tsx` — обернуть `epic.title` в `<Link to={/board?epic=${story.epicId}}>` с accent-стилем и hover — делает эпик кликабельной ссылкой на board

**Acceptance Criteria:**
- Given story с привязанным эпиком, when пользователь смотрит страницу деталей story, then в сайдбаре название эпика отображается как ссылка с hover-эффектом
- Given пользователь кликает по ссылке эпика в сайдбаре, when происходит переход на `/board`, then выпадающий фильтр доски предустановлен на выбранный эпик
- Given story без эпика, when пользователь смотрит страницу деталей, then секция Epic в сайдбаре отсутствует (поведение без изменений)
- Given пользователь открывает `/board` без query-параметра, when страница загружается, then фильтр показывает "All Epics" (поведение без изменений)

## Spec Change Log

## Verification

**Commands:**
- `npm run build` — expected: сборка без ошибок
- `npm run test -- --run` — expected: существующие тесты проходят

**Manual checks (if no CLI):**
- Открыть страницу story с эпиком → проверить, что эпик в сайдбаре — кликабельная ссылка
- Кликнуть → проверить переход на `/board?epic=...` и предустановленный фильтр
- Открыть story без эпика → проверить отсутствие секции Epic
- Открыть `/board` напрямую → проверить дефолтное поведение "All Epics"

## Suggested Review Order

- Query param entry point: `useSearchParams` lazy-initializes `selectedEpicId` — backward-compatible, no sync needed
  [`BoardPage.tsx:23`](../../src/renderer/pages/BoardPage.tsx#L23)

- Epic title wrapped in `<Link>` with `encodeURIComponent` and accent+hover Tailwind classes
  [`StoryDetailTabs.tsx:165`](../../src/renderer/components/StoryDetailTabs.tsx#L165)

- Test updated to assert `<a>` tag and exact `href` including hash-router prefix
  [`StoryDetailTabs.test.tsx:104`](../../src/renderer/components/StoryDetailTabs.test.tsx#L104)
