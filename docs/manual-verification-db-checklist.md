# Manual Verification DB Checklist

Apply these one by one, in order.

## Pre-checks

- [ ] `profiles.is_verified` already exists
- [ ] `profiles.role` already exists
- [ ] you are applying against the correct Supabase project

Optional verification query:

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in ('is_verified', 'role');
```

## Step 1 — Create private bucket

- [ ] Apply:
  - `packages/dispatch-lib/supabase/migrations/20260409000100_create_verification_docs_bucket.sql`

Verify:

```sql
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'verification-docs';
```

Expected:

- 1 row
- `public = false`
- `file_size_limit = 10485760`

## Step 2 — Create enum + verification_requests table + RLS

- [ ] Apply:
  - `packages/dispatch-lib/supabase/migrations/20260409000200_create_verification_requests.sql`

Verify enum:

```sql
select t.typname
from pg_type t
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
  and t.typname = 'verification_document_type';
```

Verify table:

```sql
select column_name, data_type, udt_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'verification_requests'
order by ordinal_position;
```

Verify policies:

```sql
select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'verification_requests'
order by policyname;
```

Expected high level:

- enum exists
- table exists
- unique pending index exists
- user insert/select policy exists
- admin select policy exists

## Step 3 — Create admin review RPC

- [ ] Apply:
  - `packages/dispatch-lib/supabase/migrations/20260409000300_add_review_verification_request_rpc.sql`

Verify RPC:

```sql
select proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname = 'review_verification_request';
```

Expected:

- 1 row for `review_verification_request`

## Step 4 — Sync types locally

- [ ] Run:

```bash
cd /Volumes/realme/Dev/kiyoko-org/dispatch-monorepo/packages/dispatch-lib
bun run sync-types
```

## Step 5 — Tell me what happened

- [ ] Send me the result of Step 1
- [ ] then Step 2
- [ ] then Step 3
- [ ] then Step 4

After that I’ll keep going with:

- `dispatch-lib` helper methods/types
- mobile app submission flow
- dashboard review UI
