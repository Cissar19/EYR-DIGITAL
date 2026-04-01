/**
 * printer.js
 * Envía un PDF a la impresora IP via protocolo IPP.
 */
const ipp = require('node-ipp');

/**
 * @param {Buffer} pdfBuffer  — contenido del PDF
 * @param {number} copies     — número de copias
 * @param {string} jobName    — nombre del trabajo de impresión
 */
async function printPdf(pdfBuffer, copies, jobName) {
    const printerIp   = process.env.PRINTER_IP;
    const printerPort = process.env.PRINTER_PORT || '631';
    const printerPath = process.env.PRINTER_PATH || '/ipp/print';

    if (!printerIp) throw new Error('PRINTER_IP no está configurado en .env');

    const uri = `http://${printerIp}:${printerPort}${printerPath}`;
    console.log(`  → Enviando a ${uri} (${copies} copia${copies !== 1 ? 's' : ''})`);

    const printer = new ipp.Printer(uri);

    return new Promise((resolve, reject) => {
        const msg = {
            'operation-attributes-tag': {
                'requesting-user-name': 'EYR-Agente',
                'job-name': jobName || 'Prueba EYR',
                'document-format': 'application/pdf',
            },
            'job-attributes-tag': {
                copies: copies,
                'multiple-document-handling': 'separate-documents-collated-copies',
            },
            data: pdfBuffer,
        };

        printer.execute('Print-Job', msg, (err, res) => {
            if (err) return reject(err);
            const state = res?.['job-attributes-tag']?.['job-state'] || 'desconocido';
            console.log(`  ✓ Trabajo creado — estado: ${state}`);
            resolve(res);
        });
    });
}

module.exports = { printPdf };
