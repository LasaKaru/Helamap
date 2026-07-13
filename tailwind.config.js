/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5dae2',
          300: '#b0bac9',
          400: '#8695ab',
          500: '#677891',
          600: '#526078',
          700: '#434e62',
          800: '#3a4353',
          900: '#1b2230',
          950: '#0e131d',
        },
      },
      boxShadow: {
        glass: '0 8px 32px rgba(2, 8, 23, 0.18)',
        sheet: '0 -12px 48px rgba(2, 8, 23, 0.28)',
        soft: '0 2px 12px rgba(2, 8, 23, 0.08)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.6)', opacity: '0.9' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.22, 1, 0.36, 1) infinite',
      },
    },
  },
  plugins: [],
};
