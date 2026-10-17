# Completion, registration, feedback and themes

This update is based on `feature/dsa-learning-lab` at `a9a3c81` and uses the existing Codex Cloud checkout only. No MacBook files or services are involved.

## Foundations completion

The home introduction offers **Mark completed** and disappears once either manual completion is recorded or every current Foundations page is complete. The existing normal rule is unchanged: Next/Mark page complete completes teaching pages, and a quiz submission completes its participation page independently of score. Visiting a lesson or completing one page is insufficient. A compact Foundations link stays above the catalog search even when the introduction is hidden.

Manual completion is a separate boolean in module progress. It satisfies the same prerequisite checks and never generates page events, quiz attempts or scores. The progress screen shows the manual status separately from the number of completed pages. The Foundations module offers **Mark incomplete**, which begins a new pass: its page count starts at zero and all pages must be explicitly completed again for normal completion. Saved experiments, other modules, quiz attempts and their immutable snapshots remain unchanged; previously completed page records are retained locally and archived on the server before reuse.

Flyway V5 adds `lesson_module_progress`, an action journal and a page-progress history table; existing V1–V4 are untouched. Foundations checkpoints carry a progress generation. Old-generation requests after a reset are ignored, so delayed synchronization cannot complete the new pass accidentally. Explicit completion/reset requests use UUID action IDs and optimistic generation checks: retries are idempotent, and conflicting device changes return 409 with a Sync/retry message. These learning metadata fields do not change the C/Wasm event protocol.

IndexedDB version 3 adds module state and per-account guest-import receipts without dropping older stores. Guests persist their manual choice and page progress locally. Login still unions guest completions with account progress and seeds only missing account resume positions. Each actual guest completion update is imported once per account (mere revisits retain the previous completion receipt), preventing an already-acknowledged guest completion from undoing a later explicit reset. Guest incomplete status does not clear existing account completion; reset the signed-in account explicitly. Current-generation page completions remain monotonic until an explicit reset.

The introduction waits until identity and progress restoration finish before deciding whether to appear. Manual completion and reset update the visible completion state only after the local IndexedDB transaction commits; their controls stay disabled during that write. This makes an immediate reload after the introduction disappears safe. A failed local save leaves the previous completion state intact and displays an error. Local pending completion changes survive refreshes and are sent before their page checkpoints. Completion controls remain disabled while a change is pending; use **Sync checkpoints** on the account screen to retry after a connection failure. A reset from another device wins over stale checkpoints. Authentication and ownership come from the server session, never a client owner ID.

## Registration

Registration requires a password and a matching **Confirm password** field. Both use `autocomplete="new-password"`; login keeps `current-password` and its existing behavior. Inline errors appear after interaction or submission, with `aria-invalid`/`aria-describedby` associations. Confirmation exists only in form memory and is omitted from the request and local persistence.

The frontend and backend accept passwords starting at **5 characters**, with no uppercase/lowercase/digit/special-character composition policy. Short passwords show **Password must be at least 5 characters.** The existing 72-character and BCrypt 72-UTF-8-byte safeguards remain. Password hashing and existing hashes are unchanged. No conditions checklist or instructional password text is displayed. Passwords and confirmation must never be logged.

## Graded answer selections

Options stay visible after grading. Only the learner's selected option receives Correct/Incorrect styling and a text indicator. Wrong selections use a gentle red surface and a readable border in both themes; other wrong options are unmarked. Unanswered options have no correctness class. Recorded correctness still comes exclusively from the server; guest practice uses its distinct public bank. Explanations and teaching-slide review links remain available.

Retry clears active answers and feedback before the new attempt; guest retry state also persists so refresh does not restore stale feedback. The previous local practice snapshot remains stored until the next submission. Recorded retries append attempts and never alter history.

## Light and dark appearance

`frontend/public/theme.js` is a blocking, same-origin head script, applied before React/styles paint where practical. It follows `prefers-color-scheme` when `dsalab.theme` has no explicit light/dark choice. The shared header toggle persists explicit choices; **Auto** restores system-following behavior. System changes and cross-tab storage changes update the palette live. When storage is unavailable, the choice still applies for the current page.

Semantic variables in `styles.css` cover page/surface/text/border/accent, warning/error/correctness, visualization and code-token colors. SVG fills/edges/labels use those variables directly; changing appearance does not recreate or advance a visualization. Native controls use the matching color scheme, with themed placeholders, autofill, dropdowns, focus, disabled and hover states. There is no inversion filter. New surfaces and SVG adapters must use semantic roles rather than literal colors outside the palette.

## Verification commands

```sh
npm --prefix frontend run format:check
npm --prefix frontend test
npm --prefix frontend run build
python3 scripts/check-public-assets.py
(cd backend && ./mvnw verify)
# Backend and MySQL running in the cloud checkout:
INTEGRATED=1 npm --prefix frontend run test:e2e
```

Browser acceptance includes manual/normal completion, guest/account refresh and merge/reset/history, delayed authenticated restoration without an introductory flash, password confirmation/request shape, selected-only feedback/retry, system and explicit appearance, and desktop/mobile contrast checks. Original native/Wasm parity and account/experiment flows remain in the suite. See `verification-preferences.md` for actual run results and delivery status.

For the timing-sensitive completion regression, diagnostics and reproduction commands, see [Foundations CI investigation](verification-foundations-ci.md).
