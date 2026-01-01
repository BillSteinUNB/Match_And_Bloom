/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Match & Bloom - Botanical Zen Palette
        'petal': {
          DEFAULT: '#FFB7C5',
          light: '#FFD4DE',
          dark: '#E8A0AE',
        },
        'leaf': {
          DEFAULT: '#A0E8AF',
          light: '#C4F5CE',
          dark: '#7AC98A',
        },
        'water': {
          DEFAULT: '#87CEEB',
          light: '#B0E2FF',
          dark: '#5CACCE',
        },
        'sun': {
          DEFAULT: '#FFD93D',
          light: '#FFE566',
          dark: '#E6C235',
        },
        'soil': {
          DEFAULT: '#4A4A4A',
          light: '#6B6B6B',
          dark: '#2D2D2D',
        },
        'paper': {
          DEFAULT: '#FDFBF7',
          cream: '#F5F0E6',
          warm: '#FFF8F0',
        },
        'gold': {
          border: '#D4AF37',
          light: '#F0D78C',
        },
      },
      fontFamily: {
        'display': ['Nunito', 'system-ui', 'sans-serif'],
        'serif': ['Lora', 'Georgia', 'serif'],
      },
      backdropBlur: {
        'frosted': '10px',
      },
    },
  },
  plugins: [],
};
