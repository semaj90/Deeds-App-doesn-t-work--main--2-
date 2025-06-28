import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons()
  ],
  theme: {
    colors: {
      primary: {
        DEFAULT: '#1e40af',
        hover: '#1d4ed8'
      },
      secondary: '#64748b',
      accent: '#059669',
      warning: '#d97706',
      danger: '#dc2626',
      success: '#16a34a'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem'
    }
  },
  shortcuts: {
    // Legal case management specific shortcuts
    'case-card': 'bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow',
    'evidence-item': 'bg-white border border-gray-200 rounded-md p-3 mb-2 hover:border-primary transition-colors',
    'status-badge': 'inline-flex items-center px-2 py-1 text-xs font-semibold rounded uppercase tracking-wide',
    'nav-item': 'text-gray-600 hover:text-primary font-medium transition-colors'
  },
  rules: [
    // Custom rules for legal case management
    [/^priority-(.+)$/, ([, color]) => {
      const colors = {
        high: '#dc2626',
        medium: '#d97706',
        low: '#16a34a'
      }
      return { 'border-left': `4px solid ${colors[color] || colors.medium}` }
    }]
  ]
})
