import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── Paleta de Colores BeautySync ───────────────────────────────
      colors: {
        // Rosa blush — color principal de la marca
        blush: {
          50:  '#FDF2F4',
          100: '#FAE0E5',
          200: '#F5C0CB',
          300: '#ED94A7',
          400: '#E26080',
          500: '#D4375F',   // ← color primario
          600: '#B52250',
          700: '#961B45',
          800: '#7D1A3F',
          900: '#6B1A3C',
        },
        // Dorado suave — acentos de lujo
        gold: {
          50:  '#FDFBF2',
          100: '#F9F3D9',
          200: '#F3E5A8',
          300: '#EBD26E',
          400: '#E1BE3E',
          500: '#C9A227',   // ← acento dorado
          600: '#A67D1C',
          700: '#885E16',
          800: '#714B16',
          900: '#5F3E17',
        },
        // Crema — fondos cálidos
        cream: {
          50:  '#FEFCF8',
          100: '#FDF8EF',
          200: '#FAF0DC',
          300: '#F5E5C2',
          400: '#EDD8A7',
        },
        // Carbón — tipografía
        charcoal: {
          50:  '#F6F5F5',
          100: '#ECEAEB',
          200: '#D8D5D7',
          300: '#B8B4B6',
          400: '#918D90',
          500: '#756F73',
          600: '#625D61',
          700: '#534F52',
          800: '#484446',
          900: '#3F3C3E',
          950: '#231F21',   // ← texto principal
        },
      },

      // ─── Tipografía ────────────────────────────────────────────────
      fontFamily: {
        sans:    ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],  // Títulos elegantes
        mono:    ['var(--font-geist-mono)', 'monospace'],
      },
      fontSize: {
        // Escala tipográfica de lujo (tamaños ligeramente más generosos)
        'xs':   ['0.75rem',  { lineHeight: '1.2' }],
        'sm':   ['0.875rem', { lineHeight: '1.4' }],
        'base': ['1rem',     { lineHeight: '1.6' }],
        'lg':   ['1.125rem', { lineHeight: '1.6' }],
        'xl':   ['1.25rem',  { lineHeight: '1.5' }],
        '2xl':  ['1.5rem',   { lineHeight: '1.4' }],
        '3xl':  ['1.875rem', { lineHeight: '1.3' }],
        '4xl':  ['2.25rem',  { lineHeight: '1.2' }],
        '5xl':  ['3rem',     { lineHeight: '1.1' }],
        '6xl':  ['3.75rem',  { lineHeight: '1.05' }],
      },

      // ─── Espaciado ─────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // ─── Border Radius (suave y moderno) ───────────────────────────
      borderRadius: {
        'none': '0',
        'sm':   '0.375rem',   // 6px
        DEFAULT: '0.5rem',    // 8px
        'md':   '0.75rem',    // 12px
        'lg':   '1rem',       // 16px
        'xl':   '1.5rem',     // 24px
        '2xl':  '2rem',       // 32px
        '3xl':  '2.5rem',     // 40px
        'full': '9999px',
      },

      // ─── Box Shadow (sombras suaves y elegantes) ───────────────────
      boxShadow: {
        // Sin sombras duras — sombras difusas y cálidas
        'soft-xs': '0 1px 3px 0 rgba(212, 55, 95, 0.05)',
        'soft-sm': '0 2px 8px 0 rgba(212, 55, 95, 0.08)',
        'soft':    '0 4px 16px 0 rgba(212, 55, 95, 0.10)',
        'soft-lg': '0 8px 32px 0 rgba(212, 55, 95, 0.12)',
        'soft-xl': '0 16px 48px 0 rgba(212, 55, 95, 0.15)',
        // Sombra neutra para cards
        'card':    '0 2px 12px 0 rgba(63, 60, 62, 0.08), 0 1px 3px 0 rgba(63, 60, 62, 0.05)',
        'card-hover': '0 8px 24px 0 rgba(63, 60, 62, 0.12), 0 2px 6px 0 rgba(63, 60, 62, 0.06)',
        // Sombra para inputs en focus
        'focus':   '0 0 0 3px rgba(212, 55, 95, 0.15)',
        'inner':   'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
      },

      // ─── Animaciones (Framer Motion complementa estas) ─────────────
      transitionTimingFunction: {
        'luxury':     'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '250':  '250ms',
        '350':  '350ms',
        '400':  '400ms',
        '600':  '600ms',
        '800':  '800ms',
      },
      keyframes: {
        // Fade in sutil para elementos del dashboard
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Shimmer para skeletons de carga
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Pulse suave para badges de notificación
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        // Entrada de cards
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in':    'fade-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
        'slide-up':   'slide-up 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
        'shimmer':    'shimmer 2s linear infinite',
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
      },

      // ─── Background Images ─────────────────────────────────────────
      backgroundImage: {
        // Gradiente de textura suave para el header del dashboard
        'hero-gradient':  'linear-gradient(135deg, #FDF2F4 0%, #FEFCF8 50%, #FDF8EF 100%)',
        'card-gradient':  'linear-gradient(145deg, #FFFFFF 0%, #FDF8EF 100%)',
        // Gradiente del botón primario
        'btn-primary':    'linear-gradient(135deg, #D4375F 0%, #B52250 100%)',
        'btn-primary-hover': 'linear-gradient(135deg, #E26080 0%, #D4375F 100%)',
        // Gradiente dorado para acentos
        'gold-gradient':  'linear-gradient(135deg, #E1BE3E 0%, #C9A227 100%)',
        // Shimmer para skeletons
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
      },

      // ─── Screen Breakpoints ────────────────────────────────────────
      screens: {
        'xs': '475px',
        // Hereda: sm(640), md(768), lg(1024), xl(1280), 2xl(1536)
      },

      // ─── Z-Index ───────────────────────────────────────────────────
      zIndex: {
        'dropdown':    '1000',
        'sticky':      '1100',
        'modal':       '1300',
        'toast':       '1500',
      },
    },
  },
  plugins: [
    // Puedes añadir @tailwindcss/forms para inputs estilizados
    // require('@tailwindcss/forms'),
  ],
}

export default config