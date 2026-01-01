/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Digital Opulence Palette
        'electric-pink': '#FF007F',
        'sunset-orange': '#FF6600',
        'deep-purple': {
          DEFAULT: '#2A004E',
          dark: '#190028',
        },
      },
    },
  },
  plugins: [],
};
