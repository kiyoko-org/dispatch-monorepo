# Trust Score System Documentation

The Trust Score System is a backend-driven reputation engine designed to categorize user reliability within the Dispatch ecosystem. It uses real-time behavioral data from the `reports` table to calculate a "Source of Truth" score for every citizen.

## 1. Core Concepts

### Trust Levels (0-3)
Users are categorized into four levels based on their point totals:

| Level | Name | Description | Point Threshold |
| :--- | :--- | :--- | :--- |
| **3** | **Highly Trusted** | Verified community member with high accuracy. | 75+ points |
| **2** | **Trusted** | Regular user with multiple successful resolutions. | 50 - 74 points |
| **1** | **Low Trust** | New user or user with some cancelled reports. | 25 - 49 points |
| **0** | **Untrusted** | High frequency of false reports or zero activity. | < 25 points |

### Trust Factors (Metadata)
Every user profile contains a `trust_factors` JSON object that stores the raw data behind their score:
- `total_reports`: Count of all reports submitted.
- `verified_reports`: Count of reports that reached the `resolved` status.
- `false_reports`: Count of reports explicitly marked as `false_report = true`.
- `cancelled_reports`: Count of reports marked as `cancelled`.
- `calculated_at`: Timestamp of the last automated recalculation.

---

## 2. Automated Scoring Engine (Database)

The system is "Source of Truth" focused. All calculations happen in the Postgres database via a trigger, ensuring consistency across Web, Mobile, and Admin platforms.

### Point Logic
Points are calculated dynamically whenever a report is Created, Updated, or Deleted:

1. **Base Activity**: `+5 points` per report (capped at 25 points to prevent "spamming" for trust).
2. **Resolution Bonus**: `+10 points` for every report that is marked as **Resolved**.
3. **False Report Penalty**: `-20 points` for every report marked as **False**.
4. **Cancellation Penalty**: `-5 points` for every report marked as **Cancelled**.

### Database Components
- **Function**: `public.recalculate_user_trust_score(user_uuid)`
- **Trigger**: `trigger_recalculate_trust_score` on `public.reports`
- **Migration**: `20260304100449_add_trust_score_to_profiles.sql`

---

## 3. Library Integration (`dispatch-lib`)

The shared library provides methods for both automated and manual trust management.

### DispatchClient Configuration
The `DispatchClient` is environment-aware. When initialized in the Dashboard, it uses a **Proxy Mode**:

```typescript
initDispatchClient({
  supabaseClientConfig: { ... },
  useProxy: true // Enabled in the Admin Dashboard
});
```

### Methods
- `fetchProfilesWithEmails()`: Unified method to get profiles with auth data. In Proxy Mode, it routes through the Dashboard's secure API.
- `updateTrustScore(userId, score)`: Manual admin override (0-3). In Proxy Mode, it uses the Service Role via the backend proxy to bypass RLS.
- `incrementTrustScore(userId)` / `decrementTrustScore(userId)`: Relative adjustments with boundary safety.
- `updateTrustFactors(userId, factors)`: Merges custom metadata into the JSON storage.

---

## 4. Frontend Implementation

### Secure Admin Proxy (`dashboard-frontend`)
The Admin Dashboard includes a secure API route at `/api/profiles` that acts as an elevated bridge between the browser and Supabase.
- **GET**: Fetches profile data merged with `auth.users` emails (using Service Role).
- **PATCH**: Performs manual trust score overrides (using Service Role).

### User Interface
- **Shield Badges**: Color-coded visual indicators for user reliability.
- **Incident Verification**: Admins can mark a report as "False" in the Incident Detail dialog, which instantly triggers a score drop for the reporter via the database engine.
- **Trust Management Dialog**: Allows admins to view the "Trust Factors" breakdown and manually override a score. These changes are saved securely through the library's proxy mode.

---

## 5. Testing & Verification

Integration tests are located in `packages/dispatch-lib/tests/` to prevent regressions:
- `testScoringEngine.ts`: Verifies the point-to-level mapping and trigger automation.
- `testTrustScore.ts`: Verifies library methods and manual overrides.

### Running Tests
```bash
cd packages/dispatch-lib
bun run tests/testScoringEngine.ts
```

---
**Last Updated**: March 4, 2026
**Implementation Status**: Fully Integrated & Type-Safe.
