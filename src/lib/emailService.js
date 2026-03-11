import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const ACTION_LABELS = {
    day: 'Día Administrativo Asignado',
    hours: 'Horas Administrativas Registradas',
    discount: 'Día de Descuento Registrado',
    special: 'Solicitud Especial Registrada',
    approval: 'Solicitud Aprobada',
    rejection: 'Solicitud Rechazada',
};

/**
 * Sends an assignment notification email via EmailJS.
 * Fire-and-forget: does not block the UI.
 * Graceful fallback: if env vars are missing, logs a warning and returns.
 *
 * @param {{ toEmail: string, toName: string, actionType: string, date: string, reason: string, details?: string }} params
 */
export function sendAssignmentEmail({ toEmail, toName, actionType, date, reason, details }) {
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        console.warn('[EmailService] Variables de entorno de EmailJS no configuradas. Email no enviado.');
        return;
    }

    if (!toEmail) {
        console.warn('[EmailService] No se proporcionó email del destinatario. Email no enviado.');
        return;
    }

    const subject = ACTION_LABELS[actionType] || 'Notificación Administrativa';

    const templateParams = {
        to_email: toEmail,
        to_name: toName,
        subject,
        action_type: subject,
        date,
        reason: reason || 'Sin motivo especificado',
        details: details || '',
    };

    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY).catch((error) => {
        console.error('[EmailService] Error al enviar email:', error);
    });
}

