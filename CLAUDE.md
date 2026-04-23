# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EYR Digital — a school administration system for Centro Educacional Ernesto Yañez Rivera (Escuela Huechuraba). React 19 SPA with Firebase/Firestore backend. All UI text is in Spanish.

## Commands

```bash
npm run dev          # Start dev server (Vite, http://localhost:5173)
npm run build        # Production build to /dist
npm run lint         # ESLint check
npm run preview      # Preview production build
npm run seed         # Seed Firestore with initial users (requires .env)
npm run test:parser  # Test the evaluación PDF parser (no .env needed)
npm run backup       # Backup Firestore collections to JSON (requires .env)
firebase deploy --only firestore:rules  # Deploy security rules
```

Deployment is automatic via Vercel on push to main.

## Architecture

**Stack:** React 19 + React Router 7 + Firebase Auth/Firestore + Tailwind CSS 3 + Vite

### Provider-Gated Data Loading

`src/main.jsx` wraps the app in `AuthProvider` → `DataProviders`. The `DataProviders` component gates all Firestore context providers behind authentication — they only mount after the user is logged in. This prevents silent Firestore permission failures on cold start. When adding a new context provider, it must be added inside `DataProviders` in `main.jsx`.

### Context-Based State (21 providers)

Each domain has a context in `src/context/` that subscribes to a Firestore collection via `onSnapshot()` and exposes CRUD methods. Pattern: subscribe on mount, unsubscribe on cleanup, expose data + actions via a custom hook.

Key contexts: `AuthContext` (auth + users list + role helpers), `PermissionsContext` (module access), `AdministrativeDaysContext` (day requests + metrics/balances), `EvaluacionesContext` + `QuestionBankContext` (UTP evaluation system), `RetosContext` + `WorkshopsContext` (challenges/sessions), `TasksContext` + `TodoContext` (team tasks vs personal tasks).

### 3-Layer Permission System

Defined in `src/lib/permissionResolver.js`, resolution order:
1. **Hardcoded defaults** — `MODULE_REGISTRY` in `src/data/moduleRegistry.js` defines `defaultRoles` per module
2. **Role overrides** — `permissions_role_defaults/{role}` collection in Firestore
3. **User overrides** — `user.permissionOverrides` field on individual user docs

Safety net: `super_admin` and `admin` always get full access regardless of overrides.

Frontend uses `PermissionGate` component (in `App.jsx` routes) and `canAccessModule()`. Backend enforces via `firestore.rules` with `isAdmin()`, `isManagement()`, etc.

### Module Registry

`src/data/moduleRegistry.js` is the single source of truth for navigation, routing paths, icons, and default role access for all modules. When adding a new module, register it here.

### Role Hierarchy

Defined in `AuthContext.jsx`. Key helper functions:
- `canEdit(user)` — only `super_admin`/`admin` (write operations)
- `isManagement(user)` — super_admin, admin, director, utp_head, inspector
- `isAdmin(user)` — super_admin or admin

Roles: `super_admin` > `admin` > `director` > `utp_head` > `inspector` > `convivencia_head` > `convivencia` > `teacher` > `staff` > `printer` > `pie`

### Routing

`src/App.jsx` defines all routes. Protected routes use `ProtectedLayout` (redirects to `/login` if unauthenticated). Role-gated routes use `PermissionGate` wrapping the route element.

### Email via Google Apps Script

`src/lib/emailService.js` sends requests to a deployed Apps Script (`scripts/appscript/COPIAR_EN_APPS_SCRIPT.js`) for branded email delivery (admin day notifications, password resets). Authenticated with a shared secret via `VITE_APPS_SCRIPT_SECRET`.

### Firestore Security Rules

`firestore.rules` mirrors the frontend permission model. Both layers must be updated together when changing access control. Rules use helper functions (`isAdmin()`, `isManagement()`, `isConvivenciaOrAdmin()`, etc.) that read the user's role from their Firestore document.

## Key Directories

- `src/components/` — React components (some large: AdminUsers, ConvivenciaReservation, DashboardHome); `src/components/convivencia/` has IncidentsView and StudentsManager
- `src/views/` — Full-page views for admin features (AttendanceMonitorView, StatsView, InventoryView are 50KB+); `src/views/workshop-tools/` has ActaReunion, PizarraCompromisos, TablaResponsabilidades
- `src/utp/` — UTP evaluation module: UTPView, EditorFormato, CoberturaOA, FormatoPrueba and supporting panels (own subdirectory, not under views/)
- `src/context/` — All 21 context providers
- `src/lib/` — Utilities: firebase config, firestoreService, validation, permissionResolver, pdfExport, attendanceParser, csvParser, businessDays, mlEngine (ML helpers), storageService (Firebase Storage), notificationService, docxExport, evaluacionParser
- `src/data/` — moduleRegistry.js (navigation/permissions config), defaultSchedules.js
- `scripts/` — Node.js seed/diagnostic scripts, `scripts/appscript/` for Google Apps Script email handler

## Environment Variables

Copy `.env.example` to `.env`. Required: Firebase config (`VITE_FIREBASE_*`), Apps Script URL/secret (`VITE_APPS_SCRIPT_*`), seed password (`SEED_DEFAULT_PASSWORD`).

## Notable Libraries

- `recharts` — charts and data visualization
- `@xyflow/react` — flow diagrams (used in workshop tools)
- `jspdf` + `jspdf-autotable` — PDF export
- `docx` + `docxtemplater` + `pizzip` — Word document export
- `pdfjs-dist` — PDF text extraction (evaluación parser)
- `react-easy-crop` — image cropping

## Conventions

- All user-facing strings are in Spanish
- Dates stored as `"YYYY-MM-DD"` strings in Firestore
- Firestore writes go through validation functions in `src/lib/validation.js`
- Toast notifications via `sonner` (import `toast` from `sonner`)
- Icons from `lucide-react`
- CSS utility classes via Tailwind; custom theme colors in `tailwind.config.js`
- Animations via `framer-motion`
- `cn()` from `src/lib/utils.js` (clsx + tailwind-merge) for conditional class merging
