# Security Specification - Digital Study Planner

This security specification defines our Zero-Trust Attribute-Based Access Control (ABAC) scheme and tests it against rogue payloads to prevent Update-Gaps and Resource Poisoning.

## 1. Data Invariants

1. **User Profiling Isolation**:
   - `users/{userId}` represents private student preferences. Only the user with `uid == userId` can read or write their own profile records.
   - Core system variables, such as `planType` (Free or Premium), cannot be elevated by the user.

2. **Course & Subject Ownership**:
   - `subjects/{subjectId}` contains the student's courses.
   - Any read, create, update, or delete must strictly require `request.auth.uid == resource.data.userId` (or `request.resource.data.userId` for writes).
   - Subject IDs and names cannot exceed strict size boundaries to prevent wallet-draining injections.

3. **Academic Scheduling Verification**:
   - `classes/{classId}` defines timings. Its owner `userId` must equal the caller's UID.
   - Valid hours format (HH:MM) and strict days of week bounds must be satisfied.

4. **Task Allocation integrity**:
   - `tasks/{taskId}` checklists are owned by the active user.
   - A task cannot have its `userId` spoofed to another student.
   - Dates must be represented as valid YYYY-MM-DD string syntax.

5. **Focus Duration Precision**:
   - `focusLogs/{logId}` reports student session times.
   - Duration minutes must be a positive integer strictly below 1440 minutes.

---

## 2. The "Dirty Dozen" Payloads

Here are twelve payloads designed to disrupt auth boundaries, poison database state, or escalate plan tiers, all of which will be blocked with `PERMISSION_DENIED`.

### P1: Profile Elevation Attack
- **Target**: `users/attacker_uid`
- **Method**: `UPDATE`
- **Payload**: `{ "name": "Attacker", "planType": "Premium" }`
- **Defense**: Validation block enforces `UserProfile` schema logic and limits updates to profile setting variables like name/darkMode; planType updates are disallowed for non-admins.

### P2: Identity Spoofing (Subject)
- **Target**: `subjects/sub_123`
- **Method**: `CREATE`
- **Payload**: `{ "id": "sub_123", "name": "Physics", "color": "#0ea5e9", "userId": "victim_uid" }`
- **Defense**: Enforces that the incoming `userId` matches the authenticated `request.auth.uid`.

### P3: Resource Poisoning (Task String Injection)
- **Target**: `tasks/task_huge`
- **Method**: `CREATE`
- **Payload**: `{ "id": "task_huge", "title": "A".repeat(5000), "dueDate": "2026-06-08", "priority": "High", "completed": false, "userId": "attacker_uid" }`
- **Defense**: String size limitations on task titles (`title.size() <= 200`).

### P4: Orphaned Task Creation
- **Target**: `tasks/task_orphan`
- **Method**: `CREATE`
- **Payload**: `{ "id": "task_orphan", "title": "Biology Quiz", "dueDate": "invalid-date-format-string", "priority": "Extreme", "completed": false, "userId": "attacker_uid" }`
- **Defense**: Regex checking of fields and enum validation for priority levels.

### P5: Scheduled Time Range Bypass
- **Target**: `classes/class_corrupt`
- **Method**: `CREATE`
- **Payload**: `{ "id": "class_corrupt", "subjectId": "sub_1", "dayOfWeek": "Funday", "startTime": "99:99", "endTime": "00:00", "userId": "attacker_uid" }`
- **Defense**: Enum validation of the `dayOfWeek` set and rigorous time matching.

### P6: Focus Timer Value Poisoning
- **Target**: `focusLogs/log_negative`
- **Method**: `CREATE`
- **Payload**: `{ "id": "log_negative", "durationMinutes": -100, "dateTime": "2026-06-08", "userId": "attacker_uid" }`
- **Defense**: Integer range checks (`durationMinutes > 0 && durationMinutes <= 1200`).

### P7: Ghost Sibling Write (Tasks)
- **Target**: `tasks/victim_task`
- **Method**: `UPDATE`
- **Payload**: `{ "id": "victim_task", "title": "Hacked Title", "userId": "attacker_uid", "extraShadowField": "malicious" }`
- **Defense**: `affectedKeys().hasOnly(...)` during updates blocks unrecognized shadow properties.

### P8: Global Query Scraping Request
- **Target**: `tasks` (Collection Query)
- **Method**: `LIST`
- **Payload**: GET all tasks without active user filtering
- **Defense**: Enforces `resource.data.userId == request.auth.uid` on lists, demanding a secure query where clause.

### P9: Admin Override Spoofing
- **Target**: `users/attacker_uid`
- **Method**: `UPDATE`
- **Payload**: `{ "isAdmin": true }`
- **Defense**: Absolute lock on administrative role values.

### P10: Temporal Timestamp Tampering
- **Target**: `tasks/task_temp`
- **Method**: `CREATE`
- **Payload**: `{ "id": "task_temp", "title": "History Homework", "dueDate": "2026-06-08", "priority": "Low", "completed": false, "userId": "attacker_uid", "createdAt": "1999-01-01" }`
- **Defense**: If temporal tracking variables are stored, they are cross-evaluated against `request.time`.

### P11: Subject Color Code Injection
- **Target**: `subjects/sub_color`
- **Method**: `CREATE`
- **Payload**: `{ "id": "sub_color", "name": "Chemistry", "color": "system('rm -rf')", "userId": "attacker_uid" }`
- **Defense**: Limit color size checks (`color.size() <= 20`).

### P12: Task Status Lock Hijacking
- **Target**: `tasks/locked_task`
- **Method**: `UPDATE` (on completed task owned by another)
- **Payload**: `{ "completed": false }`
- **Defense**: Demands active matching of ownership before edit.

---

## 3. Test Runner Design

The following isolated tests represent a verification harness verifying our defenses.

```typescript
// firestore.rules.test.ts (Validation Simulator)
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

describe('Digital Study Planner Security Tests', () => {
  it('P1: Denies updating other user profile', async () => {
    // Attempt unauthorized profile setting block...
  });
  
  it('P2: Denies creating a course of study under someone else\'s UID', async () => {
    // Attempt credentials injection...
  });
  
  it('P3: Denies oversized task parameters (Resource Poisoning)', async () => {
    // Verify length checks...
  });
});
```
