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
  passwordReset: { subject: 'Restablecer Contrase\u00f1a', title: 'Restablecer<br>Contrase\u00f1a', subtitle: 'SEGURIDAD DE CUENTA', accentColor: '#7c3aed', bannerColor: '#1B3A8C', bannerTextColor: '#ffffff', bannerMsg: 'Si no solicitaste este cambio, puedes ignorar este correo.' },
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

    // Si tiene "actionType" es de dias admin, "employeeName" es licencias, "convivenciaAction" es convivencia
    if (data.actionType) {
      return handleAdminDays(data);
    } else if (data.convivenciaAction) {
      return handleConvivencia(data);
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

  // Password reset tiene su propio flujo
  if (action === 'passwordReset') {
    return handlePasswordReset(toEmail, toName, cfg);
  }

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

/* ============================================================
   CONFIGURACION - CONVIVENCIA ESCOLAR
   ============================================================ */
var CONVIVENCIA_CONFIG = {
  reservation_created:  { subject: 'Nueva Reserva en Convivencia Escolar',  subtitle: 'NUEVA RESERVA',            title: 'Reserva de<br>Convivencia Escolar', statusText: 'Confirmada',                 accentColor: '#d97706', bannerColor: '#d97706', bannerTextColor: '#ffffff', bannerMsg: 'Se ha registrado una nueva reserva en Convivencia Escolar.' },
  reservation_cancelled: { subject: 'Reserva Cancelada - Convivencia',      subtitle: 'RESERVA CANCELADA',         title: 'Reserva<br>Cancelada',              statusText: 'Cancelada',                  accentColor: '#dc2626', bannerColor: '#dc2626', bannerTextColor: '#ffffff', bannerMsg: 'La reserva de Convivencia Escolar ha sido cancelada.' },
  reminder_1day:         { subject: 'Recordatorio: Reserva Ma\u00f1ana',     subtitle: 'RECORDATORIO',              title: 'Tu Reserva es<br>Ma\u00f1ana',      statusText: 'Confirmada \u2014 ma\u00f1ana',  accentColor: '#2563eb', bannerColor: '#2563eb', bannerTextColor: '#ffffff', bannerMsg: 'Recuerda que tienes una reserva en Convivencia Escolar ma\u00f1ana.' },
  reminder_1hour:        { subject: 'Tu Reserva Comienza Pronto',            subtitle: 'COMIENZA PRONTO',           title: 'Tu Reserva<br>Comienza Pronto',     statusText: 'En menos de 1 hora',         accentColor: '#7c3aed', bannerColor: '#7c3aed', bannerTextColor: '#ffffff', bannerMsg: '\u00a1Tu reserva en Convivencia Escolar comienza pronto!' },
};

/* ============================================================
   HANDLER - CONVIVENCIA ESCOLAR
   ============================================================ */
function handleConvivencia(data) {
  var action        = data.convivenciaAction || 'reservation_created';
  var teacherEmail  = data.teacherEmail || '';
  var teacherName   = data.teacherName || '';
  var convEmail     = data.convivenciaEmail || '';
  var date          = data.date || '';
  var blockLabel    = data.blockLabel || '';
  var blockStart    = data.blockStart || '';
  var blockEnd      = data.blockEnd || '';
  var subject       = data.subject || '';

  var cfg = CONVIVENCIA_CONFIG[action] || CONVIVENCIA_CONFIG.reservation_created;

  var dateLabel = date;
  try {
    var parts = date.split('-');
    var months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    dateLabel = parseInt(parts[2]) + ' de ' + months[parseInt(parts[1]) - 1] + ' de ' + parts[0];
  } catch(ex) {}

  var timeRange = blockStart && blockEnd ? blockStart + ' - ' + blockEnd : '';
  var htmlBody = buildConvivenciaHtml(cfg, teacherName, dateLabel, blockLabel, timeRange, subject);

  // Enviar al profesor
  if (teacherEmail) {
    try {
      GmailApp.sendEmail(teacherEmail, cfg.subject + ' - ' + teacherName, '', {
        htmlBody: htmlBody,
        name: 'Convivencia Escolar EYR',
      });
    } catch (err) {
      Logger.log('Error enviando email a profesor: ' + err);
    }
  }

  // Enviar al admin de convivencia
  if (convEmail) {
    try {
      GmailApp.sendEmail(convEmail, cfg.subject + ' - ' + teacherName, '', {
        htmlBody: htmlBody,
        name: 'Convivencia Escolar EYR',
      });
    } catch (err) {
      Logger.log('Error enviando email a convivencia admin: ' + err);
    }
  }

  logConvivenciaReservation(action, teacherName, teacherEmail, convEmail, date, blockLabel, blockStart, blockEnd, subject);

  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
   HTML BUILDER - CONVIVENCIA ESCOLAR
   ============================================================ */
function buildConvivenciaHtml(cfg, teacherName, dateLabel, blockLabel, timeRange, subject) {
  return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
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
    '<p style="margin:0;color:#222222;font-size:22px;line-height:1.6;">Profesor: <strong style="color:#1B3A8C;font-size:26px;">' + teacherName + '</strong></p>' +
    '</td></tr>' +
    '<tr><td style="padding:10px 52px 38px 52px;">' +
    '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f5f7fd;border-radius:14px;border-left:5px solid ' + cfg.accentColor + ';">' +
    '<tr><td style="padding:24px 28px;">' +
    '<p style="margin:0 0 12px 0;color:#333333;font-size:17px;line-height:2.0;"><strong>Fecha:</strong> ' + dateLabel + '</p>' +
    '<p style="margin:0 0 12px 0;color:#333333;font-size:17px;line-height:2.0;"><strong>Bloque:</strong> ' + blockLabel + (timeRange ? ' (' + timeRange + ')' : '') + '</p>' +
    (subject ? '<p style="margin:0 0 12px 0;color:#333333;font-size:17px;line-height:2.0;"><strong>Motivo:</strong> ' + subject + '</p>' : '') +
    '<p style="margin:0;color:#333333;font-size:17px;line-height:2.0;"><strong>Estado:</strong> <span style="color:' + cfg.accentColor + ';font-weight:700;">' + cfg.statusText + '</span></p>' +
    '</td></tr></table></td></tr>' +
    '<tr><td style="background-color:' + cfg.bannerColor + ';padding:20px 48px;text-align:center;">' +
    '<p style="margin:0;color:' + cfg.bannerTextColor + ';font-size:18px;font-weight:800;line-height:1.6;">' + cfg.bannerMsg + '</p>' +
    '</td></tr>' +
    '<tr><td style="padding:0 48px;"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="border-top:1px solid #e5e8f0;font-size:0;">&nbsp;</td></tr></table></td></tr>' +
    '<tr><td style="padding:20px 40px 22px 40px;text-align:center;">' +
    '<p style="margin:0 0 3px 0;color:#1B3A8C;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Convivencia Escolar</p>' +
    '<p style="margin:0;color:#aaaaaa;font-size:12px;">Centro Educacional Ernesto Y\u00e1\u00f1ez Rivera \u00b7 Huechuraba</p>' +
    '</td></tr>' +
    '<tr><td style="background:linear-gradient(to right,#1B3A8C 33%,#F5D33A 33%,#F5D33A 66%,#8C1B1B 66%);height:7px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
    '</table></td></tr></table></body></html>';
}

/* ============================================================
   LOG - CONVIVENCIA RESERVAS EN SHEET
   ============================================================ */
function logConvivenciaReservation(action, teacherName, teacherEmail, convEmail, date, blockLabel, blockStart, blockEnd, subject) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('ConvivenciaReservas');

    if (!sheet) {
      sheet = ss.insertSheet('ConvivenciaReservas');
      sheet.appendRow(['Timestamp', 'Action', 'TeacherName', 'TeacherEmail', 'ConvivenciaEmail', 'Date', 'BlockLabel', 'BlockStart', 'BlockEnd', 'Subject', 'Reminder1Day', 'Reminder1Hour', 'Status']);
    }

    var timestamp = new Date();

    if (action === 'reservation_created') {
      sheet.appendRow([timestamp, action, teacherName, teacherEmail, convEmail, date, blockLabel, blockStart, blockEnd, subject, 'pending', 'pending', 'active']);
    } else if (action === 'reservation_cancelled') {
      // Buscar fila existente y marcar como cancelled
      var data = sheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < data.length; i++) {
        if (data[i][2] === teacherName && data[i][5] === date && data[i][7] === blockStart && data[i][12] === 'active') {
          sheet.getRange(i + 1, 11).setValue('cancelled'); // Reminder1Day
          sheet.getRange(i + 1, 12).setValue('cancelled'); // Reminder1Hour
          sheet.getRange(i + 1, 13).setValue('cancelled'); // Status
          found = true;
          break;
        }
      }
      if (!found) {
        sheet.appendRow([timestamp, action, teacherName, teacherEmail, convEmail, date, blockLabel, blockStart, blockEnd, subject, 'cancelled', 'cancelled', 'cancelled']);
      }
    }
  } catch (err) {
    Logger.log('Error logging convivencia reservation: ' + err);
  }
}

/* ============================================================
   RECORDATORIOS - CONVIVENCIA (trigger cada 30 min)
   ============================================================ */
function checkConvivenciaReminders() {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('ConvivenciaReservas');
    if (!sheet) return;

    var data = sheet.getDataRange().getValues();
    var now = new Date();

    for (var i = 1; i < data.length; i++) {
      var status       = data[i][12]; // Status column
      if (status !== 'active') continue;

      var teacherName  = data[i][2];
      var teacherEmail = data[i][3];
      var convEmail    = data[i][4];
      var dateStr      = data[i][5];
      var blockLabel   = data[i][6];
      var blockStart   = data[i][7];
      var blockEnd     = data[i][8];
      var subject      = data[i][9];
      var reminder1Day = data[i][10];
      var reminder1Hr  = data[i][11];

      // Parsear fecha + hora de inicio del bloque
      var parts = dateStr.split('-');
      var timeParts = blockStart.split(':');
      var blockDateTime = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), parseInt(timeParts[0]), parseInt(timeParts[1]));

      var diffMs = blockDateTime.getTime() - now.getTime();
      var diffHrs = diffMs / (1000 * 60 * 60);

      // Recordatorio 1 dia antes (20-28 horas antes)
      if (reminder1Day === 'pending' && diffHrs >= 20 && diffHrs <= 28) {
        var cfg1d = CONVIVENCIA_CONFIG.reminder_1day;
        var dateLabel = formatDateLabel(dateStr);
        var timeRange = blockStart + ' - ' + blockEnd;
        var html = buildConvivenciaHtml(cfg1d, teacherName, dateLabel, blockLabel, timeRange, subject);

        if (teacherEmail) {
          try {
            GmailApp.sendEmail(teacherEmail, cfg1d.subject + ' - ' + teacherName, '', { htmlBody: html, name: 'Convivencia Escolar EYR' });
          } catch(e) { Logger.log('Reminder 1day teacher error: ' + e); }
        }
        if (convEmail) {
          try {
            GmailApp.sendEmail(convEmail, cfg1d.subject + ' - ' + teacherName, '', { htmlBody: html, name: 'Convivencia Escolar EYR' });
          } catch(e) { Logger.log('Reminder 1day conv error: ' + e); }
        }
        sheet.getRange(i + 1, 11).setValue('sent');
      }

      // Recordatorio 1 hora antes (30-90 minutos antes)
      if (reminder1Hr === 'pending' && diffHrs >= 0.5 && diffHrs <= 1.5) {
        var cfg1h = CONVIVENCIA_CONFIG.reminder_1hour;
        var dateLabel2 = formatDateLabel(dateStr);
        var timeRange2 = blockStart + ' - ' + blockEnd;
        var html2 = buildConvivenciaHtml(cfg1h, teacherName, dateLabel2, blockLabel, timeRange2, subject);

        if (teacherEmail) {
          try {
            GmailApp.sendEmail(teacherEmail, cfg1h.subject + ' - ' + teacherName, '', { htmlBody: html2, name: 'Convivencia Escolar EYR' });
          } catch(e) { Logger.log('Reminder 1hr teacher error: ' + e); }
        }
        if (convEmail) {
          try {
            GmailApp.sendEmail(convEmail, cfg1h.subject + ' - ' + teacherName, '', { htmlBody: html2, name: 'Convivencia Escolar EYR' });
          } catch(e) { Logger.log('Reminder 1hr conv error: ' + e); }
        }
        sheet.getRange(i + 1, 12).setValue('sent');
      }
    }
  } catch (err) {
    Logger.log('checkConvivenciaReminders error: ' + err);
  }
}

function formatDateLabel(dateStr) {
  try {
    var parts = dateStr.split('-');
    var months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return parseInt(parts[2]) + ' de ' + months[parseInt(parts[1]) - 1] + ' de ' + parts[0];
  } catch(ex) {
    return dateStr;
  }
}

/* ============================================================
   HANDLER - PASSWORD RESET
   Genera enlace de Firebase y envia email branded.
   Requiere: GCP project vinculado + Identity Toolkit API habilitada
   + scope "https://www.googleapis.com/auth/identitytoolkit"
   ============================================================ */
function handlePasswordReset(toEmail, toName, cfg) {
  var status = 'Enviado';

  try {
    var resetLink = generatePasswordResetLink_(toEmail);
    var htmlBody = buildPasswordResetEmail_(toName, resetLink, cfg);

    GmailApp.sendEmail(toEmail, cfg.subject + ' - EYR', '', {
      htmlBody: htmlBody,
      name: 'Sistema EYR',
      bcc: ADMIN_BCC,
    });
  } catch (err) {
    status = 'Error: ' + err;
    Logger.log('Error en password reset: ' + err);
  }

  // Log
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('NotifDiasAdmin');
    if (sheet) {
      sheet.appendRow([new Date(), toName, toEmail, 'Password Reset', '', '', status]);
    }
  } catch (sheetErr) {
    Logger.log('Error logging password reset: ' + sheetErr);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ success: status === 'Enviado' })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Genera un enlace de restablecimiento via Firebase Identity Toolkit API.
 */
function generatePasswordResetLink_(email) {
  var token = ScriptApp.getOAuthToken();
  var url = 'https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode';

  var response = UrlFetchApp.fetch(url, {
    method: 'POST',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + token },
    payload: JSON.stringify({
      requestType: 'PASSWORD_RESET',
      email: email,
      returnOobLink: true
    }),
    muteHttpExceptions: true
  });

  var result = JSON.parse(response.getContentText());
  if (result.oobLink) return result.oobLink;

  Logger.log('generatePasswordResetLink_ error: ' + response.getContentText());
  throw new Error('No se pudo generar el enlace de reset');
}

/**
 * HTML branded para email de password reset con boton.
 */
function buildPasswordResetEmail_(toName, resetLink, cfg) {
  var greeting = toName ? 'Hola, <strong style="color:#1B3A8C;font-size:26px;">' + toName + '</strong>' : 'Hola';

  return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
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
    '<p style="margin:0;color:#222222;font-size:22px;line-height:1.6;">' + greeting + '</p>' +
    '</td></tr>' +

    '<tr><td style="padding:10px 52px 38px 52px;">' +
    '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f5f7fd;border-radius:14px;border-left:5px solid ' + cfg.accentColor + ';">' +
    '<tr><td style="padding:24px 28px;">' +
    '<p style="margin:0 0 16px 0;color:#333333;font-size:17px;line-height:1.8;">Recibimos una solicitud para restablecer la contrase\u00f1a de tu cuenta en el Sistema de Gesti\u00f3n Administrativa.</p>' +
    '<p style="margin:0 0 24px 0;color:#333333;font-size:17px;line-height:1.8;">Haz clic en el siguiente bot\u00f3n para crear una nueva contrase\u00f1a:</p>' +
    '<table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">' +
    '<a href="' + resetLink + '" target="_blank" style="display:inline-block;background-color:#1B3A8C;color:#ffffff;font-size:18px;font-weight:800;text-decoration:none;padding:16px 48px;border-radius:12px;letter-spacing:0.5px;">Restablecer Contrase\u00f1a</a>' +
    '</td></tr></table>' +
    '<p style="margin:20px 0 0 0;color:#888888;font-size:13px;line-height:1.6;text-align:center;">Este enlace expira en 1 hora. Si no funciona el bot\u00f3n, copia y pega esta URL en tu navegador:</p>' +
    '<p style="margin:6px 0 0 0;color:#1B3A8C;font-size:12px;word-break:break-all;text-align:center;">' + resetLink + '</p>' +
    '</td></tr></table>' +
    '</td></tr>' +

    '<tr><td style="background-color:' + cfg.bannerColor + ';padding:20px 48px;text-align:center;">' +
    '<p style="margin:0;color:' + cfg.bannerTextColor + ';font-size:18px;font-weight:800;line-height:1.6;">' + cfg.bannerMsg + '</p>' +
    '</td></tr>' +

    '<tr><td style="padding:0 48px;"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="border-top:1px solid #e5e8f0;font-size:0;">&nbsp;</td></tr></table></td></tr>' +

    '<tr><td style="padding:20px 40px 22px 40px;text-align:center;">' +
    '<p style="margin:0 0 3px 0;color:#1B3A8C;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Sistema EYR</p>' +
    '<p style="margin:0;color:#aaaaaa;font-size:12px;">Centro Educacional Ernesto Y\u00e1\u00f1ez Rivera \u00b7 Huechuraba</p>' +
    '</td></tr>' +

    '<tr><td style="background:linear-gradient(to right,#1B3A8C 33%,#F5D33A 33%,#F5D33A 66%,#8C1B1B 66%);height:7px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
    '</table></td></tr></table></body></html>';
}
