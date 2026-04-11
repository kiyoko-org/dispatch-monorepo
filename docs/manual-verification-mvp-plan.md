# Manual Verification MVP Plan

## Context

Current verification flow supports only automated Philippine National ID verification:

- Mobile app: `/Volumes/realme/Dev/kiyoko-org/dispatch/app/(protected)/profile/index.tsx`
- Edge Function: `/Volumes/realme/Dev/kiyoko-org/dispatch/supabase/functions/verify-national-id/index.ts`
- Access gate: `/Volumes/realme/Dev/kiyoko-org/dispatch/app/(protected)/(verified)/_layout.tsx`

That flow already sets `profiles.is_verified = true` automatically after PhilSys verification.

We now want to support manual verification for alternative identity documents such as:

- Driver's license
- Passport
- Postal ID
- UMID
- Other admin-approved IDs

## Goals

- Keep one final source of truth for access control: `profiles.is_verified`
- Add a manual verification workflow for non-PhilSys documents
- Store uploaded identity documents securely
- Let admins review and approve/reject requests in the dashboard
- Preserve history of verification submissions

## Non-Goals for MVP

- OCR or automatic parsing for non-PhilSys documents
- Public document URLs
- A fully normalized multi-file attachment model
- Replacing the current National ID flow

## Final MVP Decisions

1. Keep `profiles.is_verified` as the final access-control flag
   - `true` = verified
   - `false` = unverified
   - `null` = legacy/admin/system special-case behavior if still needed

2. Add a new **private** storage bucket:
   - `verification-docs`

3. Add a new table:
   - `public.verification_requests`

4. Use a **single-table MVP schema** with these document columns:
   - `front_storage_path`
   - `back_storage_path`

5. Enforce `document_type` with a Postgres enum
   - gives real DB-level validation
   - flows into generated Supabase TypeScript types

6. Use `profile_id`, not `user_id`
   - This is profile/domain data, not auth-only data

7. Keep `profiles.id_card_number` reserved for PhilSys / National ID PCN only
   - Do not overload it with driver's license or passport numbers

8. Use **storage paths**, not public URLs
   - Admin dashboard should generate signed URLs when previewing files

9. Enforce **one pending request per profile**
   - Prevent spam / duplicate submissions while a request is under review

## Core Architecture

### Final source of truth

Use `profiles.is_verified` for gating app features.

Use `verification_requests` for:

- submission workflow
- review status
- review notes
- audit history
- file linkage

### Why this split matters

- `profiles.is_verified` stays simple and fast for app gating
- `verification_requests` holds process/history details without bloating `profiles`
- automated and manual verification can coexist cleanly

## Proposed Database Design

### Table: `public.verification_requests`

Suggested columns:

```sql
create type public.verification_document_type as enum (
  'drivers_license',
  'passport',
  'postal_id',
  'umid',
  'other'
);

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  document_type public.verification_document_type not null,
  front_storage_path text not null,
  back_storage_path text null,
  status text not null default 'pending',
  review_notes text null,
  reviewed_at timestamptz null,
  reviewed_by uuid null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint verification_requests_status_check
    check (status in ('pending', 'approved', 'rejected'))
);
```

### Recommended indexes

```sql
create index verification_requests_profile_id_idx
  on public.verification_requests(profile_id);

create index verification_requests_status_idx
  on public.verification_requests(status);

create unique index verification_requests_one_pending_per_profile_idx
  on public.verification_requests(profile_id)
  where status = 'pending';
```

### Notes

- `back_storage_path` should be nullable
  - some documents are front-only
- `reviewed_by` should reference `profiles.id`
  - easier for dashboard joins
- `document_type` should use a Postgres enum
  - Supabase type generation will expose this in `database.types.ts`
  - app and dashboard code can share the same allowed values safely
- `status` can stay `text + check` for MVP
  - simpler to evolve while keeping DB enforcement

## Storage Design

### Bucket

Create private bucket:

- `verification-docs`

### Path convention

Recommended path format:

```text
{profile_id}/{request_id}/front.{ext}
{profile_id}/{request_id}/back.{ext}
```

Example:

```text
2f.../8c.../front.jpg
2f.../8c.../back.jpg
```

### Why private storage

Identity documents are sensitive.

We should:

- store only storage paths in the database
- avoid public URLs
- use signed URLs for dashboard previews
- keep user access scoped to their own files only

## Security / RLS Plan

### `verification_requests` table policies

Users should be able to:

- insert their own request
- select their own requests
- not approve/reject anything
- not read other users' requests

Admins should be able to:

- select all requests
- update status / notes / review fields

### `verification-docs` bucket policies

Users should be able to:

- upload only to their own folder
- read only their own documents if needed for status/resubmission UX

Admins should be able to:

- read all verification docs

We should not allow:

- public read
- public signedless access
- cross-user writes

## Database Migration SQL Sketches

Below are draft migration SQLs for the database side. These should be split into separate migration files inside:

- `/Volumes/realme/Dev/kiyoko-org/dispatch-monorepo/packages/dispatch-lib/supabase/migrations`

Recommended split:

1. `20260409_create_verification_docs_bucket.sql`
2. `20260409_create_verification_requests.sql`
3. `20260409_add_review_verification_request_rpc.sql`

### Migration 1: `20260409_create_verification_docs_bucket.sql`

```sql
-- Private bucket for manual verification documents
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'verification-docs',
  'verification-docs',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Users can upload only into their own top-level folder:
-- {profile_id}/{request_id}/front.jpg
-- {profile_id}/{request_id}/back.jpg
DROP POLICY IF EXISTS "Users can upload own verification docs" ON storage.objects;
CREATE POLICY "Users can upload own verification docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can read own verification docs" ON storage.objects;
CREATE POLICY "Users can read own verification docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Admins can read all verification docs" ON storage.objects;
CREATE POLICY "Admins can read all verification docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);
```

### Migration 2: `20260409_create_verification_requests.sql`

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'verification_document_type'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.verification_document_type AS ENUM (
      'drivers_license',
      'passport',
      'postal_id',
      'umid',
      'other'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type public.verification_document_type NOT NULL,
  front_storage_path text NOT NULL,
  back_storage_path text NULL,
  status text NOT NULL DEFAULT 'pending',
  review_notes text NULL,
  reviewed_at timestamptz NULL,
  reviewed_by uuid NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT verification_requests_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS verification_requests_profile_id_idx
  ON public.verification_requests(profile_id);

CREATE INDEX IF NOT EXISTS verification_requests_status_idx
  ON public.verification_requests(status);

CREATE UNIQUE INDEX IF NOT EXISTS verification_requests_one_pending_per_profile_idx
  ON public.verification_requests(profile_id)
  WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_verification_requests_updated_at
ON public.verification_requests;

CREATE TRIGGER update_verification_requests_updated_at
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own verification requests"
ON public.verification_requests;
CREATE POLICY "Users can insert own verification requests"
ON public.verification_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = profile_id
  AND status = 'pending'
  AND reviewed_at IS NULL
  AND reviewed_by IS NULL
  AND front_storage_path LIKE auth.uid()::text || '/%'
  AND (
    back_storage_path IS NULL
    OR back_storage_path LIKE auth.uid()::text || '/%'
  )
);

DROP POLICY IF EXISTS "Users can read own verification requests"
ON public.verification_requests;
CREATE POLICY "Users can read own verification requests"
ON public.verification_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = profile_id
);

DROP POLICY IF EXISTS "Admins can read all verification requests"
ON public.verification_requests;
CREATE POLICY "Admins can read all verification requests"
ON public.verification_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update verification requests"
ON public.verification_requests;
CREATE POLICY "Admins can update verification requests"
ON public.verification_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);
```

### Migration 3: `20260409_add_review_verification_request_rpc.sql`

```sql
CREATE OR REPLACE FUNCTION public.review_verification_request(
  request_id_param uuid,
  decision text,
  review_notes_param text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  document_type public.verification_document_type,
  front_storage_path text,
  back_storage_path text,
  status text,
  review_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  admin_id uuid := auth.uid();
  target_profile_id uuid;
BEGIN
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = admin_id
      AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can review verification requests';
  END IF;

  IF decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'decision must be approved or rejected';
  END IF;

  SELECT vr.profile_id
  INTO target_profile_id
  FROM public.verification_requests vr
  WHERE vr.id = request_id_param
    AND vr.status = 'pending';

  IF target_profile_id IS NULL THEN
    RAISE EXCEPTION 'Pending verification request not found';
  END IF;

  UPDATE public.verification_requests vr
  SET
    status = decision,
    review_notes = review_notes_param,
    reviewed_at = now(),
    reviewed_by = admin_id,
    updated_at = now()
  WHERE vr.id = request_id_param
    AND vr.status = 'pending';

  IF decision = 'approved' THEN
    UPDATE public.profiles
    SET
      is_verified = true,
      updated_at = now()
    WHERE id = target_profile_id;
  ELSE
    UPDATE public.profiles
    SET
      is_verified = false,
      updated_at = now()
    WHERE id = target_profile_id;
  END IF;

  RETURN QUERY
  SELECT
    vr.id,
    vr.profile_id,
    vr.document_type,
    vr.front_storage_path,
    vr.back_storage_path,
    vr.status,
    vr.review_notes,
    vr.reviewed_at,
    vr.reviewed_by,
    vr.created_at,
    vr.updated_at
  FROM public.verification_requests vr
  WHERE vr.id = request_id_param;
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_verification_request(uuid, text, text)
TO authenticated, service_role;
```

### Migration notes

- The app can insert into `verification_requests` directly in MVP; no separate submit RPC is required yet.
- The review RPC is worth doing because approval/rejection must update both:
  - `verification_requests.status`
  - `profiles.is_verified`
- After these migrations land, regenerate types in `dispatch-lib`.
- Then update Zod schemas and app/dashboard consumers.

## Review Workflow

### Submission flow

1. User chooses document type
2. App generates a request id
3. App uploads front image
4. App uploads back image if needed
5. App inserts `verification_requests` row with `status = 'pending'`
6. App shows pending status in profile screen

### Approval flow

Admin approves a request.

This should update both:

- `verification_requests.status = 'approved'`
- `profiles.is_verified = true`

Also set:

- `reviewed_at`
- `reviewed_by`
- `review_notes` if desired

### Rejection flow

Admin rejects a request.

This should update:

- `verification_requests.status = 'rejected'`
- `reviewed_at`
- `reviewed_by`
- `review_notes`

And leave:

- `profiles.is_verified = false`

### Implementation recommendation

Do approval/rejection through a single server-side admin action or RPC, not two separate client updates.

Reason:

- keeps logic transactional
- reduces race conditions
- centralizes auth checks

## Dispatch Lib / Database Work

Repo:

- `/Volumes/realme/Dev/kiyoko-org/dispatch-monorepo/packages/dispatch-lib`

Planned work:

1. Add migration for `verification_requests`
2. Add migration for `verification-docs` bucket + policies
3. Add migration for admin review RPC or function
4. Run type sync:
   - `cd packages/dispatch-lib && bun run sync-types`
5. Update any Zod schemas in `dispatch-lib/types.ts`
6. Expose helper methods if useful, e.g.:
   - `submitVerificationRequest(...)`
   - `fetchMyVerificationRequests()`
   - `reviewVerificationRequest(...)`
   - `getVerificationDocumentSignedUrl(...)`

## Mobile App Work

Repo:

- `/Volumes/realme/Dev/kiyoko-org/dispatch`

Planned work:

### Profile screen

Add a second verification path alongside National ID:

- `Verify with National ID` (existing automated flow)
- `Upload another ID` (new manual flow)

### Manual verification UI

Suggested fields:

- document type
- front image/file
- back image/file (optional depending on type)

Suggested supported file types:

- jpg
- png
- pdf

Suggested limits:

- max 10 MB per file
- max 2 files for MVP

### Status UX

Profile screen should show one of:

- unverified
- pending review
- verified
- rejected with notes

### Important implementation note

Current storage helper in the app assumes public URLs:

- `/Volumes/realme/Dev/kiyoko-org/dispatch/lib/services/storage.ts`

That is not appropriate for identity documents.

For this feature we should either:

1. create a dedicated private verification upload helper, or
2. extend the storage service so verification uploads return storage paths instead of public URLs

Recommended: dedicated private helper to keep verification logic isolated.

## Dashboard Work

Repo:

- `/Volumes/realme/Dev/kiyoko-org/dispatch-monorepo/packages/dashboard-frontend`

Planned work:

1. Add a verification review page / queue
2. Show:
   - user
   - document type
   - submitted date
   - status
   - front/back preview via signed URL
   - notes
3. Add approve / reject actions
4. Use a server-side route or RPC for review actions
5. Optionally add filters:
   - pending
   - approved
   - rejected

## Suggested MVP Document Types

Keep this list small at first. These should be the initial enum values:

- `drivers_license`
- `passport`
- `postal_id`
- `umid`
- `other`

We can expand later.

## Resubmission Rules

Recommended behavior:

- while a request is `pending`, user cannot submit another one
- after `rejected`, user may submit a new request
- old requests stay in history for audit purposes

## Future Extension Path

If this grows later, we can evolve from:

- `verification_requests(front_storage_path, back_storage_path)`

into:

- `verification_requests`
- `verification_request_files`

But that is not necessary for MVP.

## Rollout Order

### Phase 1: Database and types

1. Add bucket migration
2. Add `verification_requests` migration
3. Add RLS policies
4. Add review RPC / server-side admin path
5. Sync `dispatch-lib` types

### Phase 2: Mobile app submission flow

1. Add private upload helper
2. Add profile manual verification UI
3. Add pending / rejected / approved status display
4. Prevent duplicate pending submissions

### Phase 3: Dashboard review UI

1. Add verification queue page
2. Add signed preview URLs
3. Add approve / reject actions
4. Refresh user verification status in dashboard views

### Phase 4: Testing

Test cases:

- user submits front-only document
- user submits front + back document
- user blocked from second pending request
- admin can preview docs with signed URLs
- admin approval sets `profiles.is_verified = true`
- admin rejection stores notes and keeps user unverified
- verified users can pass app gate immediately after refresh/realtime update
- National ID auto-verification still works unchanged

## Acceptance Criteria

MVP is complete when:

- users can upload non-PhilSys ID documents securely
- files are stored in a private bucket
- a `verification_requests` row is created with `pending` status
- admins can review requests in dashboard
- approving a request sets `profiles.is_verified = true`
- rejecting a request records notes and keeps access blocked
- app gate continues to rely only on `profiles.is_verified`

## Summary

The recommended MVP is:

- keep `profiles.is_verified` as the gate
- add a private `verification-docs` bucket
- add `verification_requests` with enum-backed `document_type`, plus `front_storage_path` and `back_storage_path`
- use signed URLs for admin preview
- handle approve/reject through a server-side action or RPC
- preserve the current PhilSys auto-verification flow without replacing it
