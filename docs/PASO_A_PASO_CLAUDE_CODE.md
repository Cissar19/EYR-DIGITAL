# Paso a paso — Cobertura Curricular en EYR Digital con Claude Code

> Guía operativa. Mantenela abierta al lado de la terminal mientras ejecutás.
> Estimación: 6 sesiones de Claude Code de 30–60 min cada una, repartidas en 2–3 días.

---

## Antes de empezar (local)

### 0.1 Preparar el repo

```bash
git clone https://github.com/Cissar19/EYR-DIGITAL.git
cd EYR-DIGITAL

# Crear rama para esta feature (no trabajes en main)
git checkout -b feature/cobertura-curricular

# Crear carpetas para el brief y la data
mkdir -p docs data
```

### 0.2 Mover los archivos que te pasé

Copiá al repo los dos archivos:

```bash
# Ajustá la ruta a donde descargaste los archivos
cp ~/Downloads/CLAUDE_CODE_BRIEF.md docs/
cp ~/Downloads/cobertura-curricular-2025.json data/
```

### 0.3 Verificar que tenés Claude Code instalado

```bash
claude --version
# Si no está: npm install -g @anthropic-ai/claude-code
```

### 0.4 Backup de Firestore

**Importante.** Antes de correr cualquier seed, hacé un export del estado actual de Firestore por las dudas:

```bash
gcloud firestore export gs://TU-BUCKET/backups/$(date +%Y%m%d-cobertura-pre)
```

Si nunca configuraste un bucket de backups, pedile a Claude Code en la sesión 1 que te ayude a configurarlo.

---

## Tips generales para usar Claude Code

- **Commit después de cada sesión.** Una sesión = un commit. Si algo se rompe en la sesión siguiente, hacés `git reset --hard HEAD` y no perdiste lo bueno.
- **Usá `/clear` entre sesiones** para liberar contexto. Cada sesión es independiente, leyendo de nuevo el brief.
- **Cuando Claude Code te pregunte algo, respondé corto.** No le des contexto adicional que ya esté en el brief.
- **No le pidas que pruebe en producción.** Siempre `dev`/`staging` o emulador local de Firebase.
- **Si una sesión se va de las manos** (más de 100 archivos modificados, cambios fuera de scope), `Ctrl+C`, descartá los cambios y reintentá con un prompt más acotado.

---

## Sesión 1 — Discovery y resolver bloqueos

> **Objetivo:** que Claude Code entienda el repo, identifique qué falta para empezar, y te ayude a resolver los 3 bloqueos pendientes.

### Lanzar

```bash
cd EYR-DIGITAL
claude
```

### Prompt a pegar

```
Lee primero estos dos archivos:
- docs/CLAUDE_CODE_BRIEF.md (especificación completa de la feature)
- data/cobertura-curricular-2025.json (datos a importar)

Después haz un discovery del repo y respóndeme estas 6 preguntas concretas:

1. ¿Qué versión de React, Vite y Firebase SDK usa el proyecto?
2. ¿Hay un archivo firestore.rules ya? Si sí, pegame su contenido tal cual.
3. ¿Cómo está implementada la autenticación hoy? ¿Existe la noción de "rol" 
   (utp / teacher / directivo)? ¿Dónde se guarda — en users/{uid}.role 
   o en custom claims?
4. ¿Existe ya alguna colección "schools" en Firestore o vamos a crearla? 
   Si vamos a crearla, ¿qué schoolId sugerís?
5. ¿Existe la colección "curriculum/{year}/oas/" con los OAs del MINEDUC? 
   (la necesitamos como pre-requisito del seed)
6. ¿Hay ya hooks para consumir Firestore (ej. useFirestore, useCollection)? 
   ¿O se hace ad-hoc en cada componente?

NO modifiques ningún archivo todavía. Sólo discovery y reporte.
```

### Qué esperar

Claude Code te va a dar un reporte. Anotá las respuestas: las vas a necesitar para las próximas sesiones.

### Resolver bloqueos antes de seguir

Si las respuestas de las preguntas 3, 5 y 6 muestran piezas faltantes, este es el momento de pedirle a Claude Code que las construya **antes** de seguir:

**Si no existe rol UTP:**
```
Necesito agregar el sistema de roles antes de seguir. Implementa:
- Campo `role: 'utp' | 'teacher' | 'directivo' | 'admin'` en users/{uid}
- Hook useUserRole() que retorne el rol del usuario logueado
- Componente <RequireRole role="utp"> para proteger rutas
- Una ruta admin temporal /admin/users donde un admin puede asignar roles
- Reglas de Firestore para que sólo admin pueda escribir el campo role

NO toques nada relacionado con cobertura curricular todavía.
```

**Si no existe `curriculum/2025/oas/`:**
```
Antes del seed de cobertura necesitamos los OAs del MINEDUC en Firestore.
En el chat anterior creamos un scraper Python en scripts/scrape_mineduc.py.
Verifica si existe y si la data está en Firestore en curriculum/2025/oas/.
Si no, dime qué falta para correrlo.
```

### Commit

```bash
git add -A
git commit -m "feat(cobertura): discovery + sistema de roles base"
```

---

## Sesión 2 — Sprint 0: Base multi-año

> **Objetivo:** que la app sepa de años académicos antes de tocar cobertura.

### Prompt

```
Lee docs/CLAUDE_CODE_BRIEF.md sección "Gestión de años académicos" y 
"Sprint 0 — Base multi-año".

Implementa SOLAMENTE el Sprint 0:

1. src/contexts/AcademicYearContext.tsx con el provider y useAcademicYear()
2. Wrappear <AcademicYearProvider> en App.tsx (sólo en las rutas que lo 
   necesiten — pensemos juntos cuáles)
3. Componente <YearSelector /> que muestre pills [2025] [2026 +], donde 
   el "+" sólo aparece si user.role === 'utp'
4. Hook useInitializeYear(newYear) que lee la estructura del año anterior, 
   crea docs vacíos en el nuevo año, y es idempotente
5. Persistir el año seleccionado en localStorage
6. Agrega un test manual en /test/year-selector que monte el componente

NO crees todavía la collection coverage/ ni hagas seed. Sólo el shell multi-año.

Cuando termines, dame los pasos para probarlo localmente con el emulador 
de Firebase.
```

### Validación

- [ ] Cambiar entre 2025 y 2026 actualiza el contexto
- [ ] Refrescar la página mantiene el año seleccionado
- [ ] El botón `+` sólo aparece si tu user es UTP
- [ ] `useInitializeYear(2026)` corrido dos veces no duplica docs

### Commit

```bash
git commit -am "feat(cobertura): sprint 0 - base multi-año (selector + init year)"
```

---

## Sesión 3 — Sprint 1: Modelo + seed de 2025

> **Objetivo:** importar la data del Excel a Firestore. Es la sesión más delicada.

### Pre-requisito

Antes de pegar el prompt, asegurate de tener un proyecto Firebase de **staging** o de tener corriendo el **emulador local**. **No corras el seed contra producción todavía.**

```bash
firebase emulators:start --only firestore,auth
```

### Prompt

```
Lee docs/CLAUDE_CODE_BRIEF.md secciones "Modelo Firestore", "Reglas de 
seguridad" y "Sprint 1".

Implementa el Sprint 1 completo:

1. Tipos TS en src/types/coverage.ts (Coverage, UnitTracking, etc.)
2. firestore.rules con la función isUTP() y las reglas para 
   schools/{}/academicYears/{}/coverage/{}
3. Script scripts/seed_coverage_2025.js que:
   - Lee data/cobertura-curricular-2025.json
   - Verifica que curriculum/2025/oas/ existe (sino aborta con error claro)
   - Resuelve teacherName → teacherId buscando en users/. Si no existe, 
     crea placeholder con users/{uid}.placeholder = true
   - Crea docs en schools/{schoolId}/academicYears/2025/coverage/
   - DocId determinístico: ${grade}_${subject}_${teacherIdSlug}
   - Idempotente (skip si ya existe)
   - Reporta al final: docs creados, profesores placeholder, bloques pending

4. Antes de correr el seed, hacé un dry-run que sólo printee qué iba a hacer
   sin escribir a Firestore.

5. Documenta cómo correr el seed en docs/COBERTURA_SEED.md

PEDIME el schoolId antes de empezar. Y antes de tocar Firestore real, 
corremos el seed contra el emulador y verificamos.
```

### Validación

Antes del commit, verificar manualmente en el emulador (`http://localhost:4000/firestore`):

- [ ] 64 docs en `schools/{id}/academicYears/2025/coverage/`
- [ ] Cada doc tiene `unitTracking` con u1/u2/u3/u4
- [ ] 2 docs con `migrationStatus: 'complete'` (Lenguaje 1° y 2°)
- [ ] 62 docs con `migrationStatus: 'pending'` y `legacyOaStatus` poblado
- [ ] 12 profesores únicos en `users/` (con `placeholder: true` los nuevos)
- [ ] `firestore.rules` rechaza writes sin auth UTP (probar con la consola del emulador)

Si todo OK:

```bash
# Ahora sí: correr contra producción
node scripts/seed_coverage_2025.js --env=production
```

### Commit

```bash
git commit -am "feat(cobertura): sprint 1 - modelo, reglas y seed 2025"
git tag seed-2025-importado  # checkpoint para rollback
```

---

## Sesión 4 — Sprint 2: Vistas de lectura

> **Objetivo:** que cualquier docente pueda ver la cobertura. Sin edición todavía.

### Prompt

```
Lee docs/CLAUDE_CODE_BRIEF.md secciones "Vistas → Lectura" y "Sprint 2".

Implementa el Sprint 2 completo:

1. Hooks en src/hooks/useCoverage.ts:
   - useCoverageByGrade(year, grade) → realtime con onSnapshot
   - useCoverageBySubject(year, subject)
   - useCoverageByTeacher(year, teacherId)
   - useCoverageStats(year)
   Todos leen el year del AcademicYearContext si no se pasa explícito.

2. Helpers de cálculo en src/lib/coverageMath.ts:
   - getOaPasado(unitTracking, oaCode)
   - getTotalPasados(unitTracking, basalesOas)
   - getPorcentaje, getPorcentajePorUnidad
   Con tests unitarios en tests/coverageMath.test.ts.

3. Componentes en src/components/coverage/:
   - <CoverageCard /> 
   - <CoverageGrid /> 
   - <CoverageBarChart /> con Recharts
   - <UnitProgressBar />

4. Páginas en src/pages/cobertura/:
   - PorCurso.tsx (route /cobertura/curso/:grade)
   - PorAsignatura.tsx (route /cobertura/asignatura/:subject)
   - PorDocente.tsx (route /cobertura/docente/:teacherId)
   - Dashboard.tsx (route /cobertura/dashboard)

5. Agregar links en el nav principal de EYR Digital.

REFERENCIA VISUAL: el prototipo que vimos en chat. Replica el look:
- Cards con barra de progreso, %, badge "migrar" si aplica
- Color: rojo <50%, amarillo 50-80%, verde >80%
- Cobertura global del curso arriba a la derecha

Cuando termines, dame las URLs locales para validar las 4 vistas.
```

### Validación

- [ ] `/cobertura/curso/1B` muestra los 5 bloques de 1° con sus %
- [ ] `/cobertura/asignatura/lenguaje` compara los 8 cursos
- [ ] `/cobertura/docente/{tu-uid}` muestra tu propia carga horaria
- [ ] `/cobertura/dashboard` muestra el grid completo curso × asignatura
- [ ] Cambiar el año en el `<YearSelector />` actualiza todas las vistas
- [ ] En 2026 (vacío) las vistas muestran un estado vacío amigable
- [ ] Performance: la vista por curso carga en < 1s

### Commit

```bash
git commit -am "feat(cobertura): sprint 2 - vistas de lectura"
```

---

## Sesión 5 — Sprint 3: Edición UTP + migración

> **Objetivo:** UTP puede editar OAs y migrar los 62 bloques pendientes.

### Prompt

```
Lee docs/CLAUDE_CODE_BRIEF.md secciones "Vistas → Edición" y "Sprint 3".

Implementa el Sprint 3 completo:

1. Guard <RequireRole role="utp"> en todas las rutas /admin/*

2. Página /admin/cobertura (lista todos los bloques con filtros):
   - Filtros: año, curso, asignatura, docente, estado de migración
   - Banner arriba: "Hay X bloques pendientes de migración. [Migrar todos]"
   - Click en fila → /admin/cobertura/{id}/edit

3. Componente <OAUnitEditor /> en /admin/cobertura/{id}/edit:
   - Tabs U1 / U2 / U3 / U4 con % por unidad como en el prototipo
   - Lista de OAs del MINEDUC con checkboxes
   - Si un OA está marcado en otra unidad, mostrar badge 
     "también en U2" pero permitir marcarlo
   - Auto-save con debounce 500ms
   - Indicador "Guardado" / "Guardando..." / "Error" en la esquina
   - Campo "Docente asignado" editable (dropdown de users con role teacher)
   - Campos evaluaciones sem1 / sem2

4. Página de migración /admin/cobertura/{id}/migrar:
   - Sólo accesible si migrationStatus !== 'complete'
   - Lista los OAs en legacyOaStatus marcados como true
   - Para cada uno, dropdown "Asignar a: U1 / U2 / U3 / U4 / no aplica"
   - Modo bulk: "Asignar todos los pendientes a U1 por defecto" 
     (botón para acelerar la primera carga)
   - Botón "Confirmar": mueve a unitTracking, borra legacyOaStatus, 
     setea migrationStatus: 'complete'
   - Si UTP cierra a medias: migrationStatus: 'partial'

5. Audit log: cada edit graba en audit/{id} { uid, timestamp, action, before, after }

REFERENCIA VISUAL: el prototipo del editor que vimos. Replica el look.

Antes de empezar, pregúntame: ¿el modo bulk "todo a U1" lo agrego o no?
```

### Validación

- [ ] Un docente (no UTP) que entra a `/admin/cobertura` es redirigido
- [ ] UTP puede marcar/desmarcar OAs y se guarda solo
- [ ] Cerrar y reabrir mantiene los cambios
- [ ] La página de migración procesa un bloque pending → complete correctamente
- [ ] El audit log se está poblando
- [ ] Las reglas de Firestore rechazan writes de no-UTP (probar con curl o consola)

### Commit

```bash
git commit -am "feat(cobertura): sprint 3 - edición UTP + migración legacy"
```

---

## Sesión 6 — Pulido, comparativa multi-año y deploy

> **Objetivo:** dejar la feature pulida y desplegada en producción.

### Prompt

```
Quedan 4 cosas para cerrar la feature de cobertura curricular:

1. Comparativa multi-año en /cobertura/dashboard:
   - Toggle "Comparar con año anterior"
   - Segunda barra/línea con el % del año previo a la misma fecha del calendario

2. Cierre de año:
   - En /admin/cobertura, botón (sólo super-admin) "Cerrar año {YYYY}"
   - Setea meta.active: false en academicYears/{year}
   - Las reglas de Firestore deben prohibir update si meta.active === false

3. Estados de error y vacíos en todas las vistas:
   - Sin permisos
   - Sin datos para el año
   - Error de red
   - Currículum del año no cargado

4. README en docs/COBERTURA.md explicando:
   - Cómo agregar un año nuevo
   - Cómo asignar rol UTP a un usuario
   - Cómo correr el seed
   - Cómo hacer rollback si algo sale mal

5. Checklist para deploy:
   - Tests pasan
   - Reglas de Firestore validadas
   - Variables de entorno documentadas
   - Backup de Firestore antes de mergear
```

### Validación final (smoke test en staging)

- [ ] Login como UTP → ver dashboard 2025 → marcar OAs → cambiar a 2026 → inicializar 2026 → marcar OAs en 2026
- [ ] Login como docente → ver sólo sus bloques → no puede editar
- [ ] Login como anónimo → redirigido a login

### Merge a main y deploy

```bash
# Pull request, code review, mergear
git checkout main
git merge feature/cobertura-curricular

# Deploy reglas primero (importante)
firebase deploy --only firestore:rules

# Deploy del frontend
npm run build
firebase deploy --only hosting
```

---

## Si algo se rompe

### Rollback de código

```bash
git reset --hard <hash-del-commit-anterior>
```

### Rollback del seed (si rompiste data)

```bash
# Listar backups
gsutil ls gs://TU-BUCKET/backups/

# Restaurar
gcloud firestore import gs://TU-BUCKET/backups/20260427-cobertura-pre
```

### Cuando Claude Code se traba o alucina

- `Ctrl+C` para cortar
- `git status` y `git diff` para ver qué cambió
- `git checkout .` para descartar
- Empezar nueva sesión con `/clear` y prompt más acotado

---

## Resumen visual del flujo

```
Sesión 1 — Discovery        → entender el repo, resolver bloqueos
Sesión 2 — Sprint 0         → base multi-año (sin tocar cobertura aún)
Sesión 3 — Sprint 1         → modelo + seed 2025 ⚠️ delicada
Sesión 4 — Sprint 2         → vistas de lectura para todos
Sesión 5 — Sprint 3         → edición UTP + migración legacy
Sesión 6 — Pulido + deploy  → comparativa multi-año, cierre, prod
```

Cada sesión termina con un commit. Cada sprint es testable independientemente.
La sesión 3 es la única donde se toca data real — hacé backup antes.

---

## Cuando terminés

Te van a quedar:
- 64 bloques de 2025 importados (con 62 listos para que UTP migre a unidades)
- Año 2026 listo para inicializarse cuando empiece el año escolar
- 4 vistas de lectura para toda la comunidad docente
- 3 vistas de edición sólo para UTP
- El Excel ya no se usa más
