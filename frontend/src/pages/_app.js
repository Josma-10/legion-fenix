import { useEffect } from 'react';
import Head from 'next/head';
import { FloatingMobileInstallBar } from '../components/InstallAppButton';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Captura global del evento de instalación nativa (Android / Chrome / Edge / Desktop)
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.__fenixInstallPrompt = e;
      window.dispatchEvent(new Event('fenix-pwa-ready'));
    };

    const onAppInstalled = () => {
      window.__fenixInstallPrompt = null;
      window.__fenixInstalled = true;
      window.dispatchEvent(new Event('fenix-pwa-installed'));
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    // Registro inmediato del Service Worker (sin depender de 'load' si ya cargó)
    if ('serviceWorker' in navigator) {
      const registerSw = () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/', updateViaCache: 'none' })
          .then((reg) => {
            if (reg.update) reg.update().catch(() => {});
          })
          .catch(() => {});
      };

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        registerSw();
      } else {
        window.addEventListener('load', registerSw, { once: true });
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Legión Fénix FC | EST. 2020 • Rendirse Jamás</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#7A001E" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Legión Fénix" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
      </Head>
      <Component {...pageProps} />
      <FloatingMobileInstallBar />
    </>
  );
}
