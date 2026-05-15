# EYR-DIGITAL — Migración Firebase → Backend Propio

Sistema de administración escolar Centro Educacional Ernesto Yañez Rivera.
Proyecto frontend: `school-admin-days` (React 19 + Vite + Firebase)
Objetivo: migrar Firebase a backend propio en servidor local.

## Contexto

El frontend usa Firebase (Firestore, Auth, Storage) con 21 context providers,
cada uno con `onSnapshot()`. La migración reemplaza Firebase con:
- Auth → JWT en `/api/auth`
- Firestore → PostgreSQL via API REST
- Storage → MinIO
- onSnapshot → Socket.io
- Google Apps Script → Nodemailer

El backend ya está corriendo en `http://10.10.56.33/api`

## Rama de trabajo

```
main          ← producción Firebase intacto, NUNCA tocar
migracion     ← todo el trabajo ocurre aquí (rama actual)
```

## REGLAS CRÍTICAS — Firebase protegido

- **NUNCA** modificar `firebase.json`, `firestore.rules`, `storage.rules`
- **NUNCA** modificar `src/firebase/` ni ningún archivo de configuración de Firebase
- **NUNCA** ejecutar comandos destructivos sobre Firestore
- **NUNCA** hacer merge a `main` sin aprobación explícita
- **NUNCA** cambiar variables de entorno de Vercel (producción)
- Solo modificar archivos en la rama `migracion`

## Archivos nuevos a crear (no tocar los existentes)

```
src/lib/apiClient.js      ← cliente fetch para la nueva API
src/lib/socket.js         ← cliente Socket.io
src/lib/featureFlags.js   ← flags por módulo
```

## Feature flags

Cada módulo tiene su propio flag en `.env`. Si el flag es `false`,
el módulo sigue usando Firebase exactamente igual que hoy.
Solo activar cuando el módulo esté probado.

```javascript
// src/lib/featureFlags.js
export const FLAGS = {
  USE_NEW_API_AUTH:          import.meta.env.VITE_USE_NEW_API_AUTH === 'true',
  USE_NEW_API_TASKS:         import.meta.env.VITE_USE_NEW_API_TASKS === 'true',
  USE_NEW_API_TODOS:         import.meta.env.VITE_USE_NEW_API_TODOS === 'true',
  USE_NEW_API_USERS:         import.meta.env.VITE_USE_NEW_API_USERS === 'true',
  USE_NEW_API_INVENTORY:     import.meta.env.VITE_USE_NEW_API_INVENTORY === 'true',
  USE_NEW_API_STUDENTS:      import.meta.env.VITE_USE_NEW_API_STUDENTS === 'true',
  USE_NEW_API_ATTENDANCE:    import.meta.env.VITE_USE_NEW_API_ATTENDANCE === 'true',
  USE_NEW_API_CONVIVENCIA:   import.meta.env.VITE_USE_NEW_API_CONVIVENCIA === 'true',
  USE_NEW_API_EVALUACIONES:  import.meta.env.VITE_USE_NEW_API_EVALUACIONES === 'true',
  USE_NEW_API_RETOS:         import.meta.env.VITE_USE_NEW_API_RETOS === 'true',
  USE_NEW_API_WORKSHOPS:     import.meta.env.VITE_USE_NEW_API_WORKSHOPS === 'true',
  USE_NEW_API_NOTIFICATIONS: import.meta.env.VITE_USE_NEW_API_NOTIFICATIONS === 'true',
  USE_NEW_API_ADMIN_DAYS:    import.meta.env.VITE_USE_NEW_API_ADMIN_DAYS === 'true',
};
```

## Cliente API (`src/lib/apiClient.js`)

```javascript
const BASE_URL = import.meta.env.VITE_API_URL || 'http://10.10.56.33/api';

function getToken() {
  return localStorage.getItem('eyr_token');
}

async function request(method, path, body = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  if (res.status === 401) {
    localStorage.removeItem('eyr_token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error en la solicitud');
  }
  return res.json();
}

export const apiClient = {
  get:    (path)       => request('GET', path),
  post:   (path, body) => request('POST', path, body),
  put:    (path, body) => request('PUT', path, body),
  patch:  (path, body) => request('PATCH', path, body),
  delete: (path)       => request('DELETE', path),
};
```

## Cliente Socket.io (`src/lib/socket.js`)

```javascript
import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  const URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://10.10.56.33';
  socket = io(URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
  });
  socket.on('connect', () => console.log('Socket conectado'));
  socket.on('disconnect', () => console.log('Socket desconectado'));
  return socket;
}

export function getSocket() { return socket; }
export function disconnectSocket() { if (socket) socket.disconnect(); }
```

## Patrón de migración por contexto

Antes (Firebase):
```javascript
import { onSnapshot, collection } from 'firebase/firestore';
const unsubscribe = onSnapshot(collection(db, 'tasks'), (snap) => {
  setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
});
```

Después (nueva API):
```javascript
import { apiClient } from '../lib/apiClient';
import { getSocket } from '../lib/socket';

const data = await apiClient.get('/tasks');
setTasks(data);

const socket = getSocket();
socket.on('tasks:created', task => setTasks(prev => [...prev, task]));
socket.on('tasks:updated', task => setTasks(prev => prev.map(t => t.id === task.id ? task : t)));
socket.on('tasks:deleted', ({ id }) => setTasks(prev => prev.filter(t => t.id !== id)));
```

## Variables de entorno a agregar al .env

```bash
VITE_API_URL=http://10.10.56.33/api

# Feature flags — todos en false hasta que estén probados
VITE_USE_NEW_API_AUTH=false
VITE_USE_NEW_API_TASKS=false
VITE_USE_NEW_API_TODOS=false
VITE_USE_NEW_API_USERS=false
VITE_USE_NEW_API_INVENTORY=false
VITE_USE_NEW_API_STUDENTS=false
VITE_USE_NEW_API_ATTENDANCE=false
VITE_USE_NEW_API_CONVIVENCIA=false
VITE_USE_NEW_API_EVALUACIONES=false
VITE_USE_NEW_API_RETOS=false
VITE_USE_NEW_API_WORKSHOPS=false
VITE_USE_NEW_API_NOTIFICATIONS=false
VITE_USE_NEW_API_ADMIN_DAYS=false
```

## Orden de migración de contextos

Migrar en este orden (menor a mayor complejidad):
1. `TodoContext` — CRUD simple
2. `TasksContext` — CRUD con asignación
3. `InventoryContext`
4. `WorkshopsContext`
5. `RetosContext`
6. `NotificationsContext`
7. `StudentsContext`
8. `AttendanceContext`
9. `AdministrativeDaysContext`
10. `EvaluacionesContext`
11. `AuthContext` — dejar para el final

## Lo que NO hacer

- No modificar archivos de Firebase existentes
- No hacer merge a `main`
- No activar flags sin probar primero
- No borrar imports de Firebase hasta que el flag esté en `true` y probado
- No commitear `.env`
