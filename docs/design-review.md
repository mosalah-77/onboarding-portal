disposition: fix

Unavailable inputs: QUALITY BAR card and decision comp; seed provenance cannot be independently checked after the documented launcher failure. This is a code-led build, so no approved comp is expected.

## persistence

Pass. PRODUCT.md and the updated direction contract exist. The self-hosted Newsreader file and its OFL licence are present. DESIGN.md belongs after this review for the new world. All nine current captures in the review packet exist, show the document top where required, and have valid dimensions; desktop-overview.jpg is now a direct 1440×1000 capture without the previous blank band. The earlier denied.jpg supplies behavior evidence only. No detector was rerun. FORM records `seed: none (unavailable)` under the disclosed fallback.

## fidelity

| Element or promise | Judgment | Evidence |
| --- | --- | --- |
| TYPE / OWN-WORLD | match | Newsreader supplies the approved editorial headings; system sans keeps fields and requests readable. |
| MATERIAL | match | Flat work surfaces, fine rules and restrained state fills; no imitation physical texture or unshipped decorative asset. |
| GROUND | match | The warm `#f4f2ed` ground, white editor, ink text and dark green rail retain the named palette. |
| THESIS | match | The missing audience, saved version and readiness explanation remain visible together on desktop. |
| FIRST VIEWPORT | match | Identity bar, project rail and genuine Brief → Review → Handoff stage strip match the revised contract. |
| Responsive composition | adaptation | Stacked readiness and form follow the approved mobile requirement; 350, 390 and 720 CSS-pixel captures remain contained. Keyboard ordering still needs the fix below. |
| STORY | match | Current captures distinguish the incomplete draft and frozen accepted version 5; synthetic labels remain visible. |
| FORM | match | The light, code-led task workspace fits the stated laptop use context. Actual 200% browser zoom remains unverified. |
| Accepted checklist | missing | The accepted capture lacks the promised responsive/accessibility review item and the explicit “suggested delivery checklist” qualification. |
| Field correction | missing | The audience blocker appears in summaries; its field has generic help only, with no inline blocker or programmatic error association. |
| Mobile keyboard sequence | contradicted | CSS visually moves readiness first; DOM places it after the editor, handoff and history. |
| Navigation focus | contradicted | The global blue focus outline has only 2.18:1 contrast against the new dark navigation rail. |

## ceiling

The revised Operate direction uses its editorial lettering, dark framing, sequential workflow and distinct accepted-scope surface. No missing visual device warrants a rebuild. A separate QUALITY BAR comparison is unavailable; ornament and motion are not required by this task’s restrained direction.

## material_fixes

1. Complete the handoff promise: add the responsive/accessibility review task and label the checklist as a suggested delivery checklist, not a delivery promise, in both the UI and downloaded handoff; the accepted capture and components/handoff.tsx:20–27 show the omissions.
2. Complete field-level correction: render the relevant saved blockers/server validation messages beside their inputs and associate them with `aria-describedby` or `aria-errormessage`, using `aria-invalid` where applicable; components/brief-editor.tsx:13–30 currently expose only generic help.
3. Align mobile reading and focus order with the rendered sequence: place readiness before the editor in DOM order and use desktop layout positioning as needed, so tabbing does not traverse form/handoff/history before jumping back to readiness; components/portal.tsx:158–162 and the ≤1000px CSS cause the mismatch.
4. Give the dark rail a focus indicator with at least 3:1 adjacent contrast; `#2467bd` against `#173c2e` computes to 2.18:1, so override the rail’s focus token or use an appropriate two-color outline.

## keep

Keep the Newsreader hierarchy, warm ground, dark rail, real workflow stages, named versions and explicit synthetic status. No browser or tests were rerun; actual 200% zoom remains unverified.

---

## verdict

Post-fix verdict, 8 November 2026; this supersedes the initial four open findings above.

1. **Resolved — handoff checklist.** The desktop handoff viewport and approved mobile capture show “Suggested delivery checklist,” the planning qualification and all six tasks, including responsive layouts/accessibility; the download uses the same task data and qualification, and the new task links to the accepted page list.
2. **Resolved — field-level correction.** Current desktop and mobile captures show the audience message beside the field; the editor connects readiness and structured server errors through `aria-invalid` and `aria-describedby`, preserving the existing help.
3. **Resolved — mobile reading and focus order.** Current mobile captures show readiness → editor → requests → handoff → history → activity, and the component DOM now follows that order; desktop positioning retains the brief/readiness columns without the intermediate readiness-to-requests gap.
4. **Resolved — navigation focus.** rail-focus.jpg visibly shows the light outline around the keyboard-focused Brief link; `#f4f2ed` against `#173c2e` computes to 10.90:1 contrast.

## remaining

Clear. No material regression from the scored fix batch was identified. This ship verdict covers the four scored fixes only, not a new full-surface audit.

The original required desktop/mobile/350px/720px and guide captures were inspected at their existing paths. handoff-desktop-viewport.jpg supplements the clipped checklist line in the full-page approved desktop capture; its rasterization is soft, but the six complete rows are visible and corroborated by the approved mobile capture and source. rail-focus.jpg provides direct focus-state evidence. zoom-200.jpg is excluded because it is malformed; the parent separately verified native Chrome “Zoom: 200%,” devicePixelRatio 4, and matching innerWidth/scrollWidth of 674. Browser actions, tests and the unavailable detector were not rerun by this reviewer.

disposition: ship
