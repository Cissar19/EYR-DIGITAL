const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
const APPS_SCRIPT_SECRET = import.meta.env.VITE_APPS_SCRIPT_SECRET;

/**
 * Sends a medical leave expiry notification via Google Apps Script.
 * Fire-and-forget: does not block the UI.
 *
 * @param {{ employeeName: string, leaveEndDate: string, deadlineDate: string }} params
 */
export function sendExpiryNotification({ employeeName, leaveEndDate, deadlineDate }) {
    if (!APPS_SCRIPT_URL || !APPS_SCRIPT_SECRET) {
        console.warn('[NotificationService] VITE_APPS_SCRIPT_URL o VITE_APPS_SCRIPT_SECRET no configurados. Notificación no enviada.');
        return;
    }

    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ employeeName, leaveEndDate, deadlineDate, secret: APPS_SCRIPT_SECRET }),
        redirect: 'follow',
    }).catch((error) => {
        console.error('[NotificationService] Error al enviar notificación:', error);
    });
}
