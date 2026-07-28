/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)'
        },
        secondary: {
          50: 'var(--color-secondary-50)',
          100: 'var(--color-secondary-100)',
          200: 'var(--color-secondary-200)',
          300: 'var(--color-secondary-300)',
          400: 'var(--color-secondary-400)',
          500: 'var(--color-secondary-500)',
          600: 'var(--color-secondary-600)',
          700: 'var(--color-secondary-700)',
          800: 'var(--color-secondary-800)',
          900: 'var(--color-secondary-900)'
        },
        accent: {
          50: 'var(--color-accent-50)',
          100: 'var(--color-accent-100)',
          200: 'var(--color-accent-200)',
          300: 'var(--color-accent-300)',
          400: 'var(--color-accent-400)',
          500: 'var(--color-accent-500)',
          600: 'var(--color-accent-600)',
          700: 'var(--color-accent-700)',
          800: 'var(--color-accent-800)',
          900: 'var(--color-accent-900)'
        },
        success: 'var(--color-success)',
        'success-bg': 'var(--color-success-bg)',
        'success-border': 'var(--color-success-border)',
        warning: 'var(--color-warning)',
        'warning-text': 'var(--color-warning-text)',
        'warning-bg': 'var(--color-warning-bg)',
        'warning-border': 'var(--color-warning-border)',
        error: 'var(--color-error)',
        'error-bg': 'var(--color-error-bg)',
        'error-border': 'var(--color-error-border)',
        info: 'var(--color-info)',
        'info-bg': 'var(--color-info-bg)',
        whatsapp: 'var(--color-whatsapp)',
        'whatsapp-bg': 'var(--color-whatsapp-bg)',

        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        'border-soft': 'var(--color-border-soft)',

        text: {
          900: 'var(--color-text-900)',
          700: 'var(--color-text-700)',
          600: 'var(--color-text-600)',
          400: 'var(--color-text-400)'
        }
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        tajawal: ['Tajawal', 'sans-serif']
      },
      fontSize: {
        display: 'var(--fs-display)',
        h1: 'var(--fs-h1)',
        h2: 'var(--fs-h2)',
        h3: 'var(--fs-h3)',
        h4: 'var(--fs-h4)',
        body: 'var(--fs-body)',
        'body-sm': 'var(--fs-body-sm)',
        caption: 'var(--fs-caption)',
        label: 'var(--fs-label)',
        hero: '44px',
        'hero-sm': '32px',
        'sec-title': '30px',
        'sec-title-sm': '26px'
      },
      maxWidth: {
        content: '1180px'
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)'
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        modal: 'var(--shadow-modal)',
        dropdown: 'var(--shadow-dropdown)'
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
        sidebar: 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-width-collapsed)',
        topbar: 'var(--topbar-height)',
        'icon-btn': 'var(--icon-btn-size)'
      },
      width: {
        sidebar: 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-width-collapsed)'
      },
      height: {
        topbar: 'var(--topbar-height)',
        'icon-btn': 'var(--icon-btn-size)'
      },
      zIndex: {
        dropdown: 'var(--z-dropdown)',
        'sticky-header': 'var(--z-sticky-header)',
        'drawer-overlay': 'var(--z-drawer-overlay)',
        drawer: 'var(--z-drawer)',
        'modal-overlay': 'var(--z-modal-overlay)',
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)'
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '350ms'
      },
      transitionTimingFunction: {
        standard: 'var(--ease-standard)'
      }
    }
  },
  plugins: []
}
