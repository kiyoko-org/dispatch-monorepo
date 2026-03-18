# Incidents trust view research

Date: 2026-03-18

## TL;DR

Using a **database view** for incidents + reporter trust is **viable** in this repo and is the cleanest read-model approach.

It is **not** a drop-in replacement for the current incidents page though.

Safe approach:
- add a **new read-only view**
- add a **new fetch/hook** for that view
- keep **all writes** pointed at `public.reports` / `public.officers`
- keep realtime invalidation on **both** `reports` and `profiles`
- do **not** mutate existing shared `useRealtimeReports()` behavior in place

Main risk of a naive swap:
- a view fetch alone will make trust go stale unless we also react to `profiles` updates
- the incidents page still uses profile data for witness names/emails, so a trust view does **not** remove all profile dependencies by itself

---

## What I checked

### Project support for DB-side read models

The project already uses DB-composed reads:
- `packages/dispatch-lib/supabase/migrations/20260304115000_fix_get_profiles_with_emails.sql`
  - defines `public.get_profiles_with_emails()`
  - `SECURITY DEFINER`
- `packages/dispatch-lib/index.ts`
  - `fetchProfiles()` / `fetchProfilesWithEmails()` call that RPC
- `packages/dashboard-frontend/app/api/profiles/route.ts`
  - proxy route for profile/trust reads and trust updates

So architecturally, DB-owned read models are already an accepted pattern here.

### Supabase / schema tooling

Findings:
- Supabase CLI is available in `packages/dispatch-lib`
  - `bunx supabase --version` -> `2.76.16`
- local project temp says Postgres is `17.4`
  - `packages/dispatch-lib/supabase/.temp/postgres-version`
- generated types already have a `Views` section
  - `packages/dispatch-lib/database.types.ts`
  - currently empty: `Views: { [_ in never]: never }`

Implication:
- adding a view is technically supported by the project’s current schema + typegen setup
- Postgres 17 means `security_invoker` is available if we want the view to respect underlying caller permissions

### Important workflow gap

Repo instructions say to run:
- `cd packages/dispatch-lib && bun run sync-types`

But:
- `packages/dispatch-lib/package.json` currently has **no `sync-types` script**

So the view is still viable, but schema/type sync workflow is incomplete right now and should be fixed or handled explicitly before implementation.

---

## Incidents page: current functionality inventory

Main file:
- `packages/dashboard-frontend/app/dashboard/incidents/page.tsx`
- size: ~2546 lines

Related detail dialog:
- `packages/dashboard-frontend/components/incidents/incident-detail-dialog.tsx`
- size: ~447 lines

### Current data sources

The page pulls from 4 live sources:
- `useRealtimeReports()` from `dispatch-lib`
- `useCategories()`
- `useOfficers()`
- `useProfiles()`

### What the page does today

#### 1. Incident list / dashboard behavior
- shows summary stats
- search by title / street / category / subcategory
- filters by:
  - status
  - category
  - subcategory
  - date range
  - archived toggle
- sorts by:
  - id
  - title
  - category
  - incident date/time
  - status
- exports filtered incidents to PDF
- highlights new reports and shows toast notifications for realtime inserts

#### 2. Report detail behavior
- opens a full detail dialog
- shows:
  - title
  - status
  - created date
  - archived state
  - location + lat/lng
  - category/subcategory
  - description
  - officers involved
  - attachments
  - response time
  - police notes
- attachment handling:
  - signed URLs for storage assets
  - image/video preview
  - download support
- witness behavior:
  - maps `report.witnesses` user IDs to names/emails using `profiles`
  - can open witness statement dialog

#### 3. Report edit behavior
- edit category/subcategory
- edit status
- if resolving:
  - optional trust increment toggle
  - police notes
- if cancelling:
  - cancellation reason required on confirm path
  - `Prank Call` decrements trust
- notifies reporter on status change

#### 4. Assignment behavior
- open assignment dialog
- search officers
- assign one or more officers
- unassign officers
- updates report status to `assigned` or back to `pending`
- notifies assigned officers and reporter

#### 5. Merge behavior
- select multiple reports
- choose primary report
- merge attachments
- merge `what_happened`
- move other reporters into witnesses
- merge witness statements
- archive secondary reports
- sets merged secondary reports to `cancelled` + archived

#### 6. Archive behavior
- archive resolved incidents
- keeps local `archivedIds` state to immediately reflect archive state

---

## Incident page dependencies: what a trust view can and cannot replace

| Dependency | Used for | Can a trust view replace it? |
|---|---|---|
| `reports` | main list, stats, dialogs, actions | **Yes**, if the view exposes `reports.*` |
| `profiles` | reporter trust in resolve flow | **Yes**, if view includes `reporter_trust_score` |
| `profiles` | witness names / emails in detail dialog | **No**, not by itself |
| `categories` | labels + subcategory names | No |
| `officers` | assignment dialog + detail dialog | No |
| storage bucket | attachment preview/download | No |

Key finding:
- inside the incidents page, `profiles` is only used in **two places**:
  1. witness name/email mapping
  2. current trust lookup in the resolve dialog

So a trust view solves the list/filter/sort problem cleanly, but it does **not** remove the page’s witness-profile dependency.

---

## Viability assessment for a DB view

## Yes, viable

A plain view is a good fit because this is a **read projection**, not a command.

Recommended shape:

```sql
create or replace view public.incident_reports_with_trust
with (security_invoker = true) as
select
  r.*, 
  p.trust_score as reporter_trust_score
from public.reports r
left join public.profiles p on p.id = r.reporter_id;
```

Why this shape is safe:
- `r.*` preserves all report fields currently used by the page and detail dialog
- `reporter_trust_score` gives a real sortable/filterable column
- the view stays read-only and simple

### Why a view fits this repo better than changing the existing report hook

This repo is a shared monorepo:
- `dispatch-lib` is shared by dashboard + mobile
- `useRealtimeReports()` is also used by `packages/dashboard-frontend/app/dashboard/page.tsx`

Because of that, the safest implementation is:
- **add** `fetchIncidentReportsWithTrust()` / `useRealtimeIncidentReportsWithTrust()`
- do **not** change the meaning or return type of `fetchReports()` / `useRealtimeReports()` in place

That avoids accidental breakage outside the incidents page and respects the monorepo rule to avoid breaking React Native consumers.

---

## What will break if we implement it naively

### 1. Realtime trust freshness will break

Current realtime reports hook:
- `packages/dispatch-lib/react/hooks/useRealtimeReports.ts`
- subscribes only to `public.reports`

Current trust changes come from:
- `public.profiles.trust_score`

Implication:
- if we fetch from a view once and only subscribe to `reports`, trust values in the incidents list will go stale after:
  - manual trust updates
  - resolve-flow increments
  - prank-call decrements

Safe fix:
- new hook must react to **both**:
  - `reports`
  - `profiles`
- simplest implementation: refetch the view on either table change

### 2. Witness details still need profile data

The page uses `profiles` to render witness names/emails in the detail dialog.

Implication:
- replacing the report fetch with a trust view does **not** remove `useProfiles()`
- if we remove `useProfiles()` without replacing that witness lookup, witness display regresses

### 3. Replacing `Report` with a partial row will break dialogs/actions

The incidents page and detail dialog use a lot of report fields, including:
- `attachments`
- `witnesses`
- `reporter_id`
- `what_happened`
- `latitude` / `longitude`
- `officers_involved`
- `police_notes`
- `number_of_witnesses`
- archive/status metadata

Implication:
- the view must include **all report columns**, not only list columns
- easiest: `select r.*`

### 4. Writing through the view would be wrong

The page performs many writes:
- `updateReport()`
- `archiveReport()`
- `addWitnessToReport()`
- direct `supabaseClient.from('reports')` reads/updates during merge
- direct `supabaseClient.from('officers')` updates during assignment

Implication:
- the view should be treated as **read-only**
- all mutations should continue to target base tables (`reports`, `officers`)

### 5. Security can become wrong if the view is exposed carelessly

This dashboard runs with a browser-initialized DispatchClient:
- `packages/dashboard-frontend/components/providers/dispatch-client-provider.tsx`
- anon key + user session

Implication:
- if the dashboard queries the view directly from the browser, DB grants/RLS matter
- for a browser-readable view, `security_invoker = true` is the safer default
- if access rules are complicated, a server proxy route is safer

Note:
- I did **not** find repo migrations defining RLS for `reports` / `profiles`, so current repo-visible policy state is incomplete/unclear
- that is not a blocker for the view itself, but it is a security review item before rollout

### 6. Type sync is currently under-specified

Because `database.types.ts` currently has no views, implementation will need regenerated types.

Problem:
- repo guidance references `bun run sync-types`
- the script does not exist in `packages/dispatch-lib/package.json`

So implementation needs either:
- a restored `sync-types` script, or
- a documented manual `supabase gen types ...` step

---

## Incidents page code risks unrelated to the view, but relevant before touching it

### `useProfiles()` is high-risk / expensive for this page

File:
- `packages/dispatch-lib/react/hooks/useProfiles.ts`

What it does now:
- fetches all rows from `profiles`
- then for every profile:
  - calls `auth.admin.getUserById(id)`
  - runs a `reports` count query

Concerns:
- this is an N+1 style fetch pattern
- it is expensive for a page that only needs witness names/email + some trust reads
- `auth.admin.*` is usually a server/service-role concern, so doing it from a browser hook is risky and likely unsupported

This matters because:
- even after adding a trust view, the incidents page still pays this profile cost unless witness lookup is refactored too

### Baseline typecheck / lint status

I checked dashboard TypeScript:
- `bunx tsc -p packages/dashboard-frontend/tsconfig.json --noEmit`
- result: **passes**

I checked dashboard lint:
- `cd packages/dashboard-frontend && bun run lint`
- result: **fails globally**

Incidents-page-specific lint findings:
- `react-hooks/exhaustive-deps` warning for missing `getCategoryName` dependency
- two `react/no-unescaped-entities` errors in the edit dialog copy

Implication:
- the page already has lint debt
- adding the view should not assume a clean lint baseline

---

## Recommended implementation shape

### 1. Add a new view, not a replacement table API

Create:
- `public.incident_reports_with_trust`

Columns:
- `reports.*`
- `reporter_trust_score`

Optional later, only if truly needed:
- `reporter_first_name`
- `reporter_last_name`

Do **not** add witness joins to this view yet. Keep it narrow.

### 2. Add a new fetch method and new hook

In `dispatch-lib`, add something like:
- `fetchIncidentReportsWithTrust()`
- `useRealtimeIncidentReportsWithTrust()`

Do **not** overload existing `fetchReports()` or `useRealtimeReports()`.

Reason:
- avoids breakage in dashboard overview
- avoids hidden API changes for mobile consumers

### 3. Realtime strategy

New hook should:
- fetch from the view for initial data
- subscribe to `public.reports`
- subscribe to `public.profiles`
- refetch the view when either changes

Simple > clever here.

The page is already complex. Refetch-on-change is safer than trying to patch joined state by hand.

### 4. Keep all mutations on base tables

No writes to the view.

Continue using:
- `updateReport`
- `archiveReport`
- `addWitnessToReport`
- direct `reports` updates for merge witness state
- direct `officers` updates for assignment

### 5. Decide what to do about `useProfiles()`

Two reasonable options:

#### Option A: leave it for now
- use the view for list trust/filter/sort
- keep `useProfiles()` only for witness display
- fastest path

#### Option B: clean it up next
- replace `useProfiles()` usage in incidents with a server-safe/profile-read hook
- likely based on existing `fetchProfilesWithEmails()` proxy path
- better long-term fix

If touching the incidents page anyway, Option B is worth considering soon after.

---

## Conclusion

## Verdict

A view-backed incidents read model is **viable and recommended** for this repo.

It will **not** break current incidents functionality **if** we follow these constraints:
- keep the view read-only
- include `reports.*`
- add a **new** hook instead of mutating `useRealtimeReports()`
- refetch on both `reports` and `profiles` changes
- keep or replace witness-profile lookup separately

## Biggest hidden gotchas

1. trust will go stale if we only subscribe to `reports`
2. witness names/emails still depend on profiles
3. type sync workflow is currently missing a script
4. direct browser access to the view needs security review

## My implementation recommendation

1. create `incident_reports_with_trust` view
2. generate types
3. add `fetchIncidentReportsWithTrust()`
4. add `useRealtimeIncidentReportsWithTrust()` with `reports` + `profiles` invalidation
5. switch **only** the incidents page to the new hook
6. leave writes unchanged
7. optionally refactor `useProfiles()` afterward

---

## Cross-app impact check: `../dispatch` and `../dispatch-officer`

Note:
- user mentioned `../officer`
- the sibling repo present on disk is `../dispatch-officer`

## High-confidence answer

A careful **Option B** refactor of `useProfiles()` for the admin dashboard should **not affect** the mobile citizen app or officer app **if** we keep it additive and incidents-page-scoped.

Main reasons:
1. neither sibling app currently uses `useProfiles()`
2. the citizen app no longer uses lib profile hooks for current-user state
3. the officer app uses other lib hooks (`useRealtimeReports`, `useReports`, `useOfficers`, `useNotifications`), not `useProfiles()`
4. both sibling apps are pinned to **GitHub package SHAs**, not this monorepo workspace package, so changes here do not automatically flow into them

### Dependency isolation right now

`../dispatch/package.json`
- depends on `@kiyoko-org/dispatch-lib` pinned to GitHub commit `a4a4414225ad1a7835c30594502c4d2826bd27a1`

`../dispatch-officer/package.json`
- depends on `dispatch-lib` pinned to GitHub commit `8cce4d62af1219ba6104319108b87b4dd14a5030`

Implication:
- editing `packages/dispatch-lib` in this monorepo does **not** immediately change behavior in those sibling apps unless they later update or relink their dependency

---

## Citizen app (`../dispatch`)

### What it uses from the shared lib now

Confirmed imports include:
- `initDispatchClient`
- `useReports`
- `useOfficers`
- `useNotifications`
- `useBarangays`
- `useHotlines`

### What it does **not** use now

Search findings:
- no current code import of `useProfiles()`
- no current code import of lib `useProfile()`
- no use of `fetchProfilesWithEmails()`
- no use of `fetchProfiles()`

### Current profile architecture in the citizen app

The app has already moved current-user profile state into an app-owned context:
- `../dispatch/contexts/CurrentProfileContext.tsx`

That context:
- reads `public.profiles` directly using the app’s own Supabase client
- owns its own realtime subscription for the current user row

Screens using it now:
- `../dispatch/app/(protected)/home.tsx`
- `../dispatch/app/(protected)/trust-score/index.tsx`

This is also explicitly documented in:
- `../dispatch/docs/app-realtime-refactor-plan.md`

That plan says the app intends to stop relying on lib profile hooks for user-facing profile state.

### Risk to citizen app from Option B

If Option B means:
- add a new dashboard-specific profile read hook, or
- replace dashboard `useProfiles()` usage with a safer admin read path,

then risk to `../dispatch` is effectively **none**.

### What would be risky to the citizen app

Not Option B itself, but these broader shared-lib changes could affect it later:
- changing `useReports()` behavior in place
- changing `fetchReports()` return shape in place
- changing `useRealtimeReports()` behavior in place
- changing exported type contracts used by the app

So for citizen app safety:
- **do not repurpose existing shared report hooks**
- keep the new incidents trust path additive

---

## Officer app (`../dispatch-officer`)

### What it uses from the shared lib now

Confirmed imports include:
- `useRealtimeReports`
- `useReports`
- `useOfficers`
- `useNotifications`
- `useCategories`
- `getDispatchClient`
- `initDispatchClient`

Examples:
- `../dispatch-officer/app/index.tsx` uses lib `useRealtimeReports()`
- `../dispatch-officer/app/report/[id].tsx` uses lib `useReports()` and `useOfficers()`
- `../dispatch-officer/app/profile.tsx` uses lib `useOfficers()` and direct queries via `getDispatchClient()`

### What it does **not** use

Search findings:
- no import of `useProfiles()`
- no import of lib `useProfile()`
- no use of `fetchProfilesWithEmails()`
- no use of `fetchProfiles()`

### Risk to officer app from Option B

If Option B is limited to:
- replacing dashboard `useProfiles()` usage
- adding a new admin-specific profiles/trust fetch path
- leaving current shared hooks intact

then risk to `../dispatch-officer` is also effectively **none**.

### What would be risky to the officer app

The officer app **does** rely on shared reports hooks, especially:
- `useRealtimeReports()`
- `useReports()`

So these would be high-risk changes:
- changing `useRealtimeReports()` semantics
- changing `fetchReports()` return shape
- making report rows no longer look like `public.reports`

This confirms the earlier recommendation:
- add `useRealtimeIncidentReportsWithTrust()` as a **new** hook
- do **not** mutate `useRealtimeReports()` in place

---

## Final cross-app verdict

### Safe

These are safe with respect to `../dispatch` and `../dispatch-officer`:
- adding `incident_reports_with_trust` view
- adding `fetchIncidentReportsWithTrust()`
- adding `useRealtimeIncidentReportsWithTrust()`
- adding a new dashboard/admin-only profile read hook
- replacing incidents-page `useProfiles()` usage with that new hook

### Unsafe / avoid

These could affect sibling apps and should be avoided for this work:
- changing `fetchReports()` shape
- changing `useReports()` behavior in place
- changing `useRealtimeReports()` behavior in place
- removing existing profile/report exports without a migration plan

## Practical conclusion

If we do Option B **additively**, scoped to the dashboard incidents page and admin reads, the mobile citizen app and officer app should **not be impacted**.
