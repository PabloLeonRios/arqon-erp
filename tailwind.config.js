/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        arqon: {
          emerald: "#00A878",
          dark: "#0E0E0E",
          gray: "#1A1A1A"
        }
      }
    },
  },
  plugins: [],
};