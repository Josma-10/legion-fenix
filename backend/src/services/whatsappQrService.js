const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const pino = require('pino');

const AUTH_DIR = path.join(__dirname, '..', '..', '.wa_auth');

let baileysModulePromise = null;
function loadBaileys() {
  if (!baileysModulePromise) {
    baileysModulePromise = import('@whiskeysockets/baileys');
  }
  return baileysModulePromise;
}

const state = {
  status: 'disconnected', // 'disconnected' | 'connecting' | 'qr' | 'connected' | 'error'
  qrString: null,
  qrDataUrl: null,
  connectedPhone: null,
  connectedName: null,
  lastError: null,
  updatedAt: new Date().toISOString(),
};

let sock = null;
let initPromise = null;
let manualStop = false;
let reconnectTimer = null;

function updateState(patch) {
  Object.assign(state, patch, { updatedAt: new Date().toISOString() });
}

function hasSavedSession() {
  return fs.existsSync(path.join(AUTH_DIR, 'creds.json'));
}

function clearSavedSession() {
  try {
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn('⚠️ No se pudo limpiar .wa_auth:', err.message);
  }
}

function normalizeDigits(rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('58') && digits.length >= 12) return digits;
  if (digits.startsWith('0') && digits.length === 11) return `58${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith('4')) return `58${digits}`;
  return digits;
}

function extractPhoneFromJid(jid) {
  if (!jid) return null;
  const raw = String(jid).split('@')[0].split(':')[0];
  return raw ? `+${raw}` : null;
}

async function createSocket() {
  const baileys = await loadBaileys();
  const makeWASocket = baileys.default || baileys.makeWASocket;
  const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = baileys;

  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  let version;
  try {
    const latest = await fetchLatestBaileysVersion();
    version = latest?.version;
  } catch {
    version = undefined;
  }

  const logger = pino({ level: 'silent' });
  const browser =
    typeof Browsers?.ubuntu === 'function'
      ? Browsers.ubuntu('Legion Fenix FC')
      : ['Legion Fenix FC', 'Chrome', '128.0.0'];

  const socket = makeWASocket({
    ...(version ? { version } : {}),
    auth: authState,
    logger,
    browser,
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    connectTimeoutMs: 45000,
    defaultQueryTimeoutMs: 30000,
  });

  sock = socket;
  manualStop = false;

  socket.ev.on('creds.update', saveCreds);

  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        const dataUrl = await QRCode.toDataURL(qr, {
          width: 320,
          margin: 2,
          color: { dark: '#111111', light: '#FFFFFF' },
        });
        updateState({
          status: 'qr',
          qrString: qr,
          qrDataUrl: dataUrl,
          lastError: null,
        });
      } catch (err) {
        updateState({
          status: 'error',
          lastError: `Error generando imagen QR: ${err.message}`,
        });
      }
    }

    if (connection === 'open') {
      const phone = extractPhoneFromJid(socket.user?.id);
      updateState({
        status: 'connected',
        qrString: null,
        qrDataUrl: null,
        connectedPhone: phone,
        connectedName: socket.user?.name || 'WhatsApp Club Legión Fénix',
        lastError: null,
      });
      console.log(`📱 WhatsApp QR conectado correctamente (${phone || 'Sesión activa'})`);
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const errMsg = lastDisconnect?.error?.message || '';
      const loggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;

      if (sock === socket) {
        sock = null;
      }

      if (manualStop) {
        updateState({
          status: 'disconnected',
          qrString: null,
          qrDataUrl: null,
          connectedPhone: null,
          connectedName: null,
          lastError: null,
        });
        return;
      }

      if (loggedOut) {
        clearSavedSession();
        updateState({
          status: 'disconnected',
          qrString: null,
          qrDataUrl: null,
          connectedPhone: null,
          connectedName: null,
          lastError: 'Sesión desvinculada desde el teléfono. Solicita un nuevo código QR.',
        });
        return;
      }

      // En Baileys código 515 (stream restart tras escanear QR) o cortes temporales reconectan automáticamente
      updateState({
        status: 'connecting',
        lastError: errMsg ? `Reconectando WhatsApp (${errMsg})...` : null,
      });

      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        initWhatsAppQr({ forceNew: false }).catch((err) => {
          updateState({ status: 'error', lastError: err.message });
        });
      }, 1500);
      if (typeof reconnectTimer.unref === 'function') reconnectTimer.unref();
    }
  });

  return socket;
}

async function initWhatsAppQr({ forceNew = false } = {}) {
  if (forceNew) {
    await disconnectWhatsAppQr({ clearSession: true });
  }

  if (sock && (state.status === 'connected' || state.status === 'qr')) {
    return getWhatsAppQrStatus();
  }

  if (initPromise) {
    await initPromise;
    return getWhatsAppQrStatus();
  }

  updateState({ status: 'connecting', lastError: null });
  initPromise = createSocket()
    .catch((err) => {
      updateState({ status: 'error', lastError: err.message });
      throw err;
    })
    .finally(() => {
      initPromise = null;
    });

  await initPromise;

  // Esperar brevemente hasta 4.5s para entregar el primer QR o conexión inmediata
  const deadline = Date.now() + 4500;
  while (Date.now() < deadline && state.status === 'connecting') {
    await new Promise((r) => setTimeout(r, 250));
  }

  return getWhatsAppQrStatus();
}

async function autoResumeIfSessionExists() {
  if (!hasSavedSession()) return false;
  try {
    await initWhatsAppQr({ forceNew: false });
    return true;
  } catch (err) {
    console.warn('⚠️ No se pudo reanudar sesión previa de WhatsApp QR:', err.message);
    return false;
  }
}

async function disconnectWhatsAppQr({ clearSession = true } = {}) {
  manualStop = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  const activeSock = sock;
  sock = null;
  if (activeSock) {
    try {
      if (clearSession) {
        await activeSock.logout().catch(() => {});
      }
      activeSock.end(undefined);
    } catch {
      // ignore close errors
    }
  }
  if (clearSession) {
    clearSavedSession();
  }
  updateState({
    status: 'disconnected',
    qrString: null,
    qrDataUrl: null,
    connectedPhone: null,
    connectedName: null,
    lastError: null,
  });
  return getWhatsAppQrStatus();
}

function getWhatsAppQrStatus() {
  return {
    status: state.status,
    connected: state.status === 'connected',
    qrDataUrl: state.qrDataUrl,
    connectedPhone: state.connectedPhone,
    connectedName: state.connectedName,
    hasSavedSession: hasSavedSession(),
    lastError: state.lastError,
    updatedAt: state.updatedAt,
  };
}

function isConnected() {
  return Boolean(sock && state.status === 'connected');
}

async function sendWhatsAppViaQr(toPhone, message) {
  const digits = normalizeDigits(toPhone);
  if (!digits) {
    return { ok: false, skipped: true, reason: 'PHONE_MISSING', status: 'Sin_Telefono' };
  }

  if (!isConnected() && hasSavedSession()) {
    await initWhatsAppQr({ forceNew: false }).catch(() => {});
    const waitUntil = Date.now() + 8000;
    while (!isConnected() && Date.now() < waitUntil) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  if (!isConnected()) {
    return {
      ok: false,
      skipped: true,
      reason: 'WHATSAPP_QR_NOT_CONNECTED',
      status: 'Pendiente_QR_WhatsApp',
      toNormalized: `+${digits}`,
      waMeUrl: `https://wa.me/${digits}?text=${encodeURIComponent(message)}`,
    };
  }

  try {
    let targetJid = `${digits}@s.whatsapp.net`;
    try {
      const check = await sock.onWhatsApp(digits);
      if (Array.isArray(check) && check[0]?.exists && check[0]?.jid) {
        targetJid = check[0].jid;
      }
    } catch {
      // fallback a targetJid estándar
    }

    const sent = await sock.sendMessage(targetJid, { text: message });
    return {
      ok: true,
      provider: 'whatsapp_qr',
      status: 'Enviado',
      messageId: sent?.key?.id || null,
      to: targetJid,
      toNormalized: `+${digits}`,
    };
  } catch (err) {
    return {
      ok: false,
      provider: 'whatsapp_qr',
      status: 'Error_WhatsApp_QR',
      error: err.message,
      toNormalized: `+${digits}`,
      waMeUrl: `https://wa.me/${digits}?text=${encodeURIComponent(message)}`,
    };
  }
}

module.exports = {
  initWhatsAppQr,
  autoResumeIfSessionExists,
  disconnectWhatsAppQr,
  getWhatsAppQrStatus,
  isConnected,
  hasSavedSession,
  sendWhatsAppViaQr,
};
