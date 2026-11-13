/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vinotinto: '#7A001E',
        'vinotinto-dark': '#520013',
        'negro-fondo': '#0B0B0E',
        'gris-tarjeta': '#16161B',
        'rojo-fuego': '#E11D2E',
        'dorado-fenix': '#D4AF37',
        'plata-fenix': '#D1D5DB',
        'texto-secundario': '#A3A3AD',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Barlow Condensed', 'Montserrat', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        fenix: '0 10px 34px -10px rgba(225, 29, 46, 0.48)',
        fuego: '0 8px 24px -6px rgba(225, 29, 46, 0.55)',
        dorado: '0 8px 24px -6px rgba(212, 175, 55, 0.35)',
      },
    },
  },
  plugins: [],
};
