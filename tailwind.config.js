/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#6c5ce7', light: '#8b7cf0', pale: '#f0eefb', border: '#d4cef5' },
        surface: { DEFAULT: '#ffffff', page: '#f5f5f7', subtle: '#f0f0f3' },
        ink: { DEFAULT: '#16151d', muted: '#3a3848', faint: '#6b687c', ghost: '#9a97a8' },
        success: { DEFAULT: '#0f9f6e', bg: '#e6f7f0' },
        danger:  { DEFAULT: '#dc4a4a', bg: '#fdecec' },
        warn:    { DEFAULT: '#c07812', bg: '#fef6e8' },
        info:    { DEFAULT: '#1a6bb8', bg: '#e8f2fb' },
      },
      boxShadow: {
        card:  '0 1px 2px rgba(22,21,29,0.04), 0 2px 8px rgba(22,21,29,0.04)',
        card2: '0 4px 16px rgba(22,21,29,0.08), 0 1px 3px rgba(22,21,29,0.04)',
        focus: '0 0 0 3px rgba(108,92,231,0.12)',
      },
      borderColor: { DEFAULT: 'rgba(22,21,29,0.08)' },
      fontFamily: {
        sans: ['var(--font-poppins)', 'Poppins', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'ui-xs':  ['11px', { lineHeight: '1.4' }],
        'ui-sm':  ['12px', { lineHeight: '1.45' }],
        'ui':     ['13px', { lineHeight: '1.5' }],
        'ui-md':  ['14px', { lineHeight: '1.5' }],
        'ui-lg':  ['16px', { lineHeight: '1.4' }],
        'ui-xl':  ['20px', { lineHeight: '1.25' }],
        'ui-2xl': ['24px', { lineHeight: '1.2' }],
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
}
