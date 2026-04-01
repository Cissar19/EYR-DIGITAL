/**
 * index.js — Agente de impresión automática EYR
 *
 * Escucha Firestore. Cuando una evaluación cambia a status='approved'
 * y aún no fue impresa, genera el PDF y lo manda a la impresora IP.
 *
 * Uso:
 *   1. Copiar .env.example → .env y completar valores
 *   2. Copiar serviceAccount.json (desde Firebase Console)
 *   3. npm install
 *   4. node index.js
 */
require('dotenv').config();
const admin    = require('firebase-admin');
const puppeteer = require('puppeteer');
const fs       = require('fs');
const path     = require('path');
const { renderHtml }  = require('./renderHtml');
const { printPdf }    = require('./printer');

// ── Persistencia local de IDs ya impresos ────────────────────────────────────
const PRINTED_FILE = path.join(__dirname, '.printed_ids.json');

function getPrintedIds() {
    try { return new Set(JSON.parse(fs.readFileSync(PRINTED_FILE, 'utf8'))); }
    catch { return new Set(); }
}

function markPrinted(id) {
    const ids = getPrintedIds();
    ids.add(id);
    fs.writeFileSync(PRINTED_FILE, JSON.stringify([...ids], null, 2));
}

// ── Firebase Admin ────────────────────────────────────────────────────────────
const serviceAccountPath = path.join(__dirname, 'serviceAccount.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌  Falta serviceAccount.json — descárgalo desde Firebase Console:');
    console.error('   Proyecto → Configuración → Cuentas de servicio → Generar clave privada');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
});
const db = admin.firestore();

// ── Generar PDF ───────────────────────────────────────────────────────────────
let browser = null;

async function getBrowser() {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
    }
    return browser;
}

async function generatePdf(evaluacion, formatoData) {
    const html = renderHtml(evaluacion, formatoData);
    const b    = await getBrowser();
    const page = await b.newPage();
    try {
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({
            format: 'A4',
            margin: { top: '18mm', right: '20mm', bottom: '18mm', left: '20mm' },
            printBackground: true,
        });
        return pdf;
    } finally {
        await page.close();
    }
}

// ── Procesar una evaluación aprobada ─────────────────────────────────────────
async function processEvaluacion(evalDoc) {
    const data = evalDoc.data();
    const id   = evalDoc.id;

    console.log(`\n📄 Prueba aprobada: "${data.name}" | Curso: ${data.curso}`);

    // 1. Cantidad de alumnos matriculados en el curso
    const studentsSnap = await db.collection('students')
        .where('curso', '==', data.curso)
        .get();

    const matricula   = studentsSnap.size;
    const extraCopies = parseInt(process.env.EXTRA_COPIES || '0', 10);
    const copies      = Math.max(1, matricula + extraCopies);

    console.log(`  👥 Matrícula ${data.curso}: ${matricula} alumnos → ${copies} copia${copies !== 1 ? 's' : ''}`);

    // 2. Cargar formato de prueba (app_config/utp_formato)
    let formatoData = null;
    try {
        const fSnap = await db.collection('app_config').doc('utp_formato').get();
        if (fSnap.exists) formatoData = fSnap.data();
    } catch (err) {
        console.warn('  ⚠️  No se pudo cargar formato, usando valores por defecto');
    }

    // 3. Generar PDF
    console.log('  🔧 Generando PDF...');
    const pdfBuffer = await generatePdf(data, formatoData);
    console.log(`  ✅ PDF generado (${(pdfBuffer.length / 1024).toFixed(0)} KB)`);

    // 4. Enviar a impresora
    const jobName = `${data.name} — ${data.curso} — ${data.date}`;
    await printPdf(pdfBuffer, copies, jobName);

    // 5. Marcar como impreso localmente
    markPrinted(id);
    console.log(`  🖨️  Listo: "${data.name}" — ${copies} copia${copies !== 1 ? 's' : ''} enviadas`);
}

// ── Listener principal ────────────────────────────────────────────────────────
async function main() {
    console.log('🖨️  EYR Agente de Impresión iniciado');
    console.log(`   Impresora: ${process.env.PRINTER_IP}:${process.env.PRINTER_PORT || 631}${process.env.PRINTER_PATH || '/ipp/print'}`);
    console.log('   Esperando pruebas aprobadas...\n');

    const printedIds = getPrintedIds();
    if (printedIds.size > 0) {
        console.log(`   (${printedIds.size} prueba${printedIds.size !== 1 ? 's' : ''} ya impresas — no se repetirán)\n`);
    }

    db.collection('evaluaciones')
        .where('status', '==', 'approved')
        .onSnapshot(async (snap) => {
            for (const doc of snap.docs) {
                if (getPrintedIds().has(doc.id)) continue;  // ya impreso

                try {
                    await processEvaluacion(doc);
                } catch (err) {
                    console.error(`  ❌ Error imprimiendo "${doc.data().name}": ${err.message}`);
                }
            }
        }, (err) => {
            console.error('❌ Error en listener de Firestore:', err.message);
        });
}

main().catch((err) => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
});

// Limpieza al cerrar
process.on('SIGINT', async () => {
    console.log('\n👋 Cerrando agente...');
    if (browser) await browser.close();
    process.exit(0);
});
