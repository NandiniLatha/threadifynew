# Threadify — Full Production QA Audit Log
**Branch**: `full-audit-fix`
**Environment**: Local dev (Supabase project from `.env`) — NOT prod data, NOT running destructive SQL

---

## Running Audit Table

| # | Area | Issue | Severity | Root Cause | Fix Applied | Status |
|---|------|-------|----------|------------|-------------|--------|
| 1 | Tailor Layout | UUID regex uses `&#8377;` instead of `$` at end anchor — `isTailorPublicProfile` never matches, so public tailor profile pages always render the full dashboard sidebar | **Medium** | Stray Unicode char in regex literal on line 104 of `app/tailor/layout.tsx` | Fix regex terminator from wrong char to `$` | Fixed |
| 2 | Tailor Requests | Label copy: `"Price Quote Quote Price"` — duplicated word | **Low** | Typo in label on line 269 | Fix to `"Quote Price (Rs.)"` | Fixed |
| 3 | Tailor Requests | Empty state copy: `"You haven't created a custom order yet. Yet"` — wrong copy for a tailor | **Low** | Incorrect copy on line 161 | Fix copy | Fixed |
| 4 | Design Studio | No double-submit guard — `isSubmitting` set but submit buttons not disabled | **Medium** | Both buttons lack `disabled={isSubmitting}` in JSX | Add disabled props to both buttons | Fixed |
| 5 | Portfolio (Tailor) | Base64 images stored in DB text array — large rows but not a data loss bug | **Low** | Architecture choice | Logged only | Logged |
| 6 | Auth | `forgotPassword` uses `window.location.origin` — safe since dynamically imported in client page | **Low** | N/A | No fix needed | Pass |
| 7 | Auth / Login | `setIsLoading(false)` not called before `router.push()` in success path | **Low** | Missing call on login success path | Add `setIsLoading(false)` before push | Fixed |
| 8 | Middleware | UUID regex correct — passes | **Pass** | — | — | Pass |
| 9 | AI Chat | `/api/chat` confirmed working with mock fallback | **Pass** | — | — | Pass |
| 10 | Notifications | `/api/notifications/unread-count` clean | **Pass** | — | — | Pass |
| 11 | Auth Callback | OAuth callback handles code exchange cleanly | **Pass** | — | — | Pass |
| 12 | Customer Settings | Profile + password forms guarded correctly | **Pass** | — | — | Pass |
| 13 | Quotations API | Role check, field validation, notification firing all correct | **Pass** | — | — | Pass |
| 14 | Signup | `isLoading` not reset before `router.push()` in success path | **Low** | Same pattern as #7 | Add `setIsLoading(false)` before push | Fixed |
