import React, { useCallback, useEffect, useState } from 'react';
import {
  QrCode,
  Mail,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  LogOut,
  Bell,
} from 'lucide-react';
import api from '../../utils/api';

export default function AdminNotificacionesQrSmtpModule({ onFeedback }) {
  const [statusData, setStatusData] = useState({
    whatsappQr: { status: 'disconnected', connected: false, qrDataUrl: null },
    whatsappConfig: { configured: false, provider: null },
    smtp: { configured: false, user: null },
  });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [connectingQr, setConnectingQr] = useState(false);

  const [smtpForm, setSmtpForm] = useState({
    service: 'gmail',
    host: '',
    port: '587',
    user: '',
    pass: '',
    from: '',
  });
  const [savingSmtp, setSavingSmtp] = useState(false);

  const [testForm, setTestForm] = useState({
    toEmail: 'Joxma.francisco@gmail.com',
    toPhone: '04121985211',
    subject: 'Legión Fénix FC — Recordatorio de Mensualidad',
    message:
      'Hola prueba2, te recordamos desde Legión Fénix FC que debes pagar la mensualidad del equipo Legión Fénix FC antes de 17 del 11 de 2026.',
  });
  const [sendingTest, setSendingTest] = useState(false);
  const [dispatchingPrueba2, setDispatchingPrueba2] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/admin/notifications/status');
      setStatusData(res.data);
      if (res.data?.smtp?.user) {
        setSmtpForm((prev) => (prev.user ? prev : { ...prev, user: res.data.smtp.user }));
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'No se pudo consultar el estado de mensajería.');
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    const qrStatus = statusData?.whatsappQr?.status;
    if (qrStatus !== 'qr' && qrStatus !== 'connecting') return undefined;
    const timer = setInterval(() => {
      fetchStatus();
    }, 2500);
    return () => clearInterval(timer);
  }, [statusData?.whatsappQr?.status, fetchStatus]);

  const handleConnectQr = async (forceNew = false) => {
    setConnectingQr(true);
    setErrorMsg('');
    try {
      const res = await api.post('/admin/notifications/whatsapp-qr/connect', { forceNew });
      setStatusData((prev) => ({ ...prev, whatsappQr: res.data.whatsappQr }));
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error iniciando conexión WhatsApp QR.');
    } finally {
      setConnectingQr(false);
    }
  };

  const handleDisconnectQr = async () => {
    setErrorMsg('');
    try {
      const res = await api.post('/admin/notifications/whatsapp-qr/disconnect');
      setStatusData((prev) => ({ ...prev, whatsappQr: res.data.whatsappQr }));
      if (onFeedback) onFeedback('Sesión de WhatsApp QR desvinculada.');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'No se pudo desvincular WhatsApp.');
    }
  };

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    setSavingSmtp(true);
    setErrorMsg('');
    try {
      const res = await api.post('/admin/notifications/smtp', smtpForm);
      setSmtpForm((prev) => ({ ...prev, pass: '' }));
      await fetchStatus();
      if (onFeedback) onFeedback(res.data.message || 'SMTP Gmail guardado y verificado.');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error verificando credenciales SMTP.');
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleDispatchPrueba2 = async () => {
    setDispatchingPrueba2(true);
    setErrorMsg('');
    try {
      const res = await api.post('/admin/notifications/dispatch-prueba2');
      setLastResult(res.data);
      if (onFeedback) {
        onFeedback('Script de recordatorio prueba2 ejecutado.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error ejecutando recordatorio prueba2.');
    } finally {
      setDispatchingPrueba2(false);
    }
  };

  const handleSendCustomTest = async (e) => {
    e.preventDefault();
    setSendingTest(true);
    setErrorMsg('');
    try {
      const res = await api.post('/admin/notifications/test', testForm);
      setLastResult(res.data);
      if (onFeedback) onFeedback('Prueba personalizada enviada.');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error enviando prueba.');
    } finally {
      setSendingTest(false);
    }
  };

  const waQr = statusData.whatsappQr || {};
  const smtp = statusData.smtp || {};

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="rounded-xl border border-red-500/50 bg-red-950/40 px-4 py-3 text-xs text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rojo-fuego shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CONECTOR WHATSAPP GRATUITO POR CÓDIGO QR */}
        <div className="card-fenix p-6 space-y-4 border-emerald-500/30">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" /> Conector Gratuito Sin API Paga
              </span>
              <h3 className="font-display text-xl font-extrabold text-white mt-0.5">
                WhatsApp del Club por Código QR
              </h3>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                waQr.connected
                  ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                  : waQr.status === 'qr'
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                  : 'bg-neutral-800 border border-neutral-700 text-neutral-300'
              }`}
            >
              {waQr.connected
                ? `Conectado (${waQr.connectedPhone || 'Activo'})`
                : waQr.status === 'qr'
                ? 'Esperando Escaneo QR'
                : waQr.status === 'connecting'
                ? 'Conectando...'
                : 'Desconectado'}
            </span>
          </div>

          <p className="text-xs text-texto-secundario leading-relaxed">
            Vincula el WhatsApp del club escaneando este QR desde tu teléfono (
            <strong className="text-white">WhatsApp → Dispositivos vinculados → Vincular dispositivo</strong>
            ). Todas las alertas automáticas (5 días antes del pago y convocatorias) saldrán desde ese número sin costo de Meta ni Twilio.
          </p>

          {waQr.connected ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white">
                    {waQr.connectedName || 'WhatsApp Club Conectado'}
                  </p>
                  <p className="text-xs text-emerald-300">{waQr.connectedPhone || 'Sesión activa'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDisconnectQr}
                className="px-3 py-2 rounded-lg bg-neutral-900 hover:bg-red-900/70 border border-neutral-700 text-xs font-bold text-white inline-flex items-center gap-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" /> Desvincular
              </button>
            </div>
          ) : waQr.qrDataUrl ? (
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 border border-neutral-800">
              <img
                src={waQr.qrDataUrl}
                alt="Código QR de WhatsApp Legión Fénix"
                className="w-56 h-56 rounded-xl border-4 border-white bg-white p-1"
              />
              <p className="text-[11px] text-amber-300 text-center">
                Escanea ahora con WhatsApp en tu teléfono. Este panel detectará la conexión automáticamente.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleConnectQr(true)}
                  disabled={connectingQr}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Nuevo QR
                </button>
                <button
                  type="button"
                  onClick={fetchStatus}
                  className="px-3 py-1.5 rounded-lg bg-vinotinto/60 hover:bg-vinotinto text-xs font-bold text-white"
                >
                  Verificar Estado
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-700 p-6 text-center space-y-3">
              <QrCode className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-xs text-texto-secundario">
                {loadingStatus
                  ? 'Verificando estado...'
                  : waQr.lastError || 'Presiona el botón para generar el Código QR de vinculación.'}
              </p>
              <button
                type="button"
                onClick={() => handleConnectQr(false)}
                disabled={connectingQr}
                className="btn-cta text-xs py-2.5 px-5 inline-flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                {connectingQr ? 'Generando QR...' : 'Generar Código QR de WhatsApp'}
              </button>
            </div>
          )}
        </div>

        {/* CONFIGURACIÓN GMAIL / SMTP */}
        <div className="card-fenix p-6 space-y-4 border-vinotinto/40">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rojo-fuego flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Despacho Automático de Correos
              </span>
              <h3 className="font-display text-xl font-extrabold text-white mt-0.5">
                Correo Institucional (Gmail SMTP)
              </h3>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                smtp.configured
                  ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
              }`}
            >
              {smtp.configured ? `Activo (${smtp.user})` : 'Pendiente Configurar'}
            </span>
          </div>

          <div className="rounded-lg bg-[#141418] border border-neutral-800 p-3 text-[11px] text-neutral-300 space-y-1">
            <p className="font-bold text-white">Cómo obtener tu App Password en Gmail (30 seg):</p>
            <p>
              1) Entra a <strong className="text-white">Cuenta Google → Seguridad</strong> y activa{' '}
              <em>Verificación en 2 pasos</em>.
            </p>
            <p>
              2) Busca <strong className="text-white">Contraseñas de aplicaciones</strong>, crea una llamada{' '}
              <em>Legion Fenix</em> y pega la clave de 16 caracteres aquí abajo.
            </p>
          </div>

          <form onSubmit={handleSaveSmtp} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-texto-secundario mb-1">
                  Correo Gmail / Remitente
                </label>
                <input
                  type="email"
                  className="input-fenix"
                  placeholder="legionfenixfc@gmail.com"
                  value={smtpForm.user}
                  onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-texto-secundario mb-1">
                  Contraseña de Aplicación (16 caracteres)
                </label>
                <input
                  type="password"
                  className="input-fenix"
                  placeholder="abcd efgh ijkl mnop"
                  value={smtpForm.pass}
                  onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-texto-secundario mb-1">
                  Nombre visible (opcional)
                </label>
                <input
                  type="text"
                  className="input-fenix"
                  placeholder="Legión Fénix FC"
                  value={smtpForm.from}
                  onChange={(e) => setSmtpForm({ ...smtpForm, from: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[11px] text-texto-secundario mb-1">
                  Servidor SMTP (vacío = Gmail)
                </label>
                <input
                  type="text"
                  className="input-fenix"
                  placeholder="smtp.gmail.com (opcional)"
                  value={smtpForm.host}
                  onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button type="submit" disabled={savingSmtp} className="btn-vinotinto text-xs py-2 px-4">
                {savingSmtp ? 'Verificando y Guardando...' : 'Verificar y Guardar Gmail SMTP'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* PANEL DE DISPARO REAL Y PRUEBA PRUEBA2 */}
      <div className="card-fenix p-6 space-y-4 border-rojo-fuego/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rojo-fuego flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" /> Script de Verificación Automática
            </span>
            <h3 className="font-display text-xl font-extrabold text-white">
              Probar Envío Real a prueba2 y Destinatarios
            </h3>
            <p className="text-xs text-texto-secundario">
              Una vez vinculados tu WhatsApp QR y/o Gmail SMTP arriba, dispara el mensaje oficial al instante.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDispatchPrueba2}
            disabled={dispatchingPrueba2}
            className="btn-cta text-xs py-2.5 px-5 inline-flex items-center gap-2 shrink-0"
          >
            <Send className="w-4 h-4" />
            {dispatchingPrueba2
              ? 'Enviando a prueba2...'
              : 'Enviar Recordatorio prueba2 (17/11/2026)'}
          </button>
        </div>

        <form onSubmit={handleSendCustomTest} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-neutral-800">
          <div className="md:col-span-3">
            <label className="block text-[11px] text-texto-secundario mb-1">Correo destino</label>
            <input
              type="email"
              className="input-fenix"
              value={testForm.toEmail}
              onChange={(e) => setTestForm({ ...testForm, toEmail: e.target.value })}
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-[11px] text-texto-secundario mb-1">WhatsApp destino</label>
            <input
              type="text"
              className="input-fenix"
              value={testForm.toPhone}
              onChange={(e) => setTestForm({ ...testForm, toPhone: e.target.value })}
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-[11px] text-texto-secundario mb-1">Mensaje de prueba</label>
            <input
              type="text"
              className="input-fenix"
              value={testForm.message}
              onChange={(e) => setTestForm({ ...testForm, message: e.target.value })}
              required
            />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={sendingTest}
              className="w-full py-2.5 px-3 rounded-lg bg-neutral-800 hover:bg-vinotinto text-xs font-bold text-white transition"
            >
              {sendingTest ? 'Enviando...' : 'Probar Envío'}
            </button>
          </div>
        </form>

        {lastResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg bg-[#141418] border border-neutral-800 p-3 text-xs space-y-1">
              <p className="font-bold text-white">Resultado Correo Electrónico</p>
              <p className={lastResult.emailResult?.ok ? 'text-emerald-400 font-bold' : 'text-amber-300'}>
                Estado: {lastResult.emailResult?.status || 'N/D'}
              </p>
              {lastResult.emailResult?.error && (
                <p className="text-red-300 text-[11px]">{lastResult.emailResult.error}</p>
              )}
              {lastResult.emailResult?.messageId && (
                <p className="text-neutral-400 text-[11px]">ID: {lastResult.emailResult.messageId}</p>
              )}
            </div>
            <div className="rounded-lg bg-[#141418] border border-neutral-800 p-3 text-xs space-y-1">
              <p className="font-bold text-white">Resultado WhatsApp</p>
              <p className={lastResult.waResult?.ok ? 'text-emerald-400 font-bold' : 'text-amber-300'}>
                Estado: {lastResult.waResult?.status || 'N/D'}
              </p>
              {lastResult.waResult?.error && (
                <p className="text-red-300 text-[11px]">{lastResult.waResult.error}</p>
              )}
              {lastResult.waResult?.waMeUrl && !lastResult.waResult?.ok && (
                <a
                  href={lastResult.waResult.waMeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[11px] text-emerald-400 underline"
                >
                  Abrir enlace manual wa.me →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
