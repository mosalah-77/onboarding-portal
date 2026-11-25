# Testing

What is checked, how, and what is not. Results are from 24 November 2026.

## Automated

`npm test` runs both suites.

- **35 unit checks** on the rules and the storage paths: readiness and validation, the first-jobs list, the conversation logic, upload failures at each step, approval and hand-back, and cleanup. Storage faults are injected, so recovery is tested and not assumed.
- **16 API checks** against the built Worker with a throwaway local database. They cover one visitor reading another's project or file, one client reading another's, forged roles, missing CSRF tokens, invalid input, two saves racing, a save racing an approval, retries after a lost reply, the largest allowed file and one byte more, reset, ending a demo, operator cleanup, and two requests racing for the last demo slot.

`npm run typecheck` and `npm run lint` are clean.

## In a browser

A scripted browser plays the whole flow: start, six answers including a page added by hand, a file and the calendar, an edited answer, send, ask for changes, change an answer, send version 2, approve, download the handoff, open the second project as the studio and switch back to the client.

- It passes at 1440×900 and 390×844, in light and dark, locally and on the public site, with no page errors and no sideways scrolling.
- Keyboard use passes in Chromium and WebKit: answering moves focus to the next control, arrow keys move through the calendar, and focus is not lost after approving.
- The client seat shows no project menu and its session lists one project.

## Accessibility

axe-core checked the WCAG 2.0, 2.1 and 2.2 A and AA rules on twelve screens, at two widths, in both themes. The first run found contrast failures on faint labels and on the dark-mode message blue. After three colour changes it found none.

## Security

- An independent review of the router, sessions, workflow, uploads, cleanup and interface found no critical or high issue. Isolation between visitors, role checks, CSRF and origin checks, the operator token, SQL parameter binding and upload handling were reported clean. Its findings were missing security headers and no request throttling. Both were fixed.
- Semgrep ran the Trail of Bits, OWASP, JavaScript, TypeScript, React and secrets rule sets and reported nothing in the code.
- `npm audit --omit=dev` reports nothing. The full audit reports moderate advisories in development tools only.
- A search of the git history for key and token formats found nothing.

## On the public site

After each deploy: one visitor cannot read another's project (404). A 1,900,000-byte file uploads and comes back byte for byte, and one byte more returns 413. A wrong CSRF token returns 403, cleanup without the operator token returns 401, and the client seat cannot approve (403). The security headers are present and hashed scripts are cached for a year. Repeated demo starts from one address are cut off with 429. Test data is deleted afterwards.

The hourly cleanup was run locally by firing the scheduled event against a database holding one live and one expired demo. It removed the expired one and left the other.

## Not checked

- A screen reader, and a real phone.
- The public site in WebKit.
- Behaviour at the free plan's daily limits.
- The rate limits from more than one real address.
