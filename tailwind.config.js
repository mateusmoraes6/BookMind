/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          soft: '#FDF5E6',
        },
        dark: {
          950: '#0a0a0a',
          900: '#121212',
          800: '#1a1a1a',
          700: '#262626',
        }
      }
    },
  },
  plugins: [],
};
