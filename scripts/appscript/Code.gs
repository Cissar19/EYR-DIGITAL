/**
 * Google Apps Script — Notificación de licencias médicas vencidas.
 *
 * Configuración:
 *   1. Abrir el Google Sheet (ID: 1YjDgy4qCOvyf9KPwNaLLh2Pc099apjQAxhyAU0QRIKY)
 *      → Extensions → Apps Script → pegar este archivo.
 *   2. Crear la hoja "Notificaciones" con encabezados:
 *      Fecha Envío | Funcionario | Fin Licencia | Plazo Vencido | Estado
 *   3. Deploy → Web app → Execute as: Me, Who has access: Anyone.
 *   4. Copiar la URL del deploy y el secret a las env vars de la app.
 */

var SHEET_ID = '1YjDgy4qCOvyf9KPwNaLLh2Pc099apjQAxhyAU0QRIKY';
var SHEET_NAME = 'Notificaciones';
var ADMIN_EMAIL = 'adm.ernestoyanez@eduhuechuraba.cl';
var SECRET = 'CHANGE_ME'; // Reemplazar con un valor seguro y copiarlo a VITE_APPS_SCRIPT_SECRET

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.secret !== SECRET) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Unauthorized' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var employeeName = data.employeeName || '';
    var leaveEndDate = data.leaveEndDate || '';
    var deadlineDate = data.deadlineDate || '';

    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    var timestamp = new Date();
    var status = 'Enviado';

    try {
      var htmlBody = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
        '<body style="margin:0;padding:0;background-color:#f2f4f8;font-family:Arial,sans-serif;">' +
        '<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f2f4f8;padding:36px 0;"><tr><td align="center">' +
        '<table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dde3f0;box-shadow:0 6px 32px rgba(27,58,140,0.10);">' +
        // Barra top amarilla
        '<tr><td style="background-color:#F5D33A;height:7px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
        // Header azul
        '<tr><td align="center" style="background-color:#1B3A8C;padding:30px 40px 26px 40px;">' +
        '<p style="margin:0 0 3px 0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:4px;text-transform:uppercase;">Centro Educacional</p>' +
        '<h1 style="margin:0 0 4px 0;color:#F5D33A;font-size:24px;font-weight:900;letter-spacing:0.5px;">Ernesto Y\u00e1\u00f1ez Rivera</h1>' +
        '<p style="margin:0;color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:3px;text-transform:uppercase;">Huechuraba \u00b7 Santiago</p>' +
        '</td></tr>' +
        // Título
        '<tr><td align="center" style="padding:42px 48px 10px 48px;">' +
        '<p style="margin:0 0 12px 0;color:#1B3A8C;font-size:13px;font-weight:700;letter-spacing:4px;text-transform:uppercase;">Notificaci\u00f3n Administrativa</p>' +
        '<h2 style="margin:0;color:#1B3A8C;font-size:36px;font-weight:900;line-height:1.1;">Plazo de Licencia<br>M\u00e9dica Vencido</h2>' +
        '</td></tr>' +
        // Mensaje
        '<tr><td style="padding:32px 52px 12px 52px;text-align:center;">' +
        '<p style="margin:0;color:#222222;font-size:22px;line-height:1.6;">Funcionario: <strong style="color:#1B3A8C;font-size:26px;">' + employeeName + '</strong></p>' +
        '</td></tr>' +
        // Caja detalle
        '<tr><td style="padding:10px 52px 38px 52px;">' +
        '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f5f7fd;border-radius:14px;border-left:5px solid #1B3A8C;">' +
        '<tr><td style="padding:24px 28px;">' +
        '<p style="margin:0 0 12px 0;color:#333333;font-size:17px;line-height:2.0;">' +
        '<strong>Fin de licencia:</strong> ' + leaveEndDate + '</p>' +
        '<p style="margin:0 0 12px 0;color:#333333;font-size:17px;line-height:2.0;">' +
        '<strong>Plazo vencido:</strong> ' + deadlineDate + '</p>' +
        '<p style="margin:0;color:#333333;font-size:17px;line-height:2.0;">' +
        'El plazo de 3 d\u00edas h\u00e1biles para presentar nueva licencia se ha cumplido. Por favor revisar la situaci\u00f3n del funcionario.</p>' +
        '</td></tr></table>' +
        '</td></tr>' +
        // Franja amarilla cierre
        '<tr><td style="background-color:#F5D33A;padding:20px 48px;text-align:center;">' +
        '<p style="margin:0;color:#1B3A8C;font-size:18px;font-weight:800;line-height:1.6;">Acci\u00f3n requerida: verificar estado del funcionario</p>' +
        '</td></tr>' +
        // Separador
        '<tr><td style="padding:0 48px;"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="border-top:1px solid #e5e8f0;font-size:0;">&nbsp;</td></tr></table></td></tr>' +
        // Footer
        '<tr><td style="padding:20px 40px 22px 40px;text-align:center;">' +
        '<p style="margin:0 0 3px 0;color:#1B3A8C;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Sistema D\u00edas Admin</p>' +
        '<p style="margin:0;color:#aaaaaa;font-size:12px;">Centro Educacional Ernesto Y\u00e1\u00f1ez Rivera \u00b7 Huechuraba</p>' +
        '</td></tr>' +
        // Barra tricolor bottom
        '<tr><td style="background:linear-gradient(to right,#1B3A8C 33%,#F5D33A 33%,#F5D33A 66%,#8C1B1B 66%);height:7px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
        '</table></td></tr></table></body></html>';

      GmailApp.sendEmail(ADMIN_EMAIL, 'Plazo de Licencia M\u00e9dica Vencido - ' + employeeName, '', {
        htmlBody: htmlBody,
        name: 'Sistema D\u00edas Admin',
      });
    } catch (mailErr) {
      status = 'Error';
      Logger.log('Error enviando email: ' + mailErr);
    }

    sheet.appendRow([timestamp, employeeName, leaveEndDate, deadlineDate, status]);

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
