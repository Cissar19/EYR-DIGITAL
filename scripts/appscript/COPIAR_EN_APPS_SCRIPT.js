var SECRET = 'jota40C1.#1710AMDGY';
var ADMIN_BCC = 'adm.ernestoyanez@eduhuechuraba.cl';
var ADMIN_EMAIL = 'adm.ernestoyanez@eduhuechuraba.cl';
var SHEET_ID = '1YjDgy4qCOvyf9KPwNaLLh2Pc099apjQAxhyAU0QRIKY';

/* ============================================================
   CONFIGURACION - DIAS ADMINISTRATIVOS
   ============================================================ */
var ACTION_CONFIG = {
  day:       { subject: 'Tu Dia Administrativo se esta Procesando',     title: 'Tu D\u00eda Administrativo<br>se est\u00e1 Procesando', subtitle: 'SOLICITUD EN PROCESO', statusText: 'Pendiente de aprobaci\u00f3n', accentColor: '#1B3A8C', bannerColor: '#F5D33A', bannerTextColor: '#1B3A8C', bannerMsg: 'Tu solicitud est\u00e1 siendo revisada. Te notificaremos cuando sea aprobada.' },
  approval:  { subject: 'Tu Dia Administrativo fue Aprobado',           title: 'Tu D\u00eda Administrativo<br>fue Aprobado',       subtitle: 'SOLICITUD APROBADA',    statusText: 'Aprobada \u2014 se descontar\u00e1 del saldo',     accentColor: '#16a34a', bannerColor: '#16a34a', bannerTextColor: '#ffffff', bannerMsg: 'Tu d\u00eda administrativo ha sido aprobado exitosamente.' },
  rejection: { subject: 'Tu Dia Administrativo fue Rechazado',          title: 'Tu D\u00eda Administrativo<br>fue Rechazado',      subtitle: 'SOLICITUD RECHAZADA',   statusText: 'Rechazada \u2014 no se descontar\u00e1 del saldo', accentColor: '#dc2626', bannerColor: '#dc2626', bannerTextColor: '#ffffff', bannerMsg: 'Tu solicitud de d\u00eda administrativo no fue aprobada.' },
  hours:     { subject: 'Horas Administrativas Registradas',            title: 'Horas Administrativas<br>Registradas',         subtitle: 'REGISTRO DE HORAS',     statusText: 'Registrado',                              accentColor: '#d97706', bannerColor: '#F5D33A', bannerTextColor: '#1B3A8C', bannerMsg: 'Se han registrado horas administrativas en tu cuenta.' },
  discount:  { subject: 'Dia de Descuento Registrado',                  title: 'D\u00eda de Descuento<br>Registrado',               subtitle: 'REGISTRO DE DESCUENTO', statusText: 'Registrado como descuento',                accentColor: '#dc2626', bannerColor: '#dc2626', bannerTextColor: '#ffffff', bannerMsg: 'Se ha registrado un d\u00eda de descuento en tu cuenta.' },
  special:   { subject: 'Permiso Especial Registrado',                  title: 'Permiso Especial<br>Registrado',               subtitle: 'PERMISO ESPECIAL',      statusText: 'Sin descuento de saldo',                  accentColor: '#7c3aed', bannerColor: '#F5D33A', bannerTextColor: '#1B3A8C', bannerMsg: 'Se ha registrado un permiso especial. No afecta tu saldo de d\u00edas.' },
};

/* ============================================================
   doPost UNIFICADO - detecta tipo por el payload
   ============================================================ */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.secret !== SECRET) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Unauthorized' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Si tiene "actionType" es de dias admin, si tiene "employeeName" es de licencias
    if (data.actionType) {
      return handleAdminDays(data);
    } else if (data.employeeName) {
      return handleMedicalLeave(data);
    } else {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Unknown request type' })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/* ============================================================
   HANDLER - DIAS ADMINISTRATIVOS
   ============================================================ */
function handleAdminDays(data) {
  var toEmail = data.toEmail || '';
  var toName  = data.toName || '';
  var action  = data.actionType || 'day';
  var date    = data.date || '';
  var reason  = data.reason || '';
  var details = data.details || '';
  var cfg = ACTION_CONFIG[action] || ACTION_CONFIG.day;

  var dateLabel = date;
  try {
    var parts = date.split('-');
    var months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    dateLabel = parseInt(parts[2]) + ' de ' + months[parseInt(parts[1]) - 1] + ' de ' + parts[0];
  } catch(ex) {}

  var htmlBody = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
    '<body style="margin:0;padding:0;background-color:#f2f4f8;font-family:Arial,sans-serif;">' +
    '<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f2f4f8;padding:36px 0;"><tr><td align="center">' +
    '<table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dde3f0;box-shadow:0 6px 32px rgba(27,58,140,0.10);">' +
    '<tr><td style="background-color:#F5D33A;height:7px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
    '<tr><td align="center" style="background-color:#1B3A8C;padding:30px 40px 26px 40px;">' +
    '<p style="margin:0 0 3px 0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:4px;text-transform:uppercase;">Centro Educacional</p>' +
    '<h1 style="margin:0 0 4px 0;color:#F5D33A;font-size:24px;font-weight:900;letter-spacing:0.5px;">Ernesto Y\u00e1\u00f1ez Rivera</h1>' +
    '<p style="margin:0;color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:3px;text-transform:uppercase;">Huechuraba \u00b7 Santiago</p>' +
    '</td></tr>' +
    '<tr><td align="center" style="padding:42px 48px 10px 48px;">' +
    '<p style="margin:0 0 12px 0;color:' + cfg.accentColor + ';font-size:13px;font-weight:700;letter-spacing:4px;text-transform:uppercase;">' + cfg.subtitle + '</p>' +
    '<h2 style="margin:0;color:#1B3A8C;font-size:36px;font-weight:900;line-height:1.1;">' + cfg.title + '</h2>' +
    '</td></tr>' +
    '<tr><td style="padding:32px 52px 12px 52px;text-align:center;">' +
    '<p style="margin:0;color:#222222;font-size:22px;line-height:1.6;">Funcionario: <strong style="color:#1B3A8C;font-size:26px;">' + toName + '</strong></p>' +
    '</td></tr>' +
    '<tr><td style="padding:10px 52px 38px 52px;">' +
    '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f5f7fd;border-radius:14px;border-left:5px solid ' + cfg.accentColor + ';">' +
    '<tr><td style="padding:24px 28px;">' +
    '<p style="margin:0 0 12px 0;color:#333333;font-size:17px;line-height:2.0;"><strong>Fecha:</strong> ' + dateLabel + '</p>' +
    '<p style="margin:0 0 12px 0;color:#333333;font-size:17px;line-height:2.0;"><strong>Motivo:</strong> ' + (reason || 'No especificado') + '</p>' +
    (details ? '<p style="margin:0 0 12px 0;color:#333333;font-size:17px;line-height:2.0;"><strong>Detalle:</strong> ' + details + '</p>' : '') +
    '<p style="margin:0;color:#333333;font-size:17px;line-height:2.0;"><strong>Estado:</strong> <span style="color:' + cfg.accentColor + ';font-weight:700;">' + cfg.statusText + '</span></p>' +
    '</td></tr></table></td></tr>' +
    '<tr><td style="background-color:' + cfg.bannerColor + ';padding:20px 48px;text-align:center;">' +
    '<p style="margin:0;color:' + cfg.bannerTextColor + ';font-size:18px;font-weight:800;line-height:1.6;">' + cfg.bannerMsg + '</p>' +
    '</td></tr>' +
    '<tr><td style="padding:0 48px;"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="border-top:1px solid #e5e8f0;font-size:0;">&nbsp;</td></tr></table></td></tr>' +
    '<tr><td style="padding:20px 40px 22px 40px;text-align:center;">' +
    '<p style="margin:0 0 3px 0;color:#1B3A8C;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Sistema D\u00edas Admin</p>' +
    '<p style="margin:0;color:#aaaaaa;font-size:12px;">Centro Educacional Ernesto Y\u00e1\u00f1ez Rivera \u00b7 Huechuraba</p>' +
    '</td></tr>' +
    '<tr><td style="background:linear-gradient(to right,#1B3A8C 33%,#F5D33A 33%,#F5D33A 66%,#8C1B1B 66%);height:7px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
    '</table></td></tr></table></body></html>';

  GmailApp.sendEmail(toEmail, cfg.subject + ' - ' + toName, '', {
    htmlBody: htmlBody,
    name: 'Sistema Dias Admin',
    bcc: ADMIN_BCC,
  });

  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
   HANDLER - LICENCIAS MEDICAS (mismo codigo que antes)
   ============================================================ */
function handleMedicalLeave(data) {
  var employeeName = data.employeeName || '';
  var leaveEndDate = data.leaveEndDate || '';
  var deadlineDate = data.deadlineDate || '';

  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Notificaciones');
  var timestamp = new Date();
  var status = 'Enviado';

  try {
    var htmlBody = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
      '<body style="margin:0;padding:0;background-color:#f2f4f8;font-family:Arial,sans-serif;">' +
      '<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f2f4f8;padding:36px 0;"><tr><td align="center">' +
      '<table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dde3f0;box-shadow:0 6px 32px rgba(27,58,140,0.10);">' +
      '<tr><td style="background-color:#F5D33A;height:7px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
      '<tr><td align="center" style="background-color:#1B3A8C;padding:30px 40px 26px 40px;">' +
      '<p style="margin:0 0 3px 0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:4px;text-transform:uppercase;">Centro Educacional</p>' +
      '<h1 style="margin:0 0 4px 0;color:#F5D33A;font-size:24px;font-weight:900;letter-spacing:0.5px;">Ernesto Y\u00e1\u00f1ez Rivera</h1>' +
      '<p style="margin:0;color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:3px;text-transform:uppercase;">Huechuraba \u00b7 Santiago</p>' +
      '</td></tr>' +
      '<tr><td align="center" style="padding:42px 48px 10px 48px;">' +
      '<p style="margin:0 0 12px 0;color:#dc2626;font-size:13px;font-weight:700;letter-spacing:4px;text-transform:uppercase;">ALERTA DE LICENCIA</p>' +
      '<h2 style="margin:0;color:#1B3A8C;font-size:36px;font-weight:900;line-height:1.1;">Licencia M\u00e9dica<br>por Vencer</h2>' +
      '</td></tr>' +
      '<tr><td style="padding:32px 52px 12px 52px;text-align:center;">' +
      '<p style="margin:0;color:#222222;font-size:22px;line-height:1.6;">Funcionario: <strong style="color:#1B3A8C;font-size:26px;">' + employeeName + '</strong></p>' +
      '</td></tr>' +
      '<tr><td style="padding:10px 52px 38px 52px;">' +
      '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f5f7fd;border-radius:14px;border-left:5px solid #dc2626;">' +
      '<tr><td style="padding:24px 28px;">' +
      '<p style="margin:0 0 12px 0;color:#333333;font-size:17px;line-height:2.0;">' +
      '<strong>Fin de licencia:</strong> ' + leaveEndDate + '</p>' +
      '<p style="margin:0;color:#333333;font-size:17px;line-height:2.0;">' +
      '<strong>Plazo l\u00edmite:</strong> <span style="color:#dc2626;font-weight:700;">' + deadlineDate + '</span></p>' +
      '</td></tr></table>' +
      '</td></tr>' +
      '<tr><td style="background-color:#dc2626;padding:20px 48px;text-align:center;">' +
      '<p style="margin:0;color:#ffffff;font-size:18px;font-weight:800;line-height:1.6;">Recuerde presentar la licencia antes del plazo l\u00edmite.</p>' +
      '</td></tr>' +
      '<tr><td style="padding:0 48px;"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="border-top:1px solid #e5e8f0;font-size:0;">&nbsp;</td></tr></table></td></tr>' +
      '<tr><td style="padding:20px 40px 22px 40px;text-align:center;">' +
      '<p style="margin:0 0 3px 0;color:#1B3A8C;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Sistema Licencias</p>' +
      '<p style="margin:0;color:#aaaaaa;font-size:12px;">Centro Educacional Ernesto Y\u00e1\u00f1ez Rivera \u00b7 Huechuraba</p>' +
      '</td></tr>' +
      '<tr><td style="background:linear-gradient(to right,#1B3A8C 33%,#F5D33A 33%,#F5D33A 66%,#8C1B1B 66%);height:7px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
      '</table></td></tr></table></body></html>';

    GmailApp.sendEmail(ADMIN_EMAIL, 'Alerta: Licencia por vencer - ' + employeeName, '', {
      htmlBody: htmlBody,
      name: 'Sistema Licencias EYR',
    });
  } catch (mailErr) {
    status = 'Error: ' + mailErr;
    Logger.log('Error enviando email: ' + mailErr);
  }

  if (sheet) {
    sheet.appendRow([timestamp, employeeName, leaveEndDate, deadlineDate, status]);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ success: true })
  ).setMimeType(ContentService.MimeType.JSON);
}
