/**
 * Design System Tokens - Sprint 3
 * Centralized semantic tokens for visual scalability.
 */

export const tokens = {
  colors: {
    // Base palette (keeping existing colors for backward compatibility)
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
    },
    
    // Semantic Mapping
    semantic: {
      bg: { light: '#f8fafc', dark: '#0a0a0a' }, // slate-50 / dark-950
      surface: { light: '#ffffff', dark: '#121212' }, // white / dark-900
      text: { light: '#0f172a', dark: '#f5f5f4' }, // slate-900 / cream-100
      success: { light: '#16a34a', dark: '#34d399' }, // green-600 / emerald-400
      warning: { light: '#f59e0b', dark: '#fb923c' }, // amber-500 / orange-400
      danger: { light: '#ef4444', dark: '#f97316' }, // red-500 / orange-500
      primary: { light: '#6366f1', dark: '#818cf8' }, // indigo-500 / indigo-400
    }
  },
  
  typography: {
    fontStack: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      thin: '100',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    }
  },

  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
  },

  radius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  shadow: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  }
} as const;

export type Tokens = typeof tokens;
