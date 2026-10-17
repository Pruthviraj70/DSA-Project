# REST API v1

Base `/api`. JSON requests reject unknown fields. Paginated private lists and the runtime catalog use `page` (zero-based) and `size` (1..100); page is bounded at 100000. The public runtime catalog has 20 runtime families, returning the latest registered version once per implementation. The bounded lesson catalog contains fourteen teaching modules. Passwords and correctness flags are never included in content or user responses.

Authentication uses an HttpOnly SameSite=Lax session cookie, not browser-stored bearer tokens. Fetch `GET /auth/csrf`; use the returned `headerName` and `token` on each mutation, including registration/login/logout. The frontend obtains a fresh token before mutations. The backend does not grant cross-origin CORS access. Development uses Vite's `/api` proxy; Compose uses Nginx. Set `COOKIE_SECURE=true` behind HTTPS. Production operators should terminate TLS, rate-limit authentication at the ingress, use secret management and backups. This release does not provide email verification, password recovery, or OAuth.

| Method/path | Access | Body / result |
|---|---|---|
| GET /auth/csrf | public | `{token,headerName}` |
| GET /auth/me | public | `{authenticated:false}` or `{authenticated:true,id,email,displayName}` |
| POST /auth/register | public + CSRF | `{email,password,displayName}`; password 5..72 chars and ≤72 UTF-8 bytes; student account and session |
| POST /auth/login | public + CSRF | `{email,password}`; rotates session ID |
| POST /auth/logout | session + CSRF | 204, invalidate session |
| GET /modules | public | paginated module/lesson/version/complexity content |
| GET /modules/{slug}/questions | public | current aligned question revisions/options/concept IDs; no answers or explanations |
| GET /lessons | public | bounded catalog of fourteen lesson IDs/titles/slide counts |
| GET /learning/progress | session | own paginated `{moduleId,slideId,completed,updatedAt}` rows |
| GET /learning/modules | session | own bounded manual module state and current progress generation |
| POST /learning/modules/foundations/completion | session + CSRF | `{completed,generation,actionId}`; manual completion or new-pass reset, UUID idempotency key; 409 on conflicting generation |
| GET /learning/positions | session | own bounded resume positions, one per authored lesson |
| POST /learning/checkpoints | session + CSRF | `{moduleId,slideId,completed,position,seedPosition,generation}`; stable IDs, monotonic completion; seedPosition only fills a missing position |
| GET /progress | session | own paginated checkpoints |
| POST /progress/checkpoints | session + CSRF | `{moduleId,completion}`; returns monotonic stored completion |
| GET /experiments | session | own paginated records |
| POST /experiments | session + CSRF | `{moduleId,title,input,configuration,engineVersion}`; bounded typed engine input; returns record |
| GET /experiments/{id} | owner | record including input/configuration, no frames |
| DELETE /experiments/{id} | owner + CSRF | 204 |
| POST /attempts | session + CSRF | `{moduleId,answers:[{revisionId,optionId}]}`; server computes `{id,score,total,feedback}`; feedback includes answer explanation and concept teaching-slide review links |
| GET /attempts | session | own paginated attempt summaries |
| GET /attempts/{id} | owner | historical answer snapshots |
| GET /reports/difficult-topics | INSTRUCTOR | paginated revision-level difficult-question report |

Errors use `{code,message}` with 400 validation, 401 authentication, 403 authorization/CSRF, 404 missing or non-owned record, 409 uniqueness/relationship conflict. Unexpected server errors use a generic 500 response without stack traces. Ownership queries include the current user ID, never a client-provided owner ID. Official submission does not accept a `score` field. Guest practice questions/keys are intentionally public and distinct from recorded assessment questions. Recorded keys and explanations are returned only after authenticated submission. `.private.json` authoring banks are excluded from browser imports and denied by the Vite development server. A future high-stakes assessment system would need separate private questions and additional integrity controls.

Foundations checkpoints from a previous generation return `{ignored:true,generation}` without mutation. Other modules retain generation 0. Module actions never create assessment attempts or fabricate page completions. Registration confirmation is frontend-only and unknown request fields remain rejected.
