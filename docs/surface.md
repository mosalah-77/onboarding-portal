# Interface surface

Updated 24 November 2026. Target: `app/page.tsx`, `components/portal.tsx`, `components/chat.tsx`, `components/brief-panel.tsx`, `app/globals.css`.

The interface is a conversation. The studio asks six questions, the client answers one at a time, and a side panel shows the state of the brief with the one action that moves it on. A visitor plays the client first, then switches seats and reviews the brief as the studio.

The first screen after starting a demo shows the studio's greeting and first question, an empty answer box with focus ready, and a status card that says how many answers are left. Colours, type and shape are described in [DESIGN.md](../DESIGN.md). The reasons for the main choices are in [decisions](decisions.md).
