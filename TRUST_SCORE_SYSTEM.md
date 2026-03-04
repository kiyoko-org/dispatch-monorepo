# Trust Score System (Simplified)

The Trust Score System is a manual, admin-driven reputation system used to track user reliability. It replaces the previous automated point-based engine with a simpler, more controlled workflow.

## 1. Core Concepts

### Trust Levels (0-3)
Users are categorized into four levels. All users start at **Level 0**.

| Level | Name | Description |
| :--- | :--- | :--- |
| **3** | **Highly Trusted** | Verified community member with high accuracy. |
| **2** | **Trusted** | Regular user with multiple successful resolutions. |
| **1** | **Low Trust** | New user or user with some issues. |
| **0** | **Untrusted** | Default state for new users or those with prank reports. |

---

## 2. Adjustment Logic

Unlike the previous system, there is no background "Scoring Engine." Trust scores only change through explicit admin actions or specific report outcomes.

### Manual Increment (Resolution)
When an Admin or Officer marks a report as **Resolved** in the Dashboard, they are prompted: 
*"Would you like to increase this user's trust level?"*
- If accepted, the user's `trust_score` increments by 1 (capped at 3).

### Conditional Decrement (Cancellation)
When a report is **Cancelled**, the admin must select a **Cancellation Reason**.
- If **"Prank Call"** is selected, the reporter's `trust_score` is automatically decremented by 1 (capped at 0).
- Other reasons (e.g., "Duplicate", "Resolved by Other Agency") do not affect the trust score.

### Admin Overrides
Admins can manually override a user's trust score at any time via the **User Management** page.

---

## 3. Database Schema

### `profiles` table
- `trust_score`: `smallint` (0-3). Default is `0`.
- Automated triggers and `trust_factors` metadata have been removed to keep the system lightweight.

### `reports` table
- `cancellation_reason`: `text`. Stores the reason for report closure.
- `false_report`: This column has been removed and replaced by the cancellation reason logic.

---

## 4. Technical Implementation

### Shared Library (`dispatch-lib`)
- `incrementTrustScore(userId)`: Increases score by 1 (max 3).
- `decrementTrustScore(userId)`: Decreases score by 1 (min 0).
- `updateTrustScore(userId, score)`: Sets an absolute score.

### Verification
Manual verification tests are located at:
`packages/dispatch-lib/tests/testManualTrust.ts`
