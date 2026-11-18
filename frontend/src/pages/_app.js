import { useEffect } from 'react';
import Head from 'next/head';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  }, []);

  return (
    <>
      <Head>
        <title>Legión Fénix FC | EST. 2020 • Rendirse Jamás</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#7A001E" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Legión Fénix" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" href="/assets/logo-legion-fenix.png" />
        <link rel="apple-touch-icon" href="/assets/logo-legion-fenix.png" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
