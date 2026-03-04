# EYR-DIGITAL

Sistema de administracion escolar digital desarrollado para el colegio Huechuraba. Permite gestionar horarios, reservas de laboratorio, inventario, centro de impresion, dias administrativos y mas.

## Tecnologias

- **React 19** con Vite
- **Tailwind CSS** para estilos
- **Firebase** (autenticacion y Firestore)
- **Framer Motion** para animaciones
- **Recharts** para graficos
- **React Router** para navegacion

## Funcionalidades

- Inicio de sesion con autenticacion Firebase
- Dashboard para administradores y profesores
- Gestion de horarios escolares
- Reserva de laboratorios
- Control de inventario
- Centro de impresion
- Seguimiento de dias administrativos
- Sistema de tickets
- Solicitud de equipamiento
- Gestion de usuarios (admin)

## Instalacion

```bash
npm install
```

## Variables de entorno

Crear un archivo `.env` con las credenciales de Firebase:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Desarrollo

```bash
npm run dev
```

## Build

```bash
npm run build
```
