/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Rubik', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Rubik', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace']
      },
      colors: {
        dark: {
          bg: '#121212',
          surface: '#1e1e1e',
          border: '#333333',
          hover: '#2a2a2a',
        },
        primary: {
          50: '#e6f0ff',
          100: '#b3d1ff',
          200: '#80b3ff',
          300: '#4d94ff',
          400: '#1a75ff',
          500: '#0066ff',  // Main primary color
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433',
        },
        secondary: {
          50: '#e6fff2',
          100: '#b3ffe0',
          200: '#80ffcd',
          300: '#4dffbb',
          400: '#1affa8',
          500: '#00cc81',  // Main secondary color
          600: '#009961',
          700: '#006640',
          800: '#003320',
          900: '#001a10',
        },
        success: {
          100: '#deffed',
          500: '#10b981',
          700: '#047857',
        },
        warning: {
          100: '#fff7dc',
          500: '#f59e0b',
          700: '#b45309',
        },
        error: {
          100: '#ffe5e5',
          500: '#ef4444',
          700: '#b91c1c',
        },
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
      },
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}