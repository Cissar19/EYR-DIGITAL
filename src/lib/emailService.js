const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_ADMIN_DAYS_URL;
const APPS_SCRIPT_SECRET = import.meta.env.VITE_APPS_SCRIPT_SECRET;

/**
 * Sends an assignment notification email via Google Apps Script.
 * Fire-and-forget: does not block the UI.
 *
 * @param {{ toEmail: string, toName: string, actionType: string, date: string, reason: string, details?: string }} params
 */
export function sendAssignmentEmail({ toEmail, toName, actionType, date, reason, details }) {
    if (!APPS_SCRIPT_URL || !APPS_SCRIPT_SECRET) {
        console.warn('[EmailService] VITE_APPS_SCRIPT_ADMIN_DAYS_URL o VITE_APPS_SCRIPT_SECRET no configurados. Email no enviado.');
        return;
    }

    if (!toEmail) {
        console.warn('[EmailService] No se proporcionó email del destinatario. Email no enviado.');
        return;
    }

    const payload = {
        secret: APPS_SCRIPT_SECRET,
        toEmail,
        toName,
        actionType,
        date,
        reason: reason || 'Sin motivo especificado',
        details: details || '',
    };

    console.log('[EmailService] Enviando email:', { url: APPS_SCRIPT_URL, toEmail, toName, actionType, date });

    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        redirect: 'follow',
    })
    .then((r) => r.text())
    .then((t) => console.log('[EmailService] Respuesta:', t))
    .catch((error) => {
        console.error('[EmailService] Error al enviar email:', error);
    });
}
