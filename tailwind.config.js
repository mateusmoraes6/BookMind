import { tokens } from './src/design/tokens';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Legacy colors for backward compatibility
        cream: tokens.colors.cream,
        dark: tokens.colors.dark,

        // Semantic Tokens (Sprint 3)
        'bg': {
          DEFAULT: tokens.colors.semantic.bg.light,
          dark: tokens.colors.semantic.bg.dark,
        },
        'surface': {
          DEFAULT: tokens.colors.semantic.surface.light,
          dark: tokens.colors.semantic.surface.dark,
        },
        'text': {
          DEFAULT: tokens.colors.semantic.text.light,
          dark: tokens.colors.semantic.text.dark,
        },
        'success': {
          DEFAULT: tokens.colors.semantic.success.light,
          dark: tokens.colors.semantic.success.dark,
        },
        'warning': {
          DEFAULT: tokens.colors.semantic.warning.light,
          dark: tokens.colors.semantic.warning.dark,
        },
        'danger': {
          DEFAULT: tokens.colors.semantic.danger.light,
          dark: tokens.colors.semantic.danger.dark,
        },
        'primary': {
          DEFAULT: tokens.colors.semantic.primary.light,
          dark: tokens.colors.semantic.primary.dark,
        },
      },
      fontSize: tokens.typography.fontSize,
      fontWeight: tokens.typography.fontWeight,
      lineHeight: tokens.typography.lineHeight,
      spacing: tokens.spacing,
      borderRadius: tokens.radius,
      boxShadow: tokens.shadow,
      transitionDuration: {
        ...tokens.duration,
        '300': '200ms',
        '500': '250ms',
      },
    },
  },
  plugins: [],
};

