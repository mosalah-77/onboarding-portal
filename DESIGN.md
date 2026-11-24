# Samepage design

Updated 24 November 2026. `app/globals.css` is the source of truth; this page explains the choices behind it.

## The idea

A website brief is a short conversation between a studio and a client, so the interface is one. The studio asks six questions in a thread, the client answers in the composer, and a panel on the right shows where the brief stands. There is no form page.

## Layout

- A top bar with the mark, the current project, the seat switch (Client or Studio) and the theme button.
- The thread on the left with the composer under it. The composer changes with the question: a text box, page tick boxes, two choices with a file picker, or a calendar.
- A panel on the right, 22rem wide: a status card with the main action, then three stages (the client answers, the studio reviews, approved and work starts).
- Under 860px the panel folds into a bar above the thread and opens on tap. The composer stays at the bottom.
- The client seat shows its own project as a plain label. Only the studio seat gets a project menu.

## Colour

Blues drawn from one family, with flat fills. No gradients.

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--bg` | `#eef4fc` | `#17181c` | Page and thread background |
| `--panel` | `#fff` | `#1f2126` | Bars, panel, inputs |
| `--bubble` | `#fff` | `#2b2e35` | The other person's messages |
| `--ink` | `#0f1b40` | `#eeeff2` | Text |
| `--quiet` | `#56628a` | `#a6aab6` | Secondary text |
| `--line` | `#d7e2f3` | `#33363e` | Rules and input borders |
| `--me` | `#2553cc` | `#265bc2` | Your own messages, status card, approval card |
| `--accent` | `#1b62d6` | `#2463cc` | Primary buttons, stage markers |
| `--sky` | `#8fd0ff` | `#36435f` | Avatars, focus ring on inputs |
| `--soft` | `#dcedff` | `#273146` | Ticks, the editing chip |

Dark mode is a neutral charcoal with the same blue for messages and actions. It is a second set of values for the same tokens, switched by `data-theme` on the root element. The first visit follows the system setting and the button remembers a choice.

## Type

Figtree, self-hosted as one variable file, weights 400 to 600. Nothing heavier is used. Questions stand out by size (1.25rem at weight 450) and the status heading by size (1.6rem at 600). Body text is 1rem with a 1.5 line height.

## Shape

Corners are small and consistent: 11px on message bubbles with a 3px corner on the speaker's side, 9px on the status card, 8px on menus and the calendar, 7px on inputs, 6px on buttons. Only avatars and stage markers are round. Surfaces are flat. The project menu and the confirmation dialog are the only raised layers.

## Motion

Two things move: a message arriving (0.22s) and the tick on the approval card. Both are switched off under `prefers-reduced-motion`.

## Writing

The studio speaks in the first person and asks plain questions. Labels are the words a client would use: "Photos and logo", "Launch date", "Anything else". Status lines say who has the brief and what happens next.

## Accessibility

Every control has a visible label or an `aria-label`. Focus is always visible. The calendar takes arrow keys, and focus moves to the new control when the composer changes. Speaker names are read out before each message.
