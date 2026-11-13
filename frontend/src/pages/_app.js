import Head from 'next/head';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Legión Fénix FC | EST. 2020 • Rendirse Jamás</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/assets/logo-legion-fenix.png" />
        <link rel="apple-touch-icon" href="/assets/logo-legion-fenix.png" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
