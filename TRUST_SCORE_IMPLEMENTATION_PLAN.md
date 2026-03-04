# Trust Score System Implementation Plan

## Executive Summary

This document outlines the architecture and implementation plan for integrating a backend-driven trust score system across the Dispatch ecosystem: mobile app (`dispatch`), admin dashboard (`dashboard-frontend`), and shared library (`dispatch-lib`).

## Current State Analysis

### Mobile App (`/Volumes/realme/Dev/kiyoko-org/dispatch/`)

**Existing UI:**
- Location: `app/(protected)/trust-score/index.tsx`
- 4-level trust system (0-3): Untrusted → Low Trust → Trusted → Highly Trusted
- Color-coded: Red → Orange → Amber → Green
- Stored locally in AsyncStorage with key `@dispatch_trust_level`
- Defaults to Level 3 (Highly Trusted)

**Trust Level Definitions:**
```typescript
const TRUST_LEVELS = [
  { level: 0, label: 'Untrusted', color: '#EF4444', priority: 'None' },
  { level: 1, label: 'Low Trust', color: '#F97316', priority: 'Low' },
  { level: 2, label: 'Trusted', color: '#F59E0B', priority: 'Medium' },
  { level: 3, label: 'Highly Trusted', color: '#22C55E', priority: 'High' },
];
```

**Key Behaviors (Descriptive Only, No Points):**

**Level Up Factors:**
- Submit verified reports (confirmed by authorities)
- Timely emergency responses
- Accurate location information
- Consistent platform use

**Level Down Factors:**
- Prank emergency calls
- False report submissions
- Spam or abuse
- Inaccurate location data
- Unverified information
- Community guidelines violations

**Current Limitations:**
- No scoring algorithm exists
- No backend integration
- Score never changes (static display)
- Described as "honor system" to users

### Admin Dashboard (`/Volumes/realme/Dev/kiyoko-org/dispatch-monorepo/packages/dashboard-frontend/`)

**Current State:**
- No trust score UI exists
- User management at `app/dashboard/users/page.tsx`
- Uses `useProfiles` hook from `dispatch-lib`
- Displays: name, email, reports count, join date, last active

**Current Profile Data:**
```typescript
interface Profile {
  id: string
  first_name?: string
  middle_name?: string
  last_name?: string
  avatar_url?: string
  role?: string  // 'admin' | 'officer' | 'user'
  // NO trust_score field exists
}
```

### dispatch-lib (`/Volumes/realme/Dev/kiyoko-org/dispatch-monorepo/packages/dispatch-lib/`)

**Architecture:**
- Singleton pattern: `DispatchClient` class
- Private Supabase client wrapped internally
- React hooks for data fetching with realtime subscriptions

**Key Files:**
- `index.ts` - Core client with CRUD methods
- `react/hooks/useProfiles.ts` - Fetches profiles + merges auth data + report counts
- `react/hooks/useReports.ts` - Basic report CRUD
- `react/hooks/useRealtimeReports.ts` - Global singleton subscription
- `database.types.ts` - Generated Supabase types

**Existing Profile Hook Pattern:**
```typescript
// useProfiles.ts merges data from multiple sources:
1. profiles table (basic info)
2. auth.admin.getUserById() (email, created_at, last_sign_in_at)
3. reports count per user
```

### Database Schema (Supabase)

**profiles Table:**
```sql
- id (uuid, pk)
- first_name, middle_name, last_name
- role (enum: 'admin' | 'officer' | 'user')
- avatar_url, phone_number, id_card_number
-- NO trust_score column (needs to be added)
```

**reports Table:**
```sql
- id (bigint, pk)
- reporter_id (uuid, fk → profiles.id)
- status (text: 'pending' | 'resolved' | 'cancelled')
- false_report (boolean, default false)
- created_at, resolved_at, arrived_at (timestamps)
- latitude, longitude
-- All data needed for trust calculation exists
```

**Key Data Available for Scoring:**
- Report accuracy (false_report flag)
- Resolution rate (status = 'resolved')
- Cancellation rate (status = 'cancelled')
- Response time (arrived_at - created_at)
- Report volume (count per user)
- Account age (created_at)

## Selected Architecture: Profiles Table Column (Option 1)

This approach adds `trust_score` and `trust_factors` columns directly to the `profiles` table.

**Reasoning:**
- Simple, single-table queries.
- Perfect alignment with the existing `useProfiles` hook pattern.
- Minimal overhead for dashboard and mobile display.
- Supports real-time updates via existing subscriptions.

**SQL Migration:**
```sql
ALTER TABLE public.profiles 
ADD COLUMN trust_score smallint DEFAULT 3 
CHECK (trust_score >= 0 AND trust_score <= 3);

ALTER TABLE public.profiles 
ADD COLUMN trust_factors jsonb DEFAULT '{
  "total_reports": 0,
  "verified_reports": 0,
  "false_reports": 0,
  "cancelled_reports": 0,
  "avg_response_time_minutes": null
}'::jsonb;
```

---

## Deprecated Alternatives

### Option 2: Separate trust_scores Table
*Considered but not selected to maintain simplicity and performance.*


## Implementation Plan

### Phase 1: Database & dispatch-lib (Backend Foundation)

#### 1.1 Database Migration
**File:** New SQL migration in Supabase
```sql
-- Add trust_score to profiles
ALTER TABLE public.profiles 
ADD COLUMN trust_score smallint DEFAULT 3 
CHECK (trust_score >= 0 AND trust_score <= 3);

-- Optional: Add metadata for calculation factors
ALTER TABLE public.profiles 
ADD COLUMN trust_factors jsonb DEFAULT '{
  "total_reports": 0,
  "verified_reports": 0,
  "false_reports": 0,
  "cancelled_reports": 0,
  "avg_response_time_minutes": null
}'::jsonb;
```

#### 1.2 Update database.types.ts
**File:** `/packages/dispatch-lib/database.types.ts`
- Regenerate types from Supabase schema
- Add `trust_score` and `trust_factors` to profiles table type

#### 1.3 Create useProfile Hook
**File:** `/packages/dispatch-lib/react/hooks/useProfile.ts`

```typescript
// Single user profile with real-time trust score updates
export function useProfile(userId: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch profile with trust score
  // Subscribe to realtime changes on profiles table
  // Return { profile, loading, error }
}
```

#### 1.4 Create useTrustScores Hook (Admin View)
**File:** `/packages/dispatch-lib/react/hooks/useTrustScores.ts`

```typescript
// Admin view: all users with trust scores
export function useTrustScores() {
  // Fetch all profiles with trust scores
  // Realtime subscription for all profile changes
  // Return { users, loading, error, updateTrustScore }
}
```

#### 1.5 Update DispatchClient Methods
**File:** `/packages/dispatch-lib/index.ts`

Add methods:
```typescript
class DispatchClient {
  // Existing methods...
  
  // New trust score methods
  async updateTrustScore(userId: string, score: number, factors?: object) {
    return this.supabase
      .from('profiles')
      .update({ 
        trust_score: score, 
        trust_factors: factors,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();
  }
  
  async calculateTrustScore(userId: string) {
    // RPC function or client-side calculation
    // Returns computed score based on report history
  }
}
```

#### 1.6 Export New Hooks
**File:** `/packages/dispatch-lib/index.ts`

```typescript
export * from "./react/hooks/useProfile.ts";
export * from "./react/hooks/useTrustScores.ts";
```

### Phase 2: Mobile App Integration

#### 2.1 Update Home Screen
**File:** `/app/(protected)/home.tsx`

Changes:
```typescript
// Replace AsyncStorage trust level with hook
const { profile, loading } = useProfile(session?.user?.id);
const trustLevel = profile?.trust_score ?? 3;

// Remove: loadTrustLevel() from AsyncStorage
// Add: Real-time trust score from profile
```

#### 2.2 Update Trust Score Page
**File:** `/app/(protected)/trust-score/index.tsx`

Changes:
```typescript
const { profile } = useProfile(session?.user?.id);
const currentLevel = profile?.trust_score ?? 3;
const factors = profile?.trust_factors;

// Optionally display factors:
// - "Verified reports: 5/7"
// - "False reports: 0"
// - etc.
```

#### 2.3 Add Real-time Updates
The `useProfile` hook will automatically update when:
- Admin changes trust score from dashboard
- Automated system updates score

### Phase 3: Admin Dashboard

#### 3.1 Update Users Page
**File:** `/packages/dashboard-frontend/app/dashboard/users/page.tsx`

Add trust score column to users table:
```typescript
// Add to UserData interface
trust_score: number
trust_factors?: object

// Add trust score badge/component
const getTrustBadge = (score: number) => {
  const levels = ['Untrusted', 'Low Trust', 'Trusted', 'Highly Trusted'];
  const colors = ['destructive', 'warning', 'default', 'success'];
  return <Badge variant={colors[score]}>{levels[score]}</Badge>;
};
```

#### 3.2 Add Trust Score Edit Dialog
**File:** `/packages/dashboard-frontend/app/dashboard/users/page.tsx` or new component

```typescript
// Admin can:
// - View trust factors breakdown
// - Manually adjust trust score (0-3)
// - Add notes/reason for adjustment
// - See history (if using separate table)
```

#### 3.3 Add Trust Score Filter
**File:** `/packages/dashboard-frontend/app/dashboard/users/page.tsx`

```typescript
// Filter users by trust level
const [trustFilter, setTrustFilter] = useState<'all' | '0' | '1' | '2' | '3'>('all');
```

### Phase 4: Automated Scoring (Optional)

#### 4.1 Supabase Edge Function
**File:** `/supabase/functions/calculate-trust-score/index.ts`

```typescript
// Triggered on report status change
// Calculates:
// - Resolution rate (resolved / total)
// - False report rate (false / total)
// - Cancellation rate (cancelled / total)
// - Average response time
// Maps to 0-3 scale
// Updates profiles.trust_score
```

#### 4.2 Database Trigger
**File:** SQL migration

```sql
-- Trigger on reports table UPDATE
-- When status changes to 'resolved' or false_report is set
-- Recalculate user's trust score
CREATE OR REPLACE FUNCTION recalculate_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate metrics
  -- Update profiles.trust_score
  -- Could call Edge Function for complex logic
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Phase 5: Enhanced UI (Future)

#### 5.1 Mobile App Enhancements
- Progress bar showing "points to next level"
- Trust history graph
- Achievement badges
- Notifications on level up/down

#### 5.2 Dashboard Enhancements
- Trust score trends over time
- Bulk trust score operations
- Automated scoring rules configuration

## File Changes Summary

### dispatch-lib
| File | Change |
|------|--------|
| `database.types.ts` | Regenerate with trust_score column |
| `index.ts` | Add updateTrustScore(), calculateTrustScore() methods |
| `react/hooks/useProfile.ts` | **NEW** - Single user profile with realtime |
| `react/hooks/useTrustScores.ts` | **NEW** - Admin view of all trust scores |

### Mobile App (dispatch)
| File | Change |
|------|--------|
| `app/(protected)/home.tsx` | Replace AsyncStorage with useProfile hook |
| `app/(protected)/trust-score/index.tsx` | Use useProfile, display factors |

### Admin Dashboard
| File | Change |
|------|--------|
| `app/dashboard/users/page.tsx` | Add trust score column, filter, edit dialog |

### Database
| File | Change |
|------|--------|
| Supabase migration | Add trust_score, trust_factors to profiles |

## API Surface

### useProfile Hook
```typescript
const { 
  profile,      // Profile with trust_score, trust_factors
  loading,      // boolean
  error,        // Error | null
  refresh       // () => Promise<void>
} = useProfile(userId: string);

// Auto-updates via realtime subscription
```

### useTrustScores Hook (Admin)
```typescript
const { 
  users,        // Array<Profile & { trust_score, trust_factors }>
  loading,
  error,
  updateScore   // (userId: string, score: number) => Promise<void>
} = useTrustScores();
```

### DispatchClient Methods
```typescript
// Update trust score (admin use)
await client.updateTrustScore(userId, 2, {
  reason: 'Multiple verified reports',
  verified_count: 5
});

// Calculate score from report history
const { score, factors } = await client.calculateTrustScore(userId);
```

## Scoring Algorithm (Proposed)

### Factors & Weights
```typescript
interface TrustFactors {
  total_reports: number;           // Base: +5 points per report (max 25)
  verified_reports: number;        // +10 points each
  false_reports: number;           // -20 points each
  cancelled_reports: number;       // -5 points each
  avg_response_time_minutes: number; // <10min: +10, <30min: +5
}

// Score calculation (0-100)
const baseScore = Math.min(factors.total_reports * 5, 25);
const verifiedBonus = factors.verified_reports * 10;
const falsePenalty = factors.false_reports * 20;
const cancelledPenalty = factors.cancelled_reports * 5;
const responseBonus = factors.avg_response_time_minutes < 10 ? 10 : 
                      factors.avg_response_time_minutes < 30 ? 5 : 0;

const totalScore = baseScore + verifiedBonus - falsePenalty - cancelledPenalty + responseBonus;

// Map to levels (0-3)
const trustLevel = totalScore >= 75 ? 3 :
                   totalScore >= 50 ? 2 :
                   totalScore >= 25 ? 1 : 0;
```

## Migration Path

1. **Deploy database migration** (add columns)
2. **Update dispatch-lib** (add hooks, methods)
3. **Update mobile app** (use new hook)
4. **Update dashboard** (display trust scores)
5. **Backfill existing users** (set default trust_score = 3)
6. **Enable automated scoring** (optional edge function)

## Testing Checklist

- [ ] Trust score displays correctly in mobile app
- [ ] Real-time updates work (change in dashboard reflects in app)
- [ ] Admin can edit trust score from dashboard
- [ ] Filters work on users page
- [ ] Edge cases: null scores, invalid values
- [ ] Offline behavior (cache last known score)

## Security Considerations

1. **RLS Policies:** Only admins can update trust_score
2. **Validation:** Score must be 0-3 on backend
3. **Audit:** Log who changed scores and why
4. **Rate Limiting:** Prevent abuse of automated scoring

---

*Document created: March 3, 2025*
*Version: 1.0*
