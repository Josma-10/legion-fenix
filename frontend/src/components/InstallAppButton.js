import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Download,
  X,
  Share,
  PlusSquare,
  CheckCircle2,
  ExternalLink,
  Zap,
} from 'lucide-react';

export default function InstallAppButton({ compact = false, fullWidth = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('android'); // 'android' | 'ios' | 'inapp' | 'desktop'
  const [modalOpen, setModalOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installedNow, setInstalledNow] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      Boolean(window.__fenixInstalled);
    setIsInstalled(standalone);

    const ua = window.navigator.userAgent || '';
    const isInApp = /FBAN|FBAV|Instagram|WhatsApp|Line|TikTok|Snapchat/i.test(ua);
    const isIos = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/i.test(ua);

    if (isInApp) {
      setPlatform('inapp');
    } else if (isIos) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    if (window.__fenixInstallPrompt) {
      setDeferredPrompt(window.__fenixInstallPrompt);
    }

    const syncPrompt = () => {
      if (window.__fenixInstallPrompt) {
        setDeferredPrompt(window.__fenixInstallPrompt);
      }
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setInstalledNow(true);
      setInstalling(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('fenix-pwa-ready', syncPrompt);
    window.addEventListener('fenix-pwa-installed', onInstalled);

    return () => {
      window.removeEventListener('fenix-pwa-ready', syncPrompt);
      window.removeEventListener('fenix-pwa-installed', onInstalled);
    };
  }, []);

  if (isInstalled && !installedNow) {
    return null;
  }

  const triggerNativeInstall = async () => {
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? window.__fenixInstallPrompt : null);
    if (!promptEvent) {
      setModalOpen(true);
      return;
    }

    setInstalling(true);
    // Seguro anti-bloqueo: si el navegador tarda más de 5s en responder, muestra guía rápida
    const safetyTimer = setTimeout(() => {
      setInstalling(false);
      setModalOpen(true);
    }, 5000);

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      clearTimeout(safetyTimer);
      if (choice?.outcome === 'accepted') {
        window.__fenixInstallPrompt = null;
        setDeferredPrompt(null);
        setInstalledNow(true);
        setInstalling(false);
        setModalOpen(true);
      } else {
        setInstalling(false);
      }
    } catch {
      clearTimeout(safetyTimer);
      setInstalling(false);
      setModalOpen(true);
    }
  };

  const copyAppLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // ignorar si el navegador restringe portapapeles
    }
  };

  const hasNativePrompt = Boolean(
    deferredPrompt || (typeof window !== 'undefined' && window.__fenixInstallPrompt)
  );

  return (
    <>
      <button
        type="button"
        disabled={installing}
        onClick={triggerNativeInstall}
        className={`${
          fullWidth ? 'w-full justify-center py-2.5' : compact ? 'px-2.5 py-1.5' : 'px-3 py-2'
        } rounded-lg bg-[#1c1619] hover:bg-vinotinto border border-amber-500/60 hover:border-rojo-fuego text-amber-300 hover:text-white text-xs font-bold inline-flex items-center gap-1.5 transition whitespace-nowrap disabled:opacity-60`}
        title="Instalar App Ligera Legión Fénix FC (Android, iPhone y PC)"
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span>
          {installing ? 'Instalando...' : compact ? 'App' : 'Descargar App'}
        </span>
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card-fenix max-w-md w-full p-6 border-vinotinto space-y-4 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src="/icons/icon-192.png"
                  alt="App Legión Fénix FC"
                  className="w-12 h-12 object-contain rounded-xl bg-black border border-vinotinto shrink-0"
                />
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rojo-fuego flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Ultra Ligera • Menos de 1 MB
                  </span>
                  <h3 className="font-display text-2xl font-extrabold text-white leading-tight">
                    APP LEGIÓN FÉNIX FC
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded bg-neutral-800 hover:bg-rojo-fuego text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {installedNow ? (
              <div className="bg-green-950/60 border border-green-600 rounded-xl p-4 text-xs text-green-200 flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                <div>
                  <p className="font-bold text-white text-sm">¡App instalada con éxito!</p>
                  <p className="mt-0.5">
                    Ya tienes el ícono de <strong>Legión Fénix FC</strong> en la pantalla de inicio de tu celular. Ábrela directo sin usar el navegador.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-neutral-300">
                <p>
                  Se instala directo en segundos sin llenar la memoria de tu teléfono. Compatible con{' '}
                  <strong className="text-white">Android, iPhone, iPad y PC</strong>.
                </p>

                {hasNativePrompt ? (
                  <button
                    type="button"
                    disabled={installing}
                    onClick={triggerNativeInstall}
                    className="btn-cta w-full py-3 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    {installing ? 'Instalando App...' : 'Instalar App Ahora (1 Toque)'}
                  </button>
                ) : platform === 'inapp' ? (
                  <div className="bg-amber-950/40 border border-amber-500/60 rounded-xl p-4 space-y-2.5">
                    <p className="font-bold text-amber-300 text-xs uppercase flex items-center gap-1.5">
                      <ExternalLink className="w-4 h-4" /> Estás dentro de WhatsApp / Instagram
                    </p>
                    <p className="text-neutral-200">
                      El navegador interno de WhatsApp/Instagram bloquea la descarga directa. Para instalarla en 2 segundos:
                    </p>
                    <ol className="space-y-1.5 list-decimal list-inside text-neutral-100">
                      <li>
                        Toca los <strong>3 puntos (⋮)</strong> o el ícono de brújula arriba/abajo.
                      </li>
                      <li>
                        Elige <strong>&quot;Abrir en Chrome&quot;</strong> (Android) o{' '}
                        <strong>&quot;Abrir en Safari&quot;</strong> (iPhone).
                      </li>
                      <li>Pulsa <strong>Descargar App</strong> y se instala al instante.</li>
                    </ol>
                    <button
                      type="button"
                      onClick={copyAppLink}
                      className="btn-vinotinto w-full text-xs py-2 mt-1"
                    >
                      {copiedUrl ? '✓ Enlace Copiado — Pégalo en Chrome/Safari' : 'Copiar Enlace de la App'}
                    </button>
                  </div>
                ) : platform === 'ios' ? (
                  <div className="bg-[#141418] border border-neutral-800 rounded-xl p-4 space-y-2.5">
                    <p className="font-bold text-amber-300 text-xs uppercase">
                      Instalación rápida en iPhone / iPad (3 segundos):
                    </p>
                    <ol className="space-y-2 text-neutral-200">
                      <li className="flex items-start gap-2">
                        <span className="font-extrabold text-rojo-fuego">1.</span>
                        <span>
                          En <strong>Safari</strong>, toca el botón <strong>Compartir</strong>{' '}
                          <Share className="w-3.5 h-3.5 text-cyan-400 inline mx-0.5" /> abajo en el centro.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-extrabold text-rojo-fuego">2.</span>
                        <span>
                          Toca <strong>&quot;Agregar a inicio&quot;</strong>{' '}
                          <PlusSquare className="w-3.5 h-3.5 text-amber-300 inline mx-0.5" />.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-extrabold text-rojo-fuego">3.</span>
                        <span>
                          Pulsa <strong>&quot;Agregar&quot;</strong> arriba a la derecha. ¡Listo!
                        </span>
                      </li>
                    </ol>
                  </div>
                ) : (
                  <div className="bg-[#141418] border border-neutral-800 rounded-xl p-4 space-y-2.5">
                    <p className="font-bold text-amber-300 text-xs uppercase">
                      Instalación instantánea en Android / Chrome:
                    </p>
                    <ol className="space-y-1.5 list-decimal list-inside text-neutral-200">
                      <li>
                        Toca los <strong>3 puntos (⋮)</strong> arriba a la derecha en Chrome.
                      </li>
                      <li>
                        Selecciona <strong>&quot;Agregar a la pantalla principal&quot;</strong> o{' '}
                        <strong>&quot;Instalar aplicación&quot;</strong>.
                      </li>
                      <li>
                        Confirma en <strong>&quot;Instalar / Agregar&quot;</strong> — tarda menos de 2 segundos y no ocupa espacio.
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function FloatingMobileInstallBar() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    const wasDismissed = sessionStorage.getItem('fenix_install_bar_dismissed') === '1';
    if (!standalone && !wasDismissed) {
      setDismissed(false);
    }
    const onInstalled = () => setDismissed(true);
    window.addEventListener('fenix-pwa-installed', onInstalled);
    return () => window.removeEventListener('fenix-pwa-installed', onInstalled);
  }, []);

  if (dismissed) return null;

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-[#141419]/95 backdrop-blur border border-vinotinto/80 rounded-2xl px-3.5 py-2.5 shadow-2xl flex items-center justify-between gap-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <img
          src="/icons/icon-192.png"
          alt="App Legión Fénix"
          className="w-9 h-9 rounded-lg border border-vinotinto/60 shrink-0"
        />
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-white truncate">App Legión Fénix FC</p>
          <p className="text-[10px] text-amber-300 truncate">Ligera (&lt; 1 MB) • Android y iPhone</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <InstallAppButton compact />
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem('fenix_install_bar_dismissed', '1');
            setDismissed(true);
          }}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
          aria-label="Ocultar aviso de app"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
