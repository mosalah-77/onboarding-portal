---
name: Client Brief
description: AI-authored design system for the synthetic client onboarding portal.
colors:
  green: "#245442"
  green-dark: "#173c2e"
  ground: "#f4f2ed"
  surface: "#fff"
  ink: "#202e29"
  muted: "#57645e"
  line: "#d3dad4"
  shell: "#e7ece5"
  success: "#e4f1e8"
  success-ink: "#24543a"
  warning: "#fbefd6"
  warning-ink: "#754b13"
  error: "#9a3028"
  error-bg: "#fff0ed"
  focus: "#2467bd"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "4.5rem"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "2.8rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  readiness:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "1.6rem"
    fontWeight: 550
    lineHeight: 1.15
  handoff:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "1.8rem"
    fontWeight: 550
    lineHeight: 1.35
  title:
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "1.2rem"
    fontWeight: 650
    lineHeight: 1.35
  body:
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "0.9rem"
    fontWeight: 600
    lineHeight: 1.55
  status:
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "0.75rem"
    fontWeight: 650
    lineHeight: 1.5
  step:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "2.5rem"
    fontWeight: 400
    lineHeight: 1
rounded:
  surface: "16px"
  button: "10px"
  field: "10px"
  status: "999px"
  diagram: "8px"
spacing:
  inline: "0.6rem"
  field-gap: "1rem"
  section: "1.8rem"
  column: "2rem"
  wide-column: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.surface}"
    rounded: "{rounded.button}"
    padding: "0.6rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.green-dark}"
    textColor: "{colors.surface}"
  button-primary-active:
    backgroundColor: "{colors.green-dark}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "0.6rem 0.9rem"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.surface}"
    rounded: "{rounded.button}"
    padding: "0.6rem 0.9rem"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0.65rem 0.8rem"
    width: "100%"
  navigation:
    backgroundColor: "{colors.green-dark}"
    textColor: "{colors.ground}"
    padding: "1.6rem 1.1rem"
  status-waiting:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.warning-ink}"
    typography: "{typography.status}"
    rounded: "{rounded.status}"
    padding: "0.23rem 0.7rem"
  status-approved:
    backgroundColor: "{colors.success}"
    textColor: "{colors.success-ink}"
    typography: "{typography.status}"
    rounded: "{rounded.status}"
    padding: "0.23rem 0.7rem"
  editor:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "2rem"
  readiness:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "1.4rem"
  readiness-ready:
    backgroundColor: "{colors.success}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "1.4rem"
  handoff:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "1.8rem"
  workflow-steps:
    textColor: "{colors.muted}"
    padding: "0"
---

# Design System: Client Brief

## Overview

**Creative North Star: "The working brief"**

Warm cream pages and a dark green navigation rail frame a practical workspace. White fields give longer answers room to breathe. Newsreader adds an editorial voice to the project name, readiness and accepted handoff; system sans carries labels, requests and activity. Fine rules and restrained state fills keep the screen easy to scan.

The same palette and type pairing carry into the reading guide. Its narrower measure and plain diagrams suit longer explanations. This AI-authored reference records the implemented system in `app/globals.css` and the portal components, with the approved direction in `docs/surface.md`. The sidecar's generated tonal strips are preview aids; the frontmatter holds the shipped color values.

Claude (Anthropic) revised this reference on 23 November 2026 after an interface pass that changed corner sizes, the navigation rail, the readiness card and motion. The sidecar was not regenerated.

**Key Characteristics:**

- Cream ground, dark green framing and white editing surfaces.
- Editorial headings paired with compact, sentence-case controls.
- Readiness, versions and accepted facts remain visibly distinct.
- Flat surfaces with borders; one elevated confirmation dialog.
- Short motion that never blocks input.

## Colors

The palette combines warm neutrals with a muted green accent and reserved colors for workflow state.

### Primary

`green` colors primary actions and text links. `green-dark` anchors the navigation rail, the current workflow stage and primary-button hover. The rail uses the light `ground` color for text and keyboard focus.

### Neutral

`ground` is the page and identity-bar background. `surface` is the white editor and field fill. `shell` separates accepted facts from the draft. `ink` carries primary text, `muted` carries supporting text, and `line` divides sections and repeated rows.

### State and focus

The `warning` pair marks incomplete or waiting work. The `success` pair marks readiness, approval and resolved requests. `error` marks invalid fields; `error-bg` fills the page-level error summary. `focus` is the blue keyboard outline on light surfaces. These state colors accompany readable labels and explanations.

**The Named State Rule.** A colored status always names the state. A blocker names the missing input and links to its field.

## Typography

Newsreader is self-hosted in `public/fonts/newsreader-roman.woff2`, with Georgia and serif fallbacks. The file provides normal weights from 200 through 800 and loads with `font-display: swap`. The body uses the operating system's sans serif stack. There is no separate display-font dependency on a remote service.

The frontmatter records the desktop hierarchy. Display type belongs to the welcome screen; the headline role belongs to project titles. Readiness and accepted-handoff headings use their own serif roles. Standard section headings, form labels and long answers use sans serif. The guide's title is slightly larger than a project title (3rem), while the brand link is smaller (2rem, weight 650).

Body paragraphs have a maximum measure of 72ch. Introductory welcome copy uses 54ch; guide paragraphs use 70ch. Supporting text ranges from 0.75rem to 0.9rem. Workflow numbers use lining, tabular numerals so their widths remain stable.

**The Editorial Heading Rule.** Use Newsreader for identity, the principal heading and the named workflow summaries. Keep editable content and ordinary section labels in system sans.

## Layout

The workspace has a sticky, translucent identity bar (60px) above a navigation rail that stays in view while the page scrolls. The default rail is 236px wide. In the workspace the brand is plain text; on the guide it links home. The content area has a maximum width of 1550px and uses a flexible editor column beside a 310px review column, with a 2rem gap. Readiness and requests occupy the right column; handoff and history continue below the editor. Activity sits beside those later sections.

The DOM order is readiness, editor, requests, handoff, history, activity. Desktop grid areas create the two-column view; stacked layouts retain that source order. This preserves the small-screen reading and keyboard sequence.

| Viewport | Implemented adaptation |
| --- | --- |
| At least 1550px | Content side padding and column gap grow to 3rem; the review column grows to 350px. |
| At most 1200px | The rail narrows to 210px; the review column becomes 280px, with a 1.2rem gap. Editor padding reduces and paired fields stack. |
| At most 1000px | Work sections form one vertical column with a 1.8rem gap. Readiness actions use their natural width. |
| Height at most 600px | The bar and rail are no longer sticky. This covers short windows and a laptop zoomed to 200% or more. |
| At most 650px | Navigation becomes a static block above the workspace. The role switcher lays its three options in one row. Section links wrap, fields stack, and editor actions fill the available width. The page uses 1rem side gutters. |

At the smallest breakpoint, project titles reduce to 2.1rem, the welcome title to 3.2rem and the guide title to 2.2rem. Workflow numbers reduce to 1.8rem and their supporting captions hide; the stage names remain visible. Accepted facts change from a 125px label column to stacked labels and values.

The reading guide is centered within 880px. Its four-part diagrams use equal columns on larger screens and stack at the smallest breakpoint. Tables keep their columns and use tighter padding on mobile. Existing 350px and 390px captures show the resulting narrow layouts.

## Elevation & Depth

Work surfaces are flat. White, cream and pale green fills separate editing, supporting content and accepted facts. Fine borders carry grouping without a shadow on every panel.

The native confirmation dialog is the only raised surface. It uses the shadow `0 16px 48px #102b2433`, with a translucent `#142e2366` backdrop. Its maximum width is 480px and its corners are 20px. The identity bar is translucent (90% ground color with a 16px backdrop blur) so content scrolls beneath it; it becomes solid under `prefers-reduced-transparency`.

**The Dialog Depth Rule.** Reserve elevation for the confirmation dialog. Keep the editor, readiness and handoff surfaces flat.

## Motion

Motion is CSS-only and animates opacity and transform. The shared curve is `cubic-bezier(.2,.8,.2,1)`.

| Where | What moves | Timing |
| --- | --- | --- |
| Workspace and welcome load | Sections rise 10px and fade in, staggered 40 to 70ms apart | 0.5 to 0.6s |
| Status message, error summary, new comment | Rise and fade in | 0.3s |
| Buttons | Color eases; a press scales to 0.98 | 0.12 to 0.16s |
| Fields | Border color eases on hover and focus | 0.16s |
| Disclosures | Chevron rotates; revealed content fades in | 0.22 to 0.28s |
| Readiness card and workflow strip | Fill, rule and text color ease between states | 0.4s |
| Confirmation dialog | Fades and scales from 0.97; backdrop fades | 0.2 to 0.26s |
| Loading placeholder | A light band sweeps across | 1.6s loop |
| In-page links | Smooth scroll | browser default |

Nothing waits for an animation: controls respond while sections are still arriving. Under `prefers-reduced-motion` every animation and transition is removed and scrolling is instant.

**The Arrival Rule.** Motion marks something arriving or changing state. It never delays an action, and only the loading placeholder loops.

## Shapes

Panels use the shared 16px surface radius. Buttons and fields use 10px; status labels are small pills. Fine one-pixel borders appear on fields, editor panels, diagrams and row separators.

The workflow strip uses large serif numbers and a two-pixel rule under each stage. Its current stage darkens the text and rule; a completed stage shows a check mark in place of its number and uses the action green. Dropdowns draw their own arrow so they match the other fields in every browser; date fields and checkboxes stay native. Disclosures use a drawn chevron that turns when opened.

## Components

### Buttons

Primary actions have white text on green and use dark green on hover or press. Secondary actions are white with ink text and a muted border. The destructive confirmation uses white text on error red; that pairing remains on hover and press. The shared controls have a minimum height of 44px and semibold type (weight 600, line height 1.35). The welcome screen's start button is a larger variant. Secondary hover changes the fill to pale green and strengthens the border; the pressed state darkens that pale fill. Disabled buttons use reduced opacity (0.58) and the unavailable cursor.

Keyboard focus uses a three-pixel outline with a three-pixel offset. The dark rail overrides its color with the light ground color. Labels identify the action and, for submission or approval, the version it affects.

### Inputs and field messages

Fields use a white fill, muted green-gray border and full available width. The border turns green on hover and focus; keyboard focus keeps the blue outline. Textareas resize vertically. Disabled fields keep full text opacity with a pale fill and muted text. An invalid field gains an error-colored border and a nearby written explanation. `aria-invalid` and `aria-describedby` connect that explanation and the existing help to the field.

Labels stay above the controls. Required and optional notes sit beside the label on larger screens and below it on mobile. Small uppercase group titles (The basics, Scope, Assets and timing, Project files) divide the brief form. Date fields keep the nearby explanation that a requested date requires a delivery agreement.

### Navigation

The dark rail groups the role switcher, project selection and in-page links under small uppercase headings. The role switcher is a group of three buttons; the current role is a white tile with `aria-pressed="true"`. A selected project becomes a white tile with dark green text and `aria-current="page"`. Other rail items show a faint light fill on hover. The foot of the rail states when the demo expires and holds the start-over action. The mobile rail remains visible above the workspace and wraps its links into available rows.

### Status labels

Waiting and approved labels share the compact status typography and pill shape. Their text distinguishes Draft, Submitted, Approved, Required, Optional and Resolved. Version labels use the same approved treatment within accepted handoff. These labels are static information rather than controls.

### Editor and readiness

The editor is the main white panel, with a ruled heading and a saved-version or unsaved-change label. Once a brief is approved, the editor states that it is locked and drops its save and upload controls.

Readiness is a separate tinted card labelled "Next step". Its serif heading says what is left and who acts ("1 thing to finish before submitting", "Waiting for the agency owner", "Ready for your approval"). Below it sit the linked blockers or a one-line explanation, the single next action, and the saved version the check used. A client who has submitted gets a button that switches to the agency owner. Its fill switches from amber to pale green when the required inputs and requests are complete.

### Approved handoff

The pale green handoff panel, titled "Approved handoff", has a serif heading and a visible approved-version label. Fact rows use muted labels and readable values. Long values wrap. The suggested checklist retains its planning qualification and links each item to its source fact. The download action follows the list. An empty handoff uses the same surface with an explanation of the required approval.

### Requests and history

Disclosure sections use ruled rows. Open requests expose the explanation, existing comments and a labeled reply field. Comment blocks use a pale green fill and modest corners. Saved revisions are readable disclosures; activity uses compact text rows with separate actor and time metadata.

### Workflow strip and reading diagrams

The three-stage strip is an ordered list with a programmatically named current step. Its numbers are decorative, while Brief, Review and Handoff remain readable stage names. The guide uses a separate four-column diagram pattern: white cells, thin rules and a bold sentence-case lead in each cell.

## Do's and Don'ts

### Do:

- Do keep the warm ground, white editor and dark green navigation together.
- Do preserve Newsreader headings and the system sans used by fields and longer requests.
- Do pair state colors with written labels, linked blockers and visible version numbers.
- Do keep readiness before the editor in the source order used by stacked layouts.
- Do retain visible keyboard focus, linked field errors and the existing control sizes.
- Do keep synthetic-data labels and AI authorship disclosures visible where they appear.

### Don't:

- Don't apply the dark rail's background color to the long-form editing surface.
- Don't replace state explanations with color alone.
- Don't turn the suggested checklist or requested deadline into a delivery promise.
- Don't add shadows to the flat work panels.
- Don't hide workflow stage names when their smaller captions are removed.
- Don't add motion that loops, bounces or makes a control wait.
