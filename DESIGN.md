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
    fontSize: "1.9rem"
    fontWeight: 550
    lineHeight: 1.1
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
  surface: "12px"
  button: "7px"
  field: "6px"
  status: "5px"
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
    padding: "0.6rem 0.9rem"
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
    padding: "0.6rem 0.7rem"
    width: "100%"
  navigation:
    backgroundColor: "{colors.green-dark}"
    textColor: "{colors.ground}"
    padding: "1.8rem 1.25rem"
  status-waiting:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.warning-ink}"
    typography: "{typography.status}"
    rounded: "{rounded.status}"
    padding: "0.23rem 0.55rem"
  status-approved:
    backgroundColor: "{colors.success}"
    textColor: "{colors.success-ink}"
    typography: "{typography.status}"
    rounded: "{rounded.status}"
    padding: "0.23rem 0.55rem"
  editor:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "2rem"
  readiness:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "1.3rem"
  readiness-ready:
    backgroundColor: "{colors.success}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "1.3rem"
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

**Key Characteristics:**

- Cream ground, dark green framing and white editing surfaces.
- Editorial headings paired with compact, sentence-case controls.
- Readiness, versions and accepted facts remain visibly distinct.
- Flat surfaces with borders; one elevated confirmation dialog.

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

The workspace has a horizontal identity bar above a full-height navigation rail. The default rail is 236px wide. The content area has a maximum width of 1550px and uses a flexible editor column beside a 310px review column, with a 2rem gap. Readiness and requests occupy the right column; handoff and history continue below the editor. Activity sits beside those later sections.

The DOM order is readiness, editor, requests, handoff, history, activity. Desktop grid areas create the two-column view; stacked layouts retain that source order. This preserves the small-screen reading and keyboard sequence.

| Viewport | Implemented adaptation |
| --- | --- |
| At least 1550px | Content side padding and column gap grow to 3rem; the review column grows to 350px. |
| At most 1200px | The rail narrows to 210px; the review column becomes 280px, with a 1.2rem gap. Editor padding reduces and paired fields stack. |
| At most 1000px | Work sections form one vertical column with a 1.8rem gap. Paired fields return to two columns while room permits. Readiness actions use their natural width. |
| At most 650px | Navigation becomes a block above the workspace. Section links wrap, fields stack, and editor actions fill the available width. The page uses 1rem side gutters. |

At the smallest breakpoint, project titles reduce to 2.1rem, the welcome title to 3.2rem and the guide title to 2.2rem. Workflow numbers reduce to 1.8rem and their supporting captions hide; the stage names remain visible. Accepted facts change from a 125px label column to stacked labels and values.

The reading guide is centered within 880px. Its four-part diagrams use equal columns on larger screens and stack at the smallest breakpoint. Tables keep their columns and use tighter padding on mobile. Existing 350px and 390px captures show the resulting narrow layouts.

## Elevation & Depth

Work surfaces are flat. White, cream and pale green fills separate editing, supporting content and accepted facts. Fine borders carry grouping without a shadow on every panel.

The native confirmation dialog is the only raised surface. It uses the shadow `0 16px 48px #102b2433`, with a translucent `#142e2366` backdrop. Its maximum width is 520px. No custom animation or transition is authored; reduced-motion rules disable either if later inherited.

**The Dialog Depth Rule.** Reserve elevation for the confirmation dialog. Keep the editor, readiness and handoff surfaces flat.

## Shapes

Panels use the shared surface radius. Buttons and fields have smaller corners; status labels use the tightest recurring radius. Fine one-pixel borders appear on fields, editor panels, diagrams and row separators. Status labels are compact rectangles, without pill ends.

The workflow strip uses large serif numbers and a rule under each stage. Its current stage darkens the text and rule; completed stages use the action green. Form controls retain native select arrows, date affordances, checkboxes and disclosure markers.

## Components

### Buttons

Primary actions have white text on green and use dark green on hover or press. Secondary actions are white with ink text and a muted border. The destructive confirmation uses white text on error red; that pairing remains on hover and press. The shared controls have a minimum height of 44px and semibold type (weight 600, line height 1.35). Secondary hover changes the fill to pale green and strengthens the border; the pressed state darkens that pale fill. Disabled buttons use reduced opacity (0.58) and the unavailable cursor.

Keyboard focus uses a three-pixel outline with a three-pixel offset. The dark rail overrides its color with the light ground color. Labels identify the action and, for submission or approval, the version it affects.

### Inputs and field messages

Fields use a white fill, muted green-gray border and full available width. Textareas resize vertically. Disabled fields keep full text opacity with a pale fill and muted text. An invalid field gains an error-colored border and a nearby written explanation. `aria-invalid` and `aria-describedby` connect that explanation and the existing help to the field.

Labels stay above the controls. Required and optional notes sit beside the label on larger screens and below it on mobile. Date fields keep the nearby explanation that a requested date requires a delivery agreement.

### Navigation

The dark rail groups persona selection, project selection and in-project links. A selected project becomes a white tile with dark green text and `aria-current="page"`. Section links have a green hover fill. The mobile rail remains visible above the workspace and wraps its links into available rows.

### Status labels

Waiting and approved labels share the compact status typography and corner shape. Their text distinguishes Draft, Submitted, Approved, Required, Optional and Resolved. Version labels use the same approved treatment within accepted handoff. These labels are static information rather than controls.

### Editor and readiness

The editor is the main white panel, with a ruled heading and a saved-version or unsaved-change label. Readiness is a separate tinted panel with a serif heading, the saved version it evaluates, linked blockers and the next available action. Its fill switches from amber to pale green when the required inputs and requests are complete.

### Accepted handoff

The pale green handoff panel has a serif heading and a visible accepted-version label. Fact rows use muted labels and readable values. Long values wrap. The suggested checklist retains its planning qualification and links each item to its source fact. The download action follows the list. An empty handoff uses the same surface with an explanation of the required approval.

### Requests and history

Native disclosure sections use ruled rows. Open requests expose the explanation, existing comments and a labeled reply field. Comment blocks use a pale green fill and modest corners. Saved revisions are readable disclosures; activity uses compact text rows with separate actor and time metadata.

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
