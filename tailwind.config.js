/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        headline: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['DM Serif Display', 'Plus Jakarta Sans', 'serif'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        // Paleta institucional — colores del logo EYR (azul marino, dorado)
        inst: {
          navy:          '#1e2d7a',
          'navy-mid':    '#2a3d99',
          'navy-light':  '#e0e7fa',
          gold:          '#c49400',
          'gold-light':  '#fff5cc',
        },
        // Paleta EYR — Material Design 3 (del diseño Stitch)
        eyr: {
          primary:           '#4e45e4',
          'primary-dim':     '#4135d8',
          'primary-container': '#bdbaff',
          background:        '#fdf7ff',
          surface:           '#fdf7ff',
          'surface-lowest':  '#ffffff',
          'surface-low':     '#f8f1ff',
          'surface-mid':     '#f2eaff',
          'surface-high':    '#ede4ff',
          'surface-highest': '#e8deff',
          'on-surface':      '#362c55',
          'on-variant':      '#635984',
          outline:           '#7f74a2',
          'outline-variant': '#b7abdc',
          'tertiary-bg':     '#53ddfc',
          'on-tertiary':     '#004b58',
        },
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(99, 102, 241, 0.3)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 20px 40px -12px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'blob': 'blob 8s infinite ease-in-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out both',
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '50%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '75%': { transform: 'translate(20px, 40px) scale(1.05)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
