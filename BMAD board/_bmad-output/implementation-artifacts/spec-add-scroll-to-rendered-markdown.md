---
title: 'Add scroll to rendered markdown view'
type: 'bugfix'
created: '2026-07-21'
status: 'done'
route: 'one-shot'
---

# Add scroll to rendered markdown view

## Intent

**Problem:** In the story detail page, the Markdown → Rendered tab did not show a scrollbar when the markdown content exceeded the available viewport, leaving long content inaccessible.

**Approach:** Wrap the `<RichMarkdown>` component inside the rendered view with a flex-growing scrollable container (`flex-1 overflow-auto min-h-0`) so it fills the remaining tab height and scrolls independently.

## Suggested Review Order

- Wrap rendered markdown in scrollable flex container to fill tab viewport
  [`StoryDetailTabs.tsx:231`](../../src/renderer/components/StoryDetailTabs.tsx#L231)

- Outer tab content panel with overflow-auto that could not scroll clipped inner content
  [`StoryDetailTabs.tsx:84`](../../src/renderer/components/StoryDetailTabs.tsx#L84)

- Markdown tab panel with fixed height that previously hid overflowing rendered markdown
  [`StoryDetailTabs.tsx:195`](../../src/renderer/components/StoryDetailTabs.tsx#L195)
