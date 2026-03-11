/**
 * Google Apps Script — Notificación de días administrativos al funcionario.
 *
 * Configuración:
 *   1. Crear un NUEVO proyecto en Apps Script (script.google.com).
 *   2. Pegar este archivo.
 *   3. Deploy → Web app → Execute as: Me, Who has access: Anyone.
 *   4. Copiar la URL del deploy a VITE_APPS_SCRIPT_ADMIN_DAYS_URL
 *   5. Usar el mismo secret que VITE_APPS_SCRIPT_SECRET
 */

var SHEET_ID = '1YjDgy4qCOvyf9KPwNaLLh2Pc099apjQAxhyAU0QRIKY';
var LOG_SHEET = 'NotifDiasAdmin';
var SECRET = 'CHANGE_ME'; // Mismo valor que VITE_APPS_SCRIPT_SECRET

var ACTION_CONFIG = {
  day:       { title: 'Día Administrativo Asignado',     color: '#1B3A8C', icon: '📋', statusText: 'Pendiente de aprobación' },
  approval:  { title: 'Solicitud Aprobada',              color: '#16a34a', icon: '✅', statusText: 'Aprobada — se descontará del saldo' },
  rejection: { title: 'Solicitud Rechazada',             color: '#dc2626', icon: '❌', statusText: 'Rechazada — no se descontará del saldo' },
  hours:     { title: 'Horas Administrativas Registradas', color: '#d97706', icon: '🕐', statusText: 'Registrado' },
  discount:  { title: 'Día de Descuento Registrado',     color: '#dc2626', icon: '⚠️', statusText: 'Registrado como descuento' },
  special:   { title: 'Permiso Especial Registrado',     color: '#7c3aed', icon: '📌', statusText: 'Sin descuento de saldo' },
};

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.secret !== SECRET) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Unauthorized' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var toEmail   = data.toEmail || '';
    var toName    = data.toName || '';
    var action    = data.actionType || 'day';
    var date      = data.date || '';
    var reason    = data.reason || '';
    var details   = data.details || '';

    var cfg = ACTION_CONFIG[action] || ACTION_CONFIG.day;

    // Format date nicely
    var dateLabel = date;
    try {
      var parts = date.split('-');
      var months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      dateLabel = parseInt(parts[2]) + ' de ' + months[parseInt(parts[1]) - 1] + ' de ' + parts[0];
    } catch(ex) {}

    var status = 'Enviado';

    try {
      var htmlBody = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
        '<body style="margin:0;padding:0;background-color:#f2f4f8;font-family:Arial,sans-serif;">' +
        '<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f2f4f8;padding:36px 0;"><tr><td align="center">' +
        '<table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dde3f0;box-shadow:0 6px 32px rgba(27,58,140,0.10);">' +

        // Barra top color
        '<tr><td style="background-color:' + cfg.color + ';height:7px;font-size:0;line-height:0;">&nbsp;</td></tr>' +

        // Header azul
        '<tr><td align="center" style="background-color:#1B3A8C;padding:30px 40px 26px 40px;">' +
        '<p style="margin:0 0 3px 0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:4px;text-transform:uppercase;">Centro Educacional</p>' +
        '<h1 style="margin:0 0 4px 0;color:#F5D33A;font-size:24px;font-weight:900;letter-spacing:0.5px;">Ernesto Y\u00e1\u00f1ez Rivera</h1>' +
        '<p style="margin:0;color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:3px;text-transform:uppercase;">Huechuraba \u00b7 Santiago</p>' +
        '</td></tr>' +

        // Icono + Título
        '<tr><td align="center" style="padding:42px 48px 10px 48px;">' +
        '<p style="margin:0 0 16px 0;font-size:48px;line-height:1;">' + cfg.icon + '</p>' +
        '<p style="margin:0 0 12px 0;color:' + cfg.color + ';font-size:13px;font-weight:700;letter-spacing:4px;text-transform:uppercase;">Notificaci\u00f3n</p>' +
        '<h2 style="margin:0;color:#1B3A8C;font-size:30px;font-weight:900;line-height:1.2;">' + cfg.title + '</h2>' +
        '</td></tr>' +

        // Saludo
        '<tr><td style="padding:28px 52px 8px 52px;text-align:center;">' +
        '<p style="margin:0;color:#555555;font-size:17px;line-height:1.6;">Estimado/a <strong style="color:#1B3A8C;">' + toName + '</strong>,</p>' +
        '</td></tr>' +

        // Caja detalle
        '<tr><td style="padding:16px 52px 38px 52px;">' +
        '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f5f7fd;border-radius:14px;border-left:5px solid ' + cfg.color + ';">' +
        '<tr><td style="padding:24px 28px;">' +
        '<p style="margin:0 0 14px 0;color:#333333;font-size:17px;line-height:2.0;">' +
        '<strong>Fecha:</strong> ' + dateLabel + '</p>' +
        '<p style="margin:0 0 14px 0;color:#333333;font-size:17px;line-height:2.0;">' +
        '<strong>Motivo:</strong> ' + (reason || 'No especificado') + '</p>' +
        (details ? '<p style="margin:0 0 14px 0;color:#333333;font-size:17px;line-height:2.0;"><strong>Detalle:</strong> ' + details + '</p>' : '') +
        '<p style="margin:0;color:#333333;font-size:17px;line-height:2.0;">' +
        '<strong>Estado:</strong> <span style="color:' + cfg.color + ';font-weight:700;">' + cfg.statusText + '</span></p>' +
        '</td></tr></table>' +
        '</td></tr>' +

        // Franja cierre
        '<tr><td style="background-color:' + cfg.color + ';padding:18px 48px;text-align:center;">' +
        '<p style="margin:0;color:#ffffff;font-size:14px;font-weight:600;line-height:1.6;">Este correo es informativo. No es necesario responder.</p>' +
        '</td></tr>' +

        // Footer
        '<tr><td style="padding:20px 40px 22px 40px;text-align:center;">' +
        '<p style="margin:0 0 3px 0;color:#1B3A8C;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Sistema EYR Digital</p>' +
        '<p style="margin:0;color:#aaaaaa;font-size:12px;">Centro Educacional Ernesto Y\u00e1\u00f1ez Rivera \u00b7 Huechuraba</p>' +
        '</td></tr>' +

        // Barra tricolor bottom
        '<tr><td style="background:linear-gradient(to right,#1B3A8C 33%,#F5D33A 33%,#F5D33A 66%,#8C1B1B 66%);height:7px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
        '</table></td></tr></table></body></html>';

      GmailApp.sendEmail(toEmail, cfg.title + ' - EYR Digital', '', {
        htmlBody: htmlBody,
        name: 'Sistema EYR Digital',
      });
    } catch (mailErr) {
      status = 'Error: ' + mailErr;
      Logger.log('Error enviando email: ' + mailErr);
    }

    // Log to sheet
    try {
      var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(LOG_SHEET);
      if (!sheet) {
        sheet = SpreadsheetApp.openById(SHEET_ID).insertSheet(LOG_SHEET);
        sheet.appendRow(['Fecha', 'Funcionario', 'Email', 'Acción', 'Fecha Día', 'Motivo', 'Estado']);
      }
      sheet.appendRow([new Date(), toName, toEmail, cfg.title, date, reason, status]);
    } catch (sheetErr) {
      Logger.log('Error logging to sheet: ' + sheetErr);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
