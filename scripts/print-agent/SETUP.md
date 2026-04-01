# Agente de Impresión Automática — EYR Digital

Cuando la jefa UTP aprueba una prueba → el agente la detecta → cuenta los alumnos del curso → imprime N copias automáticamente.

---

## Antes de empezar

- PC fijo encendido y conectado a la red de la escuela
- Node.js instalado → https://nodejs.org (descargar versión LTS)
- Impresora con IP fija en la red (ej: `192.168.1.100`)
- Acceso a Firebase Console del proyecto EYR Digital

---

## Paso 1 — Credenciales Firebase

1. Ir a [console.firebase.google.com](https://console.firebase.google.com)
2. Seleccionar el proyecto **EYR Digital**
3. Click en ⚙️ **Configuración del proyecto**
4. Pestaña **Cuentas de servicio**
5. Click en **Generar nueva clave privada** → Confirmar
6. Renombrar el archivo descargado a `serviceAccount.json`
7. Copiarlo dentro de `scripts/print-agent/`

> ⚠️ Este archivo es secreto — nunca lo compartas ni lo subas a Git.

---

## Paso 2 — Configurar la impresora

Dentro de `scripts/print-agent/`, duplicar el archivo de ejemplo:

```
cp .env.example .env
```

Abrir `.env` y completar:

```env
PRINTER_IP=192.168.1.100      # IP fija de la impresora
PRINTER_PORT=631              # dejar así
PRINTER_PATH=/ipp/print       # ver nota abajo
EXTRA_COPIES=0                # 0 = solo matrícula del curso
```

### ¿Cómo saber el PRINTER_PATH?

Abrir en el navegador: `http://192.168.1.100:631`

- Si aparece una página con el nombre de la impresora (ej: `HP_LaserJet_M404`), usar:
  ```
  PRINTER_PATH=/printers/HP_LaserJet_M404
  ```
- Si no abre nada, dejar `/ipp/print` (funciona en la mayoría).

---

## Paso 3 — Instalar dependencias

Abrir terminal dentro de la carpeta del proyecto y ejecutar:

```bash
cd scripts/print-agent
npm install
```

> La primera vez descarga Chromium (~200 MB). Puede demorar unos minutos.

---

## Paso 4 — Iniciar el agente

```bash
npm start
```

Si todo está bien verás:

```
🖨️  EYR Agente de Impresión iniciado
   Impresora: 192.168.1.100:631/ipp/print
   Esperando pruebas aprobadas...
```

Cuando la jefa UTP apruebe una prueba:

```
📄 Prueba aprobada: "Prueba Matemática Unidad 2" | Curso: 3A
  👥 Matrícula 3A: 28 alumnos → 28 copias
  🔧 Generando PDF...
  ✅ PDF generado (84 KB)
  → Enviando a http://192.168.1.100:631/ipp/print (28 copias)
  🖨️  Listo — 28 copias enviadas
```

---

## Paso 5 — Que inicie automáticamente al encender el PC

### Windows

1. Presionar `Win + R` → escribir `shell:startup` → Enter
2. En la carpeta que se abre, crear un archivo `eyr-print.bat` con:
   ```bat
   @echo off
   cd /d C:\ruta\a\scripts\print-agent
   node index.js
   ```
3. Guardar. A partir de ahora inicia solo con Windows.

### Mac

Crear el archivo `~/Library/LaunchAgents/eyr.print.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key>             <string>eyr.print.agent</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/ruta/a/scripts/print-agent/index.js</string>
  </array>
  <key>WorkingDirectory</key>  <string>/ruta/a/scripts/print-agent</string>
  <key>RunAtLoad</key>         <true/>
  <key>KeepAlive</key>         <true/>
  <key>StandardOutPath</key>   <string>/tmp/eyr-print.log</string>
  <key>StandardErrorPath</key> <string>/tmp/eyr-print-err.log</string>
</dict></plist>
```

Luego ejecutar:

```bash
launchctl load ~/Library/LaunchAgents/eyr.print.plist
```

---

## Problemas comunes

| Problema | Solución |
|---|---|
| No imprime nada | Verificar IP abriendo `http://IP:631` en el navegador y revisar `PRINTER_PATH` |
| Error `serviceAccount.json not found` | El archivo debe estar dentro de `scripts/print-agent/` con ese nombre exacto |
| Error de permisos Firestore | Regenerar la clave usando una cuenta con rol **Owner** en Firebase |
| Necesito reimprimir | Abrir `.printed_ids.json`, borrar el ID de esa prueba, reiniciar el agente |

---

## Archivos importantes

| Archivo | Para qué sirve |
|---|---|
| `serviceAccount.json` | Credenciales Firebase (descargar del paso 1) |
| `.env` | IP y configuración de la impresora (del paso 2) |
| `.printed_ids.json` | Registro interno — evita reimprimir al reiniciar |

