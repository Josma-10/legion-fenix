import React, { useEffect, useState } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, CheckCircle2 } from 'lucide-react';

export default function InstallAppButton({ compact = false, fullWidth = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [installedNow, setInstalledNow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsInstalled(standalone);

    const ua = window.navigator.userAgent || '';
    setIsIos(/iphone|ipad|ipod/i.test(ua));

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstalledNow(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (isInstalled && !installedNow) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalledNow(true);
        setDeferredPrompt(null);
      }
      return;
    }
    setModalOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`${
          fullWidth ? 'w-full justify-center py-2.5' : compact ? 'px-2.5 py-1.5' : 'px-3 py-2'
        } rounded-lg bg-[#1c1619] hover:bg-vinotinto border border-amber-500/50 hover:border-rojo-fuego text-amber-300 hover:text-white text-xs font-bold inline-flex items-center gap-1.5 transition whitespace-nowrap`}
        title="Instalar App Oficial Legión Fénix FC en tu celular"
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span>{compact ? 'App' : 'Descargar App'}</span>
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
                  src="/assets/logo-legion-fenix.png"
                  alt="App Legión Fénix FC"
                  className="w-12 h-12 object-contain rounded-xl bg-black/50 p-1 border border-vinotinto"
                />
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rojo-fuego">
                    Aplicación Móvil Oficial
                  </span>
                  <h3 className="font-display text-2xl font-extrabold text-white leading-tight">
                    INSTALAR LEGIÓN FÉNIX APP
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
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                <span>
                  ¡App Legión Fénix FC instalada correctamente! Ya puedes abrirla directo desde el ícono en la pantalla de inicio de tu celular.
                </span>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-neutral-300">
                <p>
                  Lleva a <strong className="text-white">Legión Fénix FC</strong> en tu teléfono como una app nativa sin ocupar memoria: acceso rápido a convocatorias, asistencia, pagos BCV y carnet del atleta.
                </p>

                {deferredPrompt ? (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="btn-cta w-full py-3 text-sm"
                  >
                    <Download className="w-4 h-4" /> Instalar App en este Dispositivo
                  </button>
                ) : isIos ? (
                  <div className="bg-[#141418] border border-neutral-800 rounded-xl p-4 space-y-2.5">
                    <p className="font-bold text-amber-300 text-xs uppercase">
                      Instalación en iPhone / iPad (Safari):
                    </p>
                    <ol className="space-y-2 list-decimal list-inside text-neutral-200">
                      <li className="flex items-center gap-1.5">
                        <span>1. Pulsa el botón <strong>Compartir</strong></span>
                        <Share className="w-3.5 h-3.5 text-cyan-400 inline" />
                        <span>en la barra inferior de Safari.</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span>2. Desliza y selecciona <strong>&quot;Agregar a inicio&quot;</strong></span>
                        <PlusSquare className="w-3.5 h-3.5 text-amber-300 inline" />
                        <span>.</span>
                      </li>
                      <li>
                        3. Pulsa <strong>&quot;Agregar&quot;</strong> arriba a la derecha. ¡Listo!
                      </li>
                    </ol>
                  </div>
                ) : (
                  <div className="bg-[#141418] border border-neutral-800 rounded-xl p-4 space-y-2.5">
                    <p className="font-bold text-amber-300 text-xs uppercase">
                      Instalación en Android (Google Chrome / Edge):
                    </p>
                    <ol className="space-y-1.5 list-decimal list-inside text-neutral-200">
                      <li>Abre el menú de los <strong>3 puntos (⋮)</strong> arriba a la derecha en Chrome.</li>
                      <li>Toca <strong>&quot;Instalar aplicación&quot;</strong> o <strong>&quot;Agregar a la pantalla principal&quot;</strong>.</li>
                      <li>Confirma en <strong>&quot;Instalar&quot;</strong> y aparecerá el escudo de Legión Fénix en tus apps.</li>
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
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
