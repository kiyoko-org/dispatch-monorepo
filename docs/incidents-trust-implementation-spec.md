# Incidents Trust View + Admin Profile Refactor Spec

Date: 2026-03-18
Status: Draft
Owner: Dashboard / `packages/dashboard-frontend`
Companion research: `docs/incidents-trust-view-research.md`

---

## 1. Purpose

Implement trust visibility on the dashboard incidents page safely.

Goals:
- add trust level column to the incidents table
- add trust level filter
- add trust level sorting
- remove the incidents page dependency on the current `useProfiles()` hook
- keep existing incident workflows working
- avoid breakage in sibling apps:
  - `../dispatch`
  - `../dispatch-officer`

---

## 2. Problem Statement

Current incidents page limitations:
- no trust column in the incidents table
- no trust filter
- no trust sorting
- trust is only visible in the edit dialog
- incidents page currently depends on `useProfiles()` for:
  - witness names/emails
  - resolve-dialog trust lookup

Current `useProfiles()` concerns:
- fetches all profiles directly
- performs N+1 follow-up work
- uses `auth.admin.getUserById(...)`
- is not a good client-side admin read pattern
- expensive for what the incidents page actually needs

---

## 3. Design Summary

Use two separate read paths on the incidents page.

### A. Incidents + trust read model
Use a new DB view:
- `public.incident_reports_with_trust`

Expose it through a new incidents-specific realtime hook.

This becomes the source of truth for:
- incidents table rows
- trust column
- trust filter
- trust sorting
- current trust shown in resolve flow

### B. Admin profile directory for witness display
Replace `useProfiles()` on the incidents page with a safer admin-only profile read hook.

Use the existing backend profile aggregation path:
- `get_profiles_with_emails()`
- proxied through `/api/profiles`

This becomes the source of truth for:
- witness names
- witness emails

---

## 4. Guardrails

These are hard constraints.

### Shared API safety
- [ ] Do **not** change `fetchReports()` behavior in place
- [ ] Do **not** change `useReports()` behavior in place
- [ ] Do **not** change `useRealtimeReports()` behavior in place
- [ ] Do **not** change the shape returned by existing reports hooks

### Cross-app safety
- [ ] Do **not** require code changes in `../dispatch`
- [ ] Do **not** require code changes in `../dispatch-officer`
- [ ] Keep new logic additive and dashboard-scoped

### Data safety
- [ ] Keep all writes on base tables (`reports`, `officers`, existing RPCs)
- [ ] Treat the new incidents view as read-only
- [ ] Do **not** manually edit `packages/dispatch-lib/database.types.ts`

### Delivery safety
- [ ] Ship as one implementation pass, but keep internal execution order strict
- [ ] Deploy DB view before deploying code that reads it

---

## 5. Why This Is Safe for Other Apps

Checked sibling apps:
- `../dispatch`
- `../dispatch-officer`

Findings:
- neither app currently uses `useProfiles()`
- citizen app has already moved current-user profile state to app-owned context
- officer app uses shared report hooks, but not `useProfiles()`
- both apps are pinned to GitHub package SHAs, not this workspace package

Implication:
- additive dashboard-only work is safe
- changing existing shared reports hooks would be risky and must be avoided

---

## 6. Scope

### In scope
- [ ] secure admin profile proxy path
- [ ] add new incidents trust view
- [ ] add type generation for the view
- [ ] add incidents-specific realtime hook
- [ ] add admin profile read hook for witness display
- [ ] migrate dashboard incidents page to new hooks
- [ ] add trust column / filter / sorting

### Out of scope
- [ ] no rewrite of assignment flow
- [ ] no rewrite of merge flow
- [ ] no rewrite of archive flow
- [ ] no rewrite of attachment handling
- [ ] no rewrite of dashboard users page UX
- [ ] no changes to mobile citizen app
- [ ] no changes to officer app
- [ ] no changes to existing shared report hooks
- [ ] no trust column in PDF export in first pass

---

## 7. Single-Pass Implementation Order

This work should be done in **one implementation pass**, but in this internal order:

1. harden admin profile read/update path
2. add incidents trust view + type sync
3. migrate incidents page to new hooks

Reason:
- keeps dependency order safe
- avoids half-migrated states
- preserves easy rollback if a later step fails

---

## 8. Step 1 — Harden Admin Profile Read/Update Path

### Objective
Make admin profile reads safe before incidents page depends on them.

### Files
- `packages/dispatch-lib/index.ts`
- `packages/dashboard-frontend/app/api/profiles/route.ts`
- optional helper files if needed:
  - `packages/dashboard-frontend/lib/server/auth.ts`
  - `packages/dashboard-frontend/lib/server/supabase.ts`

### Changes

#### 8.1 Add auth-aware proxy request helper in `DispatchClient`
Update proxy path behavior used when `useProxy: true`.

Requirements:
- [ ] include bearer token from current Supabase session when available
- [ ] send token in `Authorization` header
- [ ] send JSON headers when needed
- [ ] use `cache: "no-store"` for admin reads
- [ ] route both `fetchProfilesWithEmails()` and `updateTrustScore()` through this helper

#### 8.2 Harden `/api/profiles`
Route must enforce auth + admin access before executing privileged work.

Requirements:
- [ ] validate bearer token
- [ ] resolve authenticated user
- [ ] verify dashboard-allowed role from `public.profiles`
- [ ] return `401` for unauthenticated requests
- [ ] return `403` for authenticated but unauthorized requests
- [ ] keep `GET` wired to `get_profiles_with_emails()`
- [ ] keep `PATCH` wired to trust score update

### Safety notes
- dashboard uses `useProxy: true`
- mobile/officer apps do not use this proxy path
- this change stays isolated to dashboard web behavior

### Step 1 checklist
- [ ] users page still loads after route hardening
- [ ] manual trust update still works
- [ ] unauthenticated `/api/profiles` request fails correctly
- [ ] unauthorized `/api/profiles` request fails correctly
- [ ] no regressions in existing dashboard trust management

---

## 9. Step 2 — Add Incidents Trust View + Type Sync

### Objective
Create the DB read model for incidents enriched with trust score.

### Files
- new migration in `packages/dispatch-lib/supabase/migrations/`
- `packages/dispatch-lib/package.json`
- generated `packages/dispatch-lib/database.types.ts`

### View name
- `public.incident_reports_with_trust`

### View shape
Must include:
- [ ] `reports.*`
- [ ] `coalesce(profiles.trust_score, 0) as reporter_trust_score`

Recommended SQL shape:
- [ ] `left join public.profiles p on p.id = r.reporter_id`
- [ ] `with (security_invoker = true)`
- [ ] no `ORDER BY` inside the view
- [ ] add grants if needed for dashboard browser access

### Type sync workflow
Current repo guidance mentions `bun run sync-types`, but the script is missing.

Requirements:
- [ ] add `sync-types` script to `packages/dispatch-lib/package.json`
- [ ] run type generation after creating the view
- [ ] verify `Database["public"]["Views"]["incident_reports_with_trust"]` exists

### Safety notes
- this step should add schema support only
- page code should not switch to the view until the generated types are ready

### Step 2 checklist
- [ ] migration added
- [ ] view exists in DB
- [ ] type generation works
- [ ] generated types include the new view
- [ ] existing incidents page still runs unchanged before Step 3 begins

---

## 10. Step 3 — Migrate Incidents Page to New Hooks

### Objective
Move incidents page off `useProfiles()` and onto safer, purpose-built read paths.

This step should only start after:
- [ ] admin profile proxy auth is working
- [ ] `incident_reports_with_trust` exists
- [ ] generated types include the new view

### New dashboard-local hooks
Recommended new files:
- `packages/dashboard-frontend/hooks/useRealtimeIncidentReportsWithTrust.ts`
- `packages/dashboard-frontend/hooks/useAdminProfilesWithEmails.ts`

Reason for local hooks:
- lowest blast radius
- no shared API churn
- easier rollback
- avoids changing mobile/officer consumers

---

## 11. Hook Specs

## 11.1 `useRealtimeIncidentReportsWithTrust`

### Responsibility
Fetch incidents from the view and keep them fresh.

### Data source
- `incident_reports_with_trust`

### Type
- `Database["public"]["Views"]["incident_reports_with_trust"]["Row"]`

### Exposed contract
- [ ] `reports`
- [ ] `loading`
- [ ] `error`
- [ ] `isConnected`
- [ ] optional `refresh()`

### Behavior
- [ ] initial fetch from the view
- [ ] subscribe to `public.reports`
- [ ] subscribe to `public.profiles`
- [ ] refetch the view when either table changes
- [ ] debounce refetches to handle merge/status/trust bursts
- [ ] guard against stale responses winning

### Non-goals
- [ ] do not patch joined state manually
- [ ] do not write to the view
- [ ] do not replace shared `useRealtimeReports()`

---

## 11.2 `useAdminProfilesWithEmails`

### Responsibility
Provide admin-safe witness profile lookups for the incidents page.

### Data source
- `fetchProfilesWithEmails()`
- dashboard proxy path `/api/profiles`

### Exposed contract
- [ ] `profiles`
- [ ] `profilesById`
- [ ] `loading`
- [ ] `error`
- [ ] `refresh()`

### Behavior
- [ ] fetch enriched profiles once
- [ ] build a `Map<string, Profile>` lookup
- [ ] subscribe to `public.profiles`
- [ ] perform debounced refresh on relevant profile changes

### Non-goals
- [ ] do not reuse the old `useProfiles()` implementation
- [ ] do not perform N+1 auth admin lookups in the browser

---

## 12. Incidents Page Migration Spec

### File
- `packages/dashboard-frontend/app/dashboard/incidents/page.tsx`

### Import changes
Remove:
- [ ] `useRealtimeReports`
- [ ] `useProfiles`

Add:
- [ ] `useRealtimeIncidentReportsWithTrust`
- [ ] `useAdminProfilesWithEmails`

### Type changes
Introduce local alias:
- [ ] `type IncidentReport = Database["public"]["Views"]["incident_reports_with_trust"]["Row"]`

Update local page state to use `IncidentReport` where needed:
- [ ] list rows
- [ ] selected report for detail
- [ ] selected report for assignment
- [ ] selected report for edit
- [ ] merge selection state
- [ ] archive confirm state

### Trust UI additions
Add helpers in-page:
- [ ] `getTrustLevelLabel(score)`
- [ ] `getTrustBadge(score)`

Use existing trust semantics:
- [ ] `0` -> Untrusted
- [ ] `1` -> Low Trust
- [ ] `2` -> Trusted
- [ ] `3` -> Highly Trusted

### Trust filter
Add state:
- [ ] `trustFilter`

Supported values:
- [ ] `all`
- [ ] `0`
- [ ] `1`
- [ ] `2`
- [ ] `3`

Add UI:
- [ ] trust filter dropdown in incidents filters row

### Trust filtering logic
- [ ] filter against `report.reporter_trust_score`
- [ ] preserve existing search/date/category/status/archive filtering

### Trust sorting logic
- [ ] add sortable trust table header
- [ ] sort by `reporter_trust_score`
- [ ] preserve existing sort behavior for current columns

### Trust display
- [ ] add trust column to incidents table
- [ ] display trust badge/label per row

### Resolve dialog trust source
Replace current resolve-flow trust lookup.

Current behavior uses `profiles.find(...)`.

New behavior:
- [ ] read from `selectedReport.reporter_trust_score`

### Witness display migration
Replace profile lookup for witness rendering.

Current behavior uses:
- `profiles?.find(...)`

New behavior:
- [ ] use `profilesById.get(witnessData.user_id)`
- [ ] preserve current fallback name logic
- [ ] preserve current witness email display

### Detail dialog compatibility
- [ ] keep `IncidentDetailDialog` behavior unchanged
- [ ] only widen or adapt its report prop typing if TypeScript requires it
- [ ] do not redesign the dialog in this implementation

---

## 13. Existing Behavior That Must Not Regress

These workflows must keep working exactly as they do now.

### Merge flow
- [ ] merge attachments
- [ ] merge `what_happened`
- [ ] add secondary reporters as witnesses
- [ ] merge witness statements
- [ ] archive secondary reports
- [ ] set merged secondaries to cancelled/archived

### Assignment flow
- [ ] assign officers
- [ ] unassign officers
- [ ] update report status to assigned/pending
- [ ] notify officers
- [ ] notify reporter

### Edit flow
- [ ] edit status
- [ ] edit category/subcategory
- [ ] resolve with police notes
- [ ] cancel with reason
- [ ] increment trust on resolve when chosen
- [ ] decrement trust on prank call

### Detail flow
- [ ] open incident detail dialog
- [ ] show attachments
- [ ] image/video preview
- [ ] downloads still work
- [ ] witness dialog still works
- [ ] response time still works

### Archive flow
- [ ] archive resolved reports
- [ ] local archived visual behavior still works

### Realtime UX
- [ ] new incident toasts still work
- [ ] highlight animation for new rows still works

---

## 14. Optional / Deferred Work

Do not include in the first pass unless needed.

- [ ] add trust to PDF export columns
- [ ] extract shared trust badge component
- [ ] move dashboard-local hooks into `dispatch-lib`
- [ ] optimize witness/profile refresh strategy beyond debounced refetch
- [ ] expand the view with reporter names if a second use-case appears

---

## 15. Validation Plan

## 15.1 Type validation
- [ ] run `bunx tsc -p packages/dashboard-frontend/tsconfig.json --noEmit`
- [ ] resolve any new type issues in touched files only

## 15.2 Lint validation
Important: dashboard already has unrelated lint failures.

Rules for this work:
- [ ] do not rely on full lint pass as sole gate
- [ ] fix any new lint issues introduced by touched files
- [ ] avoid expanding unrelated lint cleanup scope

## 15.3 Manual test matrix

### Security
- [ ] `/api/profiles` unauthenticated -> `401`
- [ ] `/api/profiles` unauthorized -> `403`
- [ ] `/api/profiles` admin -> success

### Users page regression
- [ ] users page loads
- [ ] trust update works
- [ ] trust changes persist

### Incidents page load
- [ ] page loads
- [ ] stats cards still render
- [ ] incidents table still renders
- [ ] no crash on missing trust/profile data

### Trust feature tests
- [ ] trust column displays correctly
- [ ] trust filter `all` works
- [ ] trust filter `0` works
- [ ] trust filter `1` works
- [ ] trust filter `2` works
- [ ] trust filter `3` works
- [ ] trust sort ascending works
- [ ] trust sort descending works

### Combined filtering tests
- [ ] trust + status filter works
- [ ] trust + category filter works
- [ ] trust + subcategory filter works
- [ ] trust + date range filter works
- [ ] trust + archived toggle works

### Realtime tests
- [ ] new report insert updates incidents list
- [ ] trust change from users page updates incidents trust display
- [ ] resolve + increment trust updates incidents trust display
- [ ] prank-call decrement updates incidents trust display

### Existing incident actions
- [ ] open detail dialog
- [ ] witness names still render
- [ ] witness emails still render
- [ ] assign officers works
- [ ] unassign officers works
- [ ] edit status works
- [ ] resolve works
- [ ] cancel works
- [ ] merge works
- [ ] archive works
- [ ] export PDF still works

---

## 16. Rollout Plan

### Internal execution order
- [ ] complete Step 1 first
- [ ] complete Step 2 second
- [ ] complete Step 3 last

### Deploy order
- [ ] deploy DB migration before code that reads the view
- [ ] deploy app code after the view exists

### Release safety
- [ ] do not deploy incidents view reader before migration is live
- [ ] if everything ships together, ensure migration runs first in the target environment

---

## 17. Rollback Plan

### If incidents page migration fails
- [ ] revert incidents page back to existing `useRealtimeReports()` + `useProfiles()` usage
- [ ] leave the DB view in place; harmless if unused

### If admin profile hardening fails
- [ ] revert route hardening and proxy request helper together
- [ ] do not leave the dashboard client and server auth expectations mismatched

### If view/type sync work fails
- [ ] revert migration before any code begins depending on the view

---

## 18. Final Acceptance Criteria

All must be true before considering this complete.

- [ ] incidents page no longer uses `useProfiles()`
- [ ] incidents page trust column works
- [ ] incidents page trust filter works
- [ ] incidents page trust sorting works
- [ ] trust values stay fresh after profile changes
- [ ] witness names/emails still work
- [ ] users page still works
- [ ] no behavior changes to existing shared report hooks
- [ ] no required code changes in `../dispatch`
- [ ] no required code changes in `../dispatch-officer`

---

## 19. Recommended Execution Checklist

### Preparation
- [ ] confirm admin role policy for dashboard API access
- [ ] decide whether moderators are allowed or admins only
- [ ] add/update `sync-types` script

### Step 1
- [ ] add auth-aware dashboard proxy request helper
- [ ] harden `/api/profiles`
- [ ] verify users page

### Step 2
- [ ] add `incident_reports_with_trust` view migration
- [ ] run type sync
- [ ] verify generated types

### Step 3
- [ ] add `useRealtimeIncidentReportsWithTrust`
- [ ] add `useAdminProfilesWithEmails`
- [ ] migrate incidents page imports
- [ ] add trust filter
- [ ] add trust column
- [ ] add trust sorting
- [ ] switch resolve dialog trust source
- [ ] switch witness lookup to `profilesById`
- [ ] run manual test matrix

---

## 20. Recommended Default Decisions

If no further product decision is given, use these defaults:
- [ ] admin access only for `/api/profiles`
- [ ] trust filter labels should match users page exactly
- [ ] trust fallback should be `0` when missing
- [ ] no PDF trust export in first pass
- [ ] dashboard-local hooks first, shared-lib extraction later only if justified
