/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(222.2 10% 10%)',
        foreground: 'hsl(210 40% 96%)',
        muted: 'hsl(217.2 32.6% 17.5%)',
        card: 'hsl(222.2 10% 12%)',
        border: 'hsl(217.2 32.6% 17.5%)',
        primary: {
          DEFAULT: '#10b981',
          foreground: '#06281f'
        },
      },
      borderRadius: {
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        soft: '0 10px 25px rgba(0,0,0,.25)',
      }
    },
  },
  plugins: [],
}
