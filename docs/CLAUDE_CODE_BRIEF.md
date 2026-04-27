# EYR Digital — Feature: Cobertura Curricular (v2)

> Brief para Claude Code. Stack ya existente: React + Vite + Firebase + Tailwind.

## Decisiones tomadas

1. **Tracking por unidad** (`u1`/`u2`/`u3`/`u4`) es **obligatorio para todas las asignaturas**. No hay campo plano `oaStatus`.
2. **Sólo UTP edita.** Los docentes son lectores. Tiene que existir un sistema de roles (`users/{uid}.role` o custom claims).
3. **OAs basales vienen del MINEDUC**, no se guardan en cada doc de cobertura. Una sola fuente de verdad: `curriculum/{year}/oas/`.

## Modelo Firestore

```
schools/{schoolId}/
│
├── academicYears/{year}/                                  // doc: "2025"
│   │   meta: { startDate, endDate, active: true }
│   │
│   └── coverage/{coverageId}                              // un doc por (grade × subject × teacher)
│       ├── grade: "1B"
│       ├── gradeNumber: 1
│       ├── subject: "lenguaje"                             // slug
│       ├── subjectLabel: "Lenguaje y Comunicación"
│       ├── teacherId: "uid_xxx"                            // referencia a users/
│       ├── teacherName: "Juan Figueroa Huinca"             // denormalizado
│       │
│       ├── unitTracking: {                                 // 🔑 fuente de verdad
│       │     u1: { "OA01": true, "OA03": true, ... },
│       │     u2: { "OA01": false, ... },
│       │     u3: {...},
│       │     u4: {...}
│       │   }
│       │
│       ├── legacyOaStatus: { "OA01": true, ... }           // sólo durante migración 2025
│       ├── migrationStatus: "pending" | "partial" | "complete"
│       │
│       ├── evaluaciones: { sem1: 6, sem2: 6 }
│       ├── createdAt, updatedAt: Timestamp
│       └── updatedBy: "uid_utp"
│
├── teachers/{teacherId}                                    // ya existe
└── users/{uid}.role: "utp" | "teacher" | "directivo"
```

### Campos derivados (calculados en cliente, NO guardados)

```ts
// totalBasales viene del currículum oficial
totalBasales = curriculum[year][grade][subject].oas.length

// OA pasado = marcado en cualquier unidad
oaPasado(oaCode) = ['u1','u2','u3','u4'].some(u => unitTracking[u][oaCode] === true)

// Total pasados
totalPasados = curriculum[year][grade][subject].oas
                .filter(oa => oaPasado(oa.code)).length

// Porcentaje
porcentaje = totalPasados / totalBasales

// Cobertura por unidad (para gráfico de avance temporal)
porcentajeUnidad(u) = Object.values(unitTracking[u]).filter(Boolean).length / totalBasales
```

### Por qué NO guardar derivados

Si guardás `totalPasados` o `porcentaje` en el doc, se desincronizan con `unitTracking` apenas el cliente edita y falla un commit. Calcularlos en cliente garantiza consistencia.

## Reglas de seguridad

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isUTP() {
      return request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'utp';
    }
    
    function isAuthed() {
      return request.auth != null;
    }
    
    match /schools/{schoolId}/academicYears/{year}/coverage/{docId} {
      // Toda la comunidad logueada puede leer
      allow read: if isAuthed();
      // Sólo UTP edita
      allow create, update: if isUTP();
      allow delete: if isUTP();
    }
    
    match /curriculum/{year}/oas/{oaId} {
      allow read: if isAuthed();
      allow write: if isUTP();  // Sólo UTP carga el seed del MINEDUC
    }
  }
}
```

> ⚠️ Confirmar con el usuario cómo está implementado el rol UTP hoy en EYR Digital. Si usa custom claims (`request.auth.token.role == 'utp'`), reemplazar `isUTP()` accordingly.

## Gestión de años académicos

La plataforma debe **reemplazar completamente el Excel** y permitir trabajar con múltiples años.

### Selector de año (global)

Componente persistente en el header de toda la sección de cobertura. Estado global vía Context API:

```ts
// src/contexts/AcademicYearContext.tsx
const AcademicYearContext = createContext<{
  year: number;
  setYear: (y: number) => void;
  availableYears: number[];     // ['2025', '2026', ...]
}>({ ... });
```

- El año activo se persiste en `localStorage` para que dure entre sesiones
- Todos los hooks (`useCoverageByGrade`, etc.) leen este año automáticamente
- `availableYears` se carga de `schools/{schoolId}/academicYears/` (lista los docs hijo)

### Inicializar un nuevo año (sólo UTP)

Cuando UTP entra a un año que **no existe aún** (ej. 2026 al iniciar el año escolar), la vista muestra estado vacío con botón **"Inicializar año {YYYY} desde {YYYY-1}"**.

Al hacer clic:

1. **Confirmar fuentes** en un diálogo:
   - Estructura (qué asignatura dicta cada docente en cada curso) → copiar de `{año-1}`
   - OAs basales → leer de `curriculum/{nuevo-año}/oas/` (si no está poblado, primero correr scraper MINEDUC para ese año)
   - Marcas de OAs (`unitTracking`) → empezar vacío
   - Evaluaciones → empezar en `null`
2. **Validar** que el currículum del nuevo año exista. Si MINEDUC no cambió el curriculum entre años (común), reutilizar el del año anterior.
3. **Crear docs** en `schools/{schoolId}/academicYears/{nuevoAño}/coverage/` con:
   - `unitTracking: {u1:{}, u2:{}, u3:{}, u4:{}}`
   - `migrationStatus: 'complete'` (no hay legacy en años nuevos, sólo 2025)
   - `evaluaciones: { sem1: null, sem2: null }`
   - Mismo `teacherId`, `subject`, `grade` que el año anterior
4. **Idempotente**: si el botón se presiona dos veces, no duplicar.
5. **Audit log**: guardar en `audit/` qué UTP inicializó el año y cuándo.

### Comparativas multi-año

Una vez existan 2+ años, agregar a `/cobertura/dashboard`:
- Toggle "Comparar con año anterior"
- Línea o segunda barra mostrando el % del año previo a la misma fecha
- Útil para ver: "en mayo de 2025 íbamos en 30%, este año vamos en 45% — vamos mejor"

### Cambios de docente entre años

Caso típico: un profesor se va, llega otro. La inicialización copia la asignación anterior, pero UTP debe poder reasignar. Agregar en `/admin/cobertura/{id}/edit`:
- Campo "Docente asignado" con dropdown de `users/` filtrado por rol `teacher`
- Cambiarlo actualiza `teacherId` y `teacherName` del doc

### Cierre de año

Cuando termina el año académico, UTP marca `meta.active: false` en `academicYears/{year}`. Los docs siguen siendo legibles (histórico) pero no editables (regla extra: `allow update: if isUTP() && resource.data.year-meta.active == true`).

## Vistas

### Lectura (todos los docentes)

| Ruta | Vista | Notas |
|---|---|---|
| `/cobertura/curso/:grade` | Cards por asignatura del curso, con barra de progreso y % | Replica el "bloque superior" del Excel |
| `/cobertura/asignatura/:subject` | Asignatura comparada en los 8 cursos. Tabla + bar chart Recharts | |
| `/cobertura/docente/:teacherId` | Todos los bloques de ese docente | El docente logueado entra acá por default |
| `/cobertura/dashboard` | Grid global curso × asignatura, código de color (rojo <50%, amarillo 50-80%, verde >80%) | Filtros por año y por unidad |

### Edición (solo UTP)

| Ruta | Vista | Notas |
|---|---|---|
| `/admin/cobertura` | Lista de todos los bloques con filtros (año, curso, asignatura, docente, estado de migración). Cada fila → editor | Pantalla principal de UTP |
| `/admin/cobertura/:coverageId/edit` | Editor con tabs UNIDAD 1-4. En cada tab: lista de OAs (de MINEDUC) con checkbox. Auto-save. | El editor lee `curriculum/{year}/oas/{grade}/{subject}` para mostrar la lista oficial de OAs |
| `/admin/cobertura/migrar/:coverageId` | Pantalla especial cuando `migrationStatus !== 'complete'`. Muestra los OAs marcados en `legacyOaStatus` y permite asignarlos a una unidad. Al terminar, marca `complete` y limpia `legacyOaStatus`. | Sólo se ve si hay legacy data |
| `/admin/cobertura/seed` | Importa el JSON inicial (un solo uso) | Sólo accesible para super-admin o por env flag |

## Tareas para Claude Code

### Sprint 0 — Base multi-año

1. **Context de año académico** en `src/contexts/AcademicYearContext.tsx`:
   - Provee `year`, `setYear`, `availableYears`
   - Persiste en localStorage
   - `availableYears` se obtiene de `getDocs(collection(db, 'schools', schoolId, 'academicYears'))`

2. **Componente `<YearSelector />`** en el layout principal: pills 2025 / 2026 / + (para inicializar nuevo año, sólo UTP).

3. **Hook `useInitializeYear(newYear)`** sólo accesible si `user.role === 'utp'`:
   - Verifica que `curriculum/{newYear}/oas/` exista (sino, solicita correr scraper)
   - Lee toda la estructura de `academicYears/{newYear-1}/coverage/`
   - Crea los docs nuevos con `unitTracking` vacío
   - Es idempotente (skip si ya existen docs en el nuevo año)

### Sprint 1 — Modelo y seed inicial 2025

1. **Tipos TS** en `src/types/coverage.ts`:
   ```ts
   export type UnitKey = 'u1' | 'u2' | 'u3' | 'u4';
   export type UnitTracking = Record<UnitKey, Record<string, boolean>>;
   export type MigrationStatus = 'pending' | 'partial' | 'complete';
   
   export interface Coverage {
     grade: GradeCode; subject: SubjectSlug;
     teacherId: string; teacherName: string;
     unitTracking: UnitTracking;
     legacyOaStatus?: Record<string, boolean>;
     migrationStatus: MigrationStatus;
     evaluaciones: { sem1: number | null; sem2: number | null };
     createdAt: Timestamp; updatedAt: Timestamp; updatedBy: string;
   }
   ```

2. **Reglas de Firestore** en `firestore.rules` (ver bloque arriba). Confirmar implementación de roles UTP.

3. **Script de seed** en `scripts/seed_coverage_2025.js`:
   - Lee `data/cobertura-curricular-2025.json`
   - Para cada bloque, busca o crea `teacherId` en `users/` por `teacherName`
   - Crea doc en `schools/{schoolId}/academicYears/2025/coverage/`
   - Idempotente: docId determinístico = `${grade}_${subject}_${teacherSlug}`
   - Reporta al final: cuántos bloques quedaron `pending` para que UTP los migre

4. **Verificación post-seed:** asegurarse de que el scraper MINEDUC ya cargó `curriculum/2025/oas/` antes del seed de cobertura. Si no, abortar con mensaje claro.

### Sprint 2 — Lectura

5. Hooks en `src/hooks/useCoverage.ts`:
   - `useCoverageByGrade(year, grade)`
   - `useCoverageBySubject(year, subject)`
   - `useCoverageByTeacher(year, teacherId)`
   - `useCoverageStats(year)` (para dashboard)
   - Todos retornan `{ data, loading, error }` y son realtime (`onSnapshot`).

6. Helpers de cálculo en `src/lib/coverageMath.ts`:
   - `getOaPasado(unitTracking, oaCode)`
   - `getTotalPasados(unitTracking, basalesOas)`
   - `getPorcentaje(...)`
   - `getPorcentajePorUnidad(...)`

7. Componentes UI:
   - `<CoverageCard />` — bloque de asignatura con progreso (lectura)
   - `<CoverageGrid />` — grid curso × asignatura (dashboard)
   - `<CoverageBarChart />` — Recharts, % por curso/asignatura
   - `<UnitProgressBar />` — barra segmentada con % por unidad

8. Páginas de lectura (las 4 rutas /cobertura/...).

### Sprint 3 — Edición UTP

9. Guard en rutas `/admin/*`: redirigir si `user.role !== 'utp'`.

10. `<OAUnitEditor />` — editor con tabs u1/u2/u3/u4. Cada tab muestra la lista oficial de OAs de MINEDUC con checkboxes. Cuando el OA está marcado en otra unidad, mostrar un badge "ya marcado en U2" pero permitir marcarlo también si corresponde.

11. Auto-save con debounce (500ms). Mostrar indicador "Guardado" / "Guardando..." / "Error".

12. **Pantalla de migración** (`/admin/cobertura/migrar/:id`):
    - Lista los OAs de `legacyOaStatus` que están en `true`.
    - Para cada uno, dropdown "Asignar a: U1 / U2 / U3 / U4 / no aplica".
    - Botón "Confirmar migración" → mueve los OAs a `unitTracking[u]`, borra `legacyOaStatus`, setea `migrationStatus: 'complete'`.
    - Si UTP cierra sin terminar, guarda `migrationStatus: 'partial'`.

13. Banner global en `/admin/cobertura`: "Hay X bloques pendientes de migración. [Migrar ahora]"

## Validaciones del seed

- ✅ Verificar que `curriculum/2025/oas/` esté poblado antes (sino abortar)
- ✅ Resolver `teacherName → teacherId` (crear placeholders si no existen, marcando `users/{uid}.placeholder: true` para que UTP los complete)
- ✅ Idempotencia: re-correr el script no duplica docs
- ✅ Validar que los OAs de `legacyOaStatus` existan en el currículum oficial. Si un OA del Excel no está en MINEDUC, loguear warning (puede ser que el Excel use codificación distinta o un OA fue removido del curriculum).

## Datos iniciales (`cobertura-curricular-2025.json` adjunto)

- 8 cursos × ~8 asignaturas = **64 bloques**
- 12 profesores únicos (con duplicados de nombres ya normalizados — ver `TEACHER_ALIASES` en el script)
- **2 bloques** con `migrationStatus: complete` (Lenguaje 1° y 2°, que sí tenían unidades en el Excel)
- **62 bloques** con `migrationStatus: pending` (todo el resto, UTP debe migrarlos)
- Campo `excelTotalBasales` incluido para auditoría: comparar con el `totalBasales` derivado del MINEDUC y detectar discrepancias.

## Riesgos a considerar

1. **Discrepancia entre OAs del Excel y MINEDUC**: el Excel marca "OA 23" en Lenguaje 1° pero MINEDUC puede no tenerlo. Loguear estos casos durante el seed.
2. **Permisos UTP**: si el sistema actual no tiene rol UTP definido, hay que crearlo antes. Confirmar con el usuario qué docente(s) tienen ese rol.
3. **Volumen de migración**: 62 bloques × ~10 OAs cada uno = ~600 decisiones manuales para UTP. Considerar un modo "asignar todos a U1 por default y refinar" para acelerar.
