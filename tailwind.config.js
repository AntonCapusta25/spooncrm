/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        notion: {
          bg: '#FFFFFF',
          sidebar: '#F7F6F3',
          border: '#EDEDEB',
          borderDark: '#D4D4D0',
          hover: '#EFEFED',
          text: '#37352F',
          muted: '#787774',
          subtle: '#9B9A97',
          // Pastel Tag Colors
          gray: '#E3E2E0',
          brown: '#EEE0DA',
          orange: '#FADEC9',
          yellow: '#FDECC8',
          green: '#DBEDDB',
          blue: '#D3E5EF',
          purple: '#E8DEEE',
          pink: '#F5E0E9',
          red: '#FFE2DD',
        },
        spoonful: {
          orange: '#FF5A1F',
          lightOrange: '#FFF1EB',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
