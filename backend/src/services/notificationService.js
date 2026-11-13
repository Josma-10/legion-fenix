const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const pool = require('../config/db');
const whatsappQrService = require('./whatsappQrService');

function normalizeVzlaPhone(rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('58') && digits.length >= 12) {
    return { e164: `+${digits}`, digits };
  }
  if (digits.startsWith('0') && digits.length === 11) {
    const clean = `58${digits.slice(1)}`;
    return { e164: `+${clean}`, digits: clean };
  }
  if (digits.length === 10 && digits.startsWith('4')) {
    const clean = `58${digits}`;
    return { e164: `+${clean}`, digits: clean };
  }
  return { e164: `+${digits}`, digits };
}

function getUniformImgForMatch(partido, posicion) {
  const pos = String(posicion || '').toLowerCase();
  const isKeeper = pos.includes('arquero') || pos.includes('portero');
  const kitTxt = String(partido?.kit_designado || '').toLowerCase();
  const isVisitor =
    partido?.es_local === false ||
    kitTxt.includes('visitante') ||
    kitTxt.includes('alternativo') ||
    kitTxt.includes('negro') ||
    kitTxt.includes('blanco');
  const side = isVisitor ? 'visitante' : 'local';
  const role = isKeeper ? 'portero' : 'jugador';
  return `/assets/uniforme-${side}-${role}-kit.png`;
}

function formatDatePartsEs(dateValue) {
  const d = dateValue ? new Date(dateValue) : new Date();
  const iso = Number.isNaN(d.getTime()) ? String(dateValue || '').slice(0, 10) : d.toISOString().slice(0, 10);
  const [yyyy = '2026', mm = '11', dd = '17'] = iso.split('-');
  return { iso, dd, mm, yyyy };
}

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      (process.env.SMTP_HOST || process.env.SMTP_SERVICE)
  );
}

function isWhatsAppConfigured() {
  const hasMeta = Boolean(process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  const hasTwilio = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM
  );
  const hasWebhook = Boolean(process.env.WHATSAPP_WEBHOOK_URL);
  const hasQr = whatsappQrService.isConnected() || whatsappQrService.hasSavedSession();
  return {
    configured: hasMeta || hasTwilio || hasWebhook || hasQr,
    provider: hasMeta
      ? 'meta_cloud'
      : hasTwilio
      ? 'twilio'
      : hasWebhook
      ? 'webhook'
      : hasQr
      ? 'whatsapp_qr'
      : null,
  };
}

async function sendEmail({ to, subject, text, html }) {
  if (!to) {
    return { ok: false, skipped: true, reason: 'EMAIL_MISSING', status: 'Sin_Correo' };
  }
  if (!isEmailConfigured()) {
    return {
      ok: false,
      skipped: true,
      reason: 'SMTP_NOT_CONFIGURED',
      status: 'Pendiente_Config_SMTP',
    };
  }

  try {
    const transportConfig = process.env.SMTP_HOST
      ? {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Number(process.env.SMTP_PORT) === 465 || process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        }
      : {
          service: process.env.SMTP_SERVICE || 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        };

    const transporter = nodemailer.createTransport(transportConfig);
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Legión Fénix FC" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || `<div style="font-family:sans-serif;line-height:1.5">${text.replace(/\n/g, '<br/>')}</div>`,
    });

    return {
      ok: true,
      status: 'Enviado',
      messageId: info.messageId,
      accepted: info.accepted,
    };
  } catch (err) {
    return {
      ok: false,
      status: 'Error_SMTP',
      error: err.message,
    };
  }
}

async function sendWhatsApp({ to, message }) {
  const phone = normalizeVzlaPhone(to);
  if (!phone) {
    return { ok: false, skipped: true, reason: 'PHONE_MISSING', status: 'Sin_Telefono' };
  }
  const waMeUrl = `https://wa.me/${phone.digits}?text=${encodeURIComponent(message)}`;
  const cfg = isWhatsAppConfigured();
  if (!cfg.configured) {
    return {
      ok: false,
      skipped: true,
      reason: 'WHATSAPP_NOT_CONFIGURED',
      status: 'Pendiente_Config_WhatsApp',
      toNormalized: phone.e164,
      waMeUrl,
    };
  }

  try {
    if (cfg.provider === 'meta_cloud') {
      const resp = await fetch(
        `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone.digits,
            type: 'text',
            text: { preview_url: false, body: message },
          }),
        }
      );
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        return {
          ok: false,
          status: 'Error_WhatsApp_Meta',
          error: json?.error?.message || `HTTP ${resp.status}`,
          toNormalized: phone.e164,
          waMeUrl,
        };
      }
      return {
        ok: true,
        provider: 'meta_cloud',
        status: 'Enviado',
        messageId: json?.messages?.[0]?.id || null,
        toNormalized: phone.e164,
      };
    }

    if (cfg.provider === 'twilio') {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_WHATSAPP_FROM.startsWith('whatsapp:')
        ? process.env.TWILIO_WHATSAPP_FROM
        : `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;
      const bodyParams = new URLSearchParams({
        From: from,
        To: `whatsapp:${phone.e164}`,
        Body: message,
      });
      const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        return {
          ok: false,
          status: 'Error_WhatsApp_Twilio',
          error: json?.message || `HTTP ${resp.status}`,
          toNormalized: phone.e164,
          waMeUrl,
        };
      }
      return {
        ok: true,
        provider: 'twilio',
        status: 'Enviado',
        messageId: json?.sid || null,
        toNormalized: phone.e164,
      };
    }

    if (cfg.provider === 'whatsapp_qr') {
      return await whatsappQrService.sendWhatsAppViaQr(phone.digits, message);
    }

    const resp = await fetch(process.env.WHATSAPP_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.WHATSAPP_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.WHATSAPP_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ to: phone.e164, digits: phone.digits, message }),
    });
    if (!resp.ok) {
      return {
        ok: false,
        status: 'Error_WhatsApp_Webhook',
        error: `HTTP ${resp.status}`,
        toNormalized: phone.e164,
        waMeUrl,
      };
    }
    return {
      ok: true,
      provider: 'webhook',
      status: 'Enviado',
      toNormalized: phone.e164,
    };
  } catch (err) {
    return {
      ok: false,
      status: 'Error_WhatsApp',
      error: err.message,
      toNormalized: phone.e164,
      waMeUrl,
    };
  }
}

async function dispatchNotificationChannels(notification, { email, telefono, subject, text, html }) {
  const [emailResult, waResult] = await Promise.all([
    sendEmail({ to: email, subject: subject || notification.titulo, text: text || notification.mensaje, html }),
    sendWhatsApp({ to: telefono, message: text || notification.mensaje }),
  ]);

  if (notification?.id_notificacion) {
    await pool.query(
      `UPDATE notificaciones
       SET canal_email_estado = $1,
           canal_whatsapp_estado = $2
       WHERE id_notificacion = $3`,
      [emailResult.status, waResult.status, notification.id_notificacion]
    );
  }

  return { emailResult, waResult };
}

function buildPaymentReminderText({ usuarioNombre, atletaNombre, concepto, descripcion, montoUsd, fechaVencimiento }) {
  const { dd, mm, yyyy } = formatDatePartsEs(fechaVencimiento);
  const conceptClean = String(concepto || 'Mensualidad').toLowerCase();
  const detail = descripcion ? ` (${descripcion})` : '';
  return `Hola ${usuarioNombre || 'Representante'}, te recordamos automáticamente desde Legión Fénix FC que debes pagar ${conceptClean === 'mensualidad' ? 'la mensualidad' : `el concepto de ${concepto}`}${detail} del atleta ${atletaNombre} en el equipo Legión Fénix FC por un monto de $${Number(montoUsd).toFixed(2)} USD antes de ${dd} del ${mm} de ${yyyy}. Ingresa a tu portal para presionar "Ya Pagué" y adjuntar tu comprobante.`;
}

async function syncAndDispatchUpcomingPaymentReminders({ idRepresentante = null } = {}) {
  const params = [];
  let repClause = '';
  if (idRepresentante) {
    params.push(Number(idRepresentante));
    repClause = `AND t.id_representante = $${params.length}`;
  }

  const { rows: dueTxs } = await pool.query(
    `SELECT
       t.*,
       j.nombre AS jugador_nombre,
       j.apellido AS jugador_apellido,
       u.id_usuario AS rep_id_usuario,
       u.nombre AS rep_nombre,
       u.email AS rep_email,
       u.telefono AS rep_telefono
     FROM transacciones_jugador t
     JOIN jugadores j ON j.id_jugador = t.id_jugador
     JOIN representantes r ON r.id_representante = t.id_representante
     JOIN usuarios u ON u.id_usuario = r.id_usuario
     WHERE t.estado_pago IN ('Pendiente', 'Vencido')
       AND COALESCE(t.comprobante_estado, 'Sin_Comprobante') NOT IN ('Aprobado', 'En_Revision')
       AND t.fecha_vencimiento <= CURRENT_DATE + INTERVAL '5 days'
       ${repClause}
     ORDER BY t.fecha_vencimiento ASC`,
    params
  );

  const created = [];
  for (const tx of dueTxs) {
    const existing = await pool.query(
      `SELECT * FROM notificaciones
       WHERE tipo = 'PAGO_PROXIMO'
         AND referencia_tipo = 'transaccion'
         AND referencia_id = $1
       LIMIT 1`,
      [tx.id_transaccion]
    );

    const { dd, mm, yyyy, iso } = formatDatePartsEs(tx.fecha_vencimiento);
    const atletaNombre = `${tx.jugador_nombre} ${tx.jugador_apellido}`;
    const text = buildPaymentReminderText({
      usuarioNombre: tx.rep_nombre,
      atletaNombre,
      concepto: tx.concepto,
      descripcion: tx.descripcion_detalle,
      montoUsd: tx.monto,
      fechaVencimiento: tx.fecha_vencimiento,
    });
    const titulo = `Recordatorio de Pago: ${tx.concepto} — Vence ${dd}/${mm}/${yyyy}`;

    if (existing.rows.length === 0) {
      const { rows: inserted } = await pool.query(
        `INSERT INTO notificaciones (
          id_usuario, id_representante, id_jugador, tipo, titulo, mensaje,
          referencia_tipo, referencia_id, fecha_limite, metadata_json
        )
        VALUES ($1, $2, $3, 'PAGO_PROXIMO', $4, $5, 'transaccion', $6, $7, $8::jsonb)
        RETURNING *`,
        [
          tx.rep_id_usuario,
          tx.id_representante,
          tx.id_jugador,
          titulo,
          text,
          tx.id_transaccion,
          iso,
          JSON.stringify({
            id_transaccion: tx.id_transaccion,
            concepto: tx.concepto,
            monto_usd: Number(tx.monto),
            fecha_vencimiento: iso,
            atleta: atletaNombre,
          }),
        ]
      );
      const notif = inserted[0];
      const channels = await dispatchNotificationChannels(notif, {
        email: tx.rep_email,
        telefono: tx.rep_telefono,
        subject: `⚽ Legión Fénix FC — ${titulo}`,
        text,
      });
      created.push({ notif, channels });
    }
  }

  return { checked: dueTxs.length, createdCount: created.length, created };
}

async function notifyMatchConvocation({ idPartido, idJugador, estadoConvocatoria = 'Convocado', observacion = '' }) {
  const { rows } = await pool.query(
    `SELECT
       p.*,
       c.nombre AS categoria_nombre,
       j.id_jugador,
       j.id_representante,
       j.nombre AS jugador_nombre,
       j.apellido AS jugador_apellido,
       j.posicion_habitual,
       j.dorsal,
       u.id_usuario AS rep_id_usuario,
       u.nombre AS rep_nombre,
       u.email AS rep_email,
       u.telefono AS rep_telefono
     FROM partidos_fixture p
     LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
     JOIN jugadores j ON j.id_jugador = $2
     JOIN representantes r ON r.id_representante = j.id_representante
     JOIN usuarios u ON u.id_usuario = r.id_usuario
     WHERE p.id_partido = $1
     LIMIT 1`,
    [Number(idPartido), Number(idJugador)]
  );
  const row = rows[0];
  if (!row) return null;

  const uniformImg = getUniformImgForMatch(row, row.posicion_habitual);
  const kitLabel =
    row.kit_designado ||
    (row.es_local === false
      ? 'Uniforme Visitante (Negro & Dorado)'
      : 'Uniforme Local (Rojo Fuego & Negro)');
  const fechaTexto = row.fecha_hora
    ? new Date(row.fecha_hora).toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Próxima jornada';

  const atleta = `${row.jugador_nombre} ${row.jugador_apellido}`;
  const titulo = `Convocatoria Oficial: ${atleta} vs ${row.rival}`;
  const text = `Hola ${row.rep_nombre}, ${atleta} (#${row.dorsal || 'S/N'}) fue convocado al partido de ${row.categoria_nombre || row.modalidad} frente a ${row.rival} el ${fechaTexto} en ${row.sede}.\nIndumentaria requerida: ${kitLabel}.\n${observacion ? `Nota técnica: ${observacion}\n` : ''}Por favor ingresa a tu Portal Legión Fénix para confirmar tu asistencia.`;

  const { rows: inserted } = await pool.query(
    `INSERT INTO notificaciones (
      id_usuario, id_representante, id_jugador, tipo, titulo, mensaje,
      referencia_tipo, referencia_id, fecha_limite, metadata_json
    )
    VALUES ($1, $2, $3, 'CONVOCATORIA', $4, $5, 'partido', $6, $7::date, $8::jsonb)
    RETURNING *`,
    [
      row.rep_id_usuario,
      row.id_representante,
      row.id_jugador,
      titulo,
      text,
      row.id_partido,
      row.fecha_hora ? new Date(row.fecha_hora).toISOString().slice(0, 10) : null,
      JSON.stringify({
        id_partido: row.id_partido,
        rival: row.rival,
        sede: row.sede,
        ubicacion_gps: row.gps_url || null,
        fecha_hora: row.fecha_hora,
        es_local: row.es_local,
        kit_designado: kitLabel,
        uniforme_img: uniformImg,
        estado_convocatoria: estadoConvocatoria,
        atleta,
      }),
    ]
  );

  const notif = inserted[0];
  const channels = await dispatchNotificationChannels(notif, {
    email: row.rep_email,
    telefono: row.rep_telefono,
    subject: `⚽ Legión Fénix FC — ${titulo}`,
    text,
  });

  return { notif, channels };
}

function getSmtpConfigSummary() {
  return {
    configured: isEmailConfigured(),
    service: process.env.SMTP_SERVICE || null,
    host: process.env.SMTP_HOST || null,
    port: process.env.SMTP_PORT || null,
    user: process.env.SMTP_USER || null,
    from: process.env.SMTP_FROM || null,
    hasPassword: Boolean(process.env.SMTP_PASS),
  };
}

function upsertEnvKeys(entries) {
  const envPath = path.join(__dirname, '..', '..', '.env');
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const lines = content.split(/\r?\n/);

  for (const [key, val] of Object.entries(entries)) {
    if (val === undefined || val === null) continue;
    const formatted = `${key}=${String(val).includes(' ') ? `"${val}"` : val}`;
    let replaced = false;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith(`${key}=`) || trimmed.startsWith(`# ${key}=`)) {
        lines[i] = formatted;
        replaced = true;
        break;
      }
    }
    if (!replaced) {
      lines.push(formatted);
    }
    process.env[key] = String(val);
  }

  fs.writeFileSync(envPath, `${lines.filter((l, idx, arr) => idx < arr.length - 1 || l !== '').join('\n')}\n`, 'utf8');
}

async function saveAndVerifySmtpConfig({
  service = 'gmail',
  host = '',
  port = '587',
  user,
  pass,
  from = '',
}) {
  const cleanUser = String(user || '').trim();
  const cleanPass = String(pass || '').replace(/\s+/g, '');
  if (!cleanUser || !cleanPass) {
    return { ok: false, error: 'El correo SMTP y la contraseña de aplicación son obligatorios.' };
  }

  const cleanHost = String(host || '').trim();
  const cleanService = cleanHost ? '' : String(service || 'gmail').trim();

  const transportConfig = cleanHost
    ? {
        host: cleanHost,
        port: Number(port || 587),
        secure: Number(port) === 465,
        auth: { user: cleanUser, pass: cleanPass },
      }
    : {
        service: cleanService || 'gmail',
        auth: { user: cleanUser, pass: cleanPass },
      };

  const transporter = nodemailer.createTransport(transportConfig);
  await transporter.verify();

  const updates = {
    SMTP_USER: cleanUser,
    SMTP_PASS: cleanPass,
    SMTP_FROM: from ? String(from).trim() : `Legión Fénix FC <${cleanUser}>`,
  };
  if (cleanHost) {
    updates.SMTP_HOST = cleanHost;
    updates.SMTP_PORT = String(port || 587);
    delete process.env.SMTP_SERVICE;
  } else {
    updates.SMTP_SERVICE = cleanService || 'gmail';
    delete process.env.SMTP_HOST;
  }

  upsertEnvKeys(updates);
  return { ok: true, smtp: getSmtpConfigSummary() };
}

async function dispatchPrueba2Reminder() {
  const { rows } = await pool.query(
    `SELECT
       u.id_usuario,
       u.nombre,
       u.email,
       u.telefono,
       r.id_representante,
       j.id_jugador,
       j.nombre AS jugador_nombre,
       j.apellido AS jugador_apellido,
       t.id_transaccion,
       t.monto,
       t.fecha_vencimiento
     FROM usuarios u
     LEFT JOIN representantes r ON r.id_usuario = u.id_usuario
     LEFT JOIN jugadores j ON j.id_representante = r.id_representante
     LEFT JOIN transacciones_jugador t
       ON t.id_representante = r.id_representante
       AND t.estado_pago IN ('Pendiente', 'Vencido')
     WHERE LOWER(u.email) = LOWER($1)
        OR LOWER(u.nombre) = LOWER($2)
     ORDER BY t.fecha_vencimiento ASC NULLS LAST
     LIMIT 1`,
    ['Joxma.francisco@gmail.com', 'prueba2']
  );

  const target = rows[0];
  const targetEmail = target?.email || 'Joxma.francisco@gmail.com';
  const targetPhone = '04121985211';
  const athleteName = target?.jugador_nombre
    ? `${target.jugador_nombre} ${target.jugador_apellido}`
    : 'Francisco Prueba';
  const amount = target?.monto ? Number(target.monto).toFixed(2) : '45.00';

  const subject = 'Legión Fénix FC — Recordatorio de Pago Mensualidad (Antes del 17/11/2026)';
  const scriptMensaje = `Hola ${target?.nombre || 'prueba2'}, te recordamos desde Legión Fénix FC que debes pagar la mensualidad del equipo Legión Fénix FC (atleta ${athleteName}, monto $${amount} USD) antes de 17 del 11 de 2026.`;

  let notifRow = null;
  if (target?.id_representante) {
    const existing = await pool.query(
      `SELECT * FROM notificaciones
       WHERE id_representante = $1 AND tipo = 'PAGO_PROXIMO'
       ORDER BY id_notificacion DESC LIMIT 1`,
      [target.id_representante]
    );
    if (existing.rows.length > 0) {
      const updated = await pool.query(
        `UPDATE notificaciones
         SET titulo = $1, mensaje = $2
         WHERE id_notificacion = $3
         RETURNING *`,
        [
          'Recordatorio de Pago: Mensualidad — Antes del 17/11/2026',
          scriptMensaje,
          existing.rows[0].id_notificacion,
        ]
      );
      notifRow = updated.rows[0];
    } else {
      const inserted = await pool.query(
        `INSERT INTO notificaciones (
          id_usuario, id_representante, id_jugador, tipo, titulo, mensaje,
          referencia_tipo, referencia_id, fecha_limite
        )
        VALUES ($1, $2, $3, 'PAGO_PROXIMO', $4, $5, 'transaccion', $6, '2026-11-17')
        RETURNING *`,
        [
          target.id_usuario,
          target.id_representante,
          target.id_jugador,
          'Recordatorio de Pago: Mensualidad — Antes del 17/11/2026',
          scriptMensaje,
          target.id_transaccion || null,
        ]
      );
      notifRow = inserted.rows[0];
    }
  }

  const channels = await dispatchNotificationChannels(notifRow || {}, {
    email: targetEmail,
    telefono: targetPhone,
    subject,
    text: scriptMensaje,
  });

  return {
    destinatario: target?.nombre || 'prueba2',
    email: targetEmail,
    telefono: targetPhone,
    mensaje: scriptMensaje,
    notificacionId: notifRow?.id_notificacion || null,
    ...channels,
  };
}

module.exports = {
  normalizeVzlaPhone,
  getUniformImgForMatch,
  isEmailConfigured,
  isWhatsAppConfigured,
  getSmtpConfigSummary,
  saveAndVerifySmtpConfig,
  sendEmail,
  sendWhatsApp,
  dispatchNotificationChannels,
  buildPaymentReminderText,
  syncAndDispatchUpcomingPaymentReminders,
  notifyMatchConvocation,
  dispatchPrueba2Reminder,
};
