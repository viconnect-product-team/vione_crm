# VI-ONE BACKEND (NESTJS) — SKILLS & BEST PRACTICES

## 1. Core Competencies & Tech Stack
- **Framework**: NestJS 10.x with TypeScript 5.x.
- **ORM & Database**: Prisma ORM with PostgreSQL (Stand-alone database, strictly decoupled from legacy Supabase auth).
- **Architecture Pattern**: Enterprise 3-Tier Layering + Composite Facade + Repository Pattern:
  - `Controllers`: HTTP routing, status codes, param validation, DTO binding.
  - `Services`: Business logic, permissions, workflow state machine, WebSocket notifications.
  - `Repositories`: 100% data access layer (Prisma & raw SQL query isolation).
- **Authentication**: JWT Strategy via `AuthGuard` (`JWT_SECRET`, cookies & Authorization Bearer header).
- **Realtime Gateway**: WebSocket Gateway (`@WebSocketGateway`) for real-time task notifications, messaging, and approvals.

## 2. Command Palette & Workflow
- **Development**: `npm run start:dev` (runs with hot-reload).
- **Build / Verification**: `npm run build` (`nest build`). Mandatory 0 errors (`exit code 0`).
- **Prisma Schema**:
  - Format schema: `npx prisma format`
  - Push schema: `npx prisma db push`
  - Generate client: `npx prisma generate`

## 3. Strict Rules & Conventions
1. **Repository Pattern (Spring Boot Parity)**:
   - NEVER write raw `$queryRaw` or `$executeRaw` inside Services. All SQL must reside in `src/connect-app/repositories/` or domain repositories.
2. **DTO Isolation & Single Responsibility**:
   - Every endpoint must have its own dedicated DTO file in `dto/` (e.g., `create-task.dto.ts`, `update-task-progress.dto.ts`).
   - Use `class-validator` decorators (`@IsNotEmpty`, `@IsString`, `@IsOptional`, `@IsNumber`, `@Min`, `@Max`).
3. **Vietnamese Global Error Handling**:
   - `VietnameseValidationPipe` validates DTOs and outputs Vietnamese error messages.
   - `AllExceptionsFilter` formats all HTTP responses into standard envelope: `{ statusCode, success: false, message, errors, timestamp, path }`.
4. **Zero Supabase Couplings**:
   - Do NOT reference `auth.users`. All user references must point to `public.vione_users`.
5. **No Auto Git Push/Commit**:
   - Strictly respect `AGENTS.md` Rule 1. No automatic terminal git push or git commit.
