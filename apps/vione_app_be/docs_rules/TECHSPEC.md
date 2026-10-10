# VI-ONE BACKEND (NESTJS) — TECHNICAL SPECIFICATION

## 1. System Architecture Overview
The ViOne Backend is a high-concurrency Node.js / NestJS server operating on port `4000` (Docker container) mapped to host port `5001`.
It connects to a central PostgreSQL database hosting over 150 business entities.

## 2. Key Modules & Functional Subsystems
1. **Auth & Identity Module (`src/auth`)**:
   - Manages executive & staff authentication, password hashing (bcrypt), JWT generation, and token refresh.
   - Dual session support: Authorization Bearer header + secure cookies (`vibe_token`, `token`).
2. **Connect-App Module (`src/connect-app`)**:
   - **Company Internal (`connect-company-internal.service.ts` & repository)**:
     - Endpoints:
       - `GET /connect-app/community/company-staff-status`: Checks if current user owns or is admin of an internal company community with staff (`memberCount > 1`). Returns `{ hasCompanyWithStaff: boolean, communityId, companyName, staffCount }`.
       - `POST /connect-app/community/:communityId/tasks`: Creates and assigns task to employee. Dispatches real-time WebSocket notification.
       - `PATCH /connect-app/community/:communityId/tasks/:taskId/progress`: Updates task completion percentage (0-100%) and progress notes for the boss to monitor.
       - `POST /connect-app/community/:communityId/tasks/import-excel`: Batch imports tasks from Excel structure.
   - **Direct Messaging (`connect-dm.service.ts` & repository)**:
     - Endpoints: `GET /connect-app/dm/threads`, `POST /connect-app/dm/send`.
     - Sorting: Threads are ordered by newest message first (`lastMessageAt DESC`).
   - **Opportunities & Marketplaces (`connect-opportunity.service.ts`, `connect-marketplace.service.ts`)**:
     - B2B deal matching, trade leads, and procurement quotes.
   - **Moments & Social Feeds (`connect-moment.service.ts`)**:
     - Executive social feed, business milestones, comments, and reactions.
3. **Operations & Attendance Module (`src/operations`)**:
   - Manages company attendance summary (`GET /operations/attendance/company-summary`), GPS check-ins, leaves, and approvals.
4. **AI Assistant Module (`src/ai`)**:
   - Integrates Gemini API / OpenAI for natural language analysis, voice command parsing, task extraction, and executive advice.

## 3. Database Schema Conventions
- Primary Keys: UUID strings (`@default(uuid()) @db.Uuid`).
- Display Identifiers: Business codes (`TSK-081`, `KH-0001`, `EMP-01`).
- Task Progress fields: `progress` (`INTEGER DEFAULT 0`), `progress_note` (`TEXT`), `department` (`VARCHAR(100)`).
- Time Tracking: UTC ISO strings, with timezone conversion handled on client side (`vi-VN`).
