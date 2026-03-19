const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
const APPS_SCRIPT_SECRET = import.meta.env.VITE_APPS_SCRIPT_SECRET;

/**
 * Sends an assignment notification email via Google Apps Script.
 * Fire-and-forget: does not block the UI.
 *
 * @param {{ toEmail: string, toName: string, actionType: string, date: string, reason: string, details?: string }} params
 */
export function sendAssignmentEmail({ toEmail, toName, actionType, date, reason, details }) {
    if (!APPS_SCRIPT_URL || !APPS_SCRIPT_SECRET) {
        console.warn('[EmailService] VITE_APPS_SCRIPT_URL o VITE_APPS_SCRIPT_SECRET no configurados. Email no enviado.');
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

/**
 * Sends a convivencia reservation notification email via Google Apps Script.
 * Fire-and-forget: does not block the UI.
 */
/**
 * Sends a branded password reset email via Google Apps Script.
 * Returns true if Apps Script handled it, false otherwise (caller should fallback to Firebase).
 *
 * @param {{ toEmail: string, toName?: string }} params
 * @returns {Promise<boolean>}
 */
export async function sendPasswordResetNotification({ toEmail, toName }) {
    if (!APPS_SCRIPT_URL || !APPS_SCRIPT_SECRET) {
        return false;
    }

    if (!toEmail) {
        return false;
    }

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                secret: APPS_SCRIPT_SECRET,
                toEmail,
                toName: toName || '',
                actionType: 'passwordReset',
            }),
            redirect: 'follow',
        });

        const result = await response.json();
        if (result.success) {
            console.log('[EmailService] Email de reset enviado via Apps Script');
            return true;
        }

        console.warn('[EmailService] Apps Script respondió con error:', result.error);
        return false;
    } catch (error) {
        console.warn('[EmailService] Error al enviar reset via Apps Script:', error);
        return false;
    }
}

export function sendConvivenciaEmail({ convivenciaAction, teacherEmail, teacherName, convivenciaEmail, convivenciaName, date, blockLabel, blockStart, blockEnd, subject }) {
    if (!APPS_SCRIPT_URL || !APPS_SCRIPT_SECRET) {
        console.warn('[EmailService] VITE_APPS_SCRIPT_URL o VITE_APPS_SCRIPT_SECRET no configurados. Email no enviado.');
        return;
    }

    if (!teacherEmail) {
        console.warn('[EmailService] No se proporcionó email del profesor. Email no enviado.');
        return;
    }

    const payload = {
        secret: APPS_SCRIPT_SECRET,
        convivenciaAction,
        teacherEmail,
        teacherName,
        convivenciaEmail: convivenciaEmail || '',
        convivenciaName: convivenciaName || '',
        date,
        blockLabel,
        blockStart,
        blockEnd,
        subject: subject || '',
    };

    console.log('[EmailService] Enviando email convivencia:', { convivenciaAction, teacherEmail, teacherName, date, blockLabel });

    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        redirect: 'follow',
    })
    .then((r) => r.text())
    .then((t) => console.log('[EmailService] Respuesta convivencia:', t))
    .catch((error) => {
        console.error('[EmailService] Error al enviar email convivencia:', error);
    });
}
