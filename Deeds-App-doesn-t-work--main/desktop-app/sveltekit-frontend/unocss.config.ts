import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss';

export default defineConfig({
  // Desktop app configuration with legal-focused design system
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      collections: {
        phosphor: () => import('@iconify/json/json/phosphor.json').then(i => i.default),
        lucide: () => import('@iconify/json/json/lucide.json').then(i => i.default),
        mdi: () => import('@iconify/json/json/mdi.json').then(i => i.default),
        tabler: () => import('@iconify/json/json/tabler.json').then(i => i.default),
      },
    }),
    presetTypography(),
    presetWebFonts({
      fonts: {
        'inter': 'Inter:400,500,600,700',
        'fira-code': 'Fira Code:400,500',
        'crimson': 'Crimson Text:400,600',
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  theme: {
    colors: {
      // Legal desktop app color palette
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
      legal: {
        navy: '#1e3a8a',
        gold: '#d97706',
        neutral: '#374151',
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        paper: '#fefefe',
        ink: '#1f2937',
      },
      semantic: {
        contract: '#3b82f6',
        evidence: '#059669',
        statute: '#7c3aed',
        case: '#dc2626',
        regulation: '#ea580c',
        motion: '#0891b2',
        brief: '#7c2d12',
      },
      desktop: {
        sidebar: '#f8fafc',
        toolbar: '#e2e8f0',
        content: '#ffffff',
        border: '#cbd5e1',
        hover: '#f1f5f9',
        active: '#e2e8f0',
      }
    },
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      mono: ['Fira Code', 'ui-monospace', 'monospace'],
      serif: ['Crimson Text', 'ui-serif', 'Georgia'],
    },
    borderRadius: {
      none: '0',
      sm: '0.125rem',
      DEFAULT: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      full: '9999px',
    },
    boxShadow: {
      'desktop-panel': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      'desktop-elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      'desktop-modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      'desktop-focus': '0 0 0 3px rgba(59, 130, 246, 0.1)',
    }
  },
  shortcuts: {
    // Desktop app specific shortcuts
    'desktop-panel': 'bg-desktop-content border border-desktop-border rounded-lg shadow-desktop-panel',
    'desktop-sidebar': 'bg-desktop-sidebar border-r border-desktop-border h-full overflow-y-auto',
    'desktop-toolbar': 'bg-desktop-toolbar border-b border-desktop-border px-4 py-2 flex items-center',
    'desktop-main': 'flex-1 overflow-hidden bg-desktop-content',
    
    // Legal document styling shortcuts (same as web-app for consistency)
    'legal-heading': 'text-legal-navy font-semibold tracking-tight',
    'legal-body': 'text-legal-neutral leading-relaxed',
    'legal-card': 'desktop-panel p-6',
    'legal-button': 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors',
    'legal-button-primary': 'legal-button bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500',
    'legal-button-secondary': 'legal-button bg-white text-legal-neutral border-desktop-border hover:bg-desktop-hover focus:ring-2 focus:ring-primary-500',
    'legal-input': 'block w-full px-3 py-2 border border-desktop-border rounded-md focus:ring-primary-500 focus:border-primary-500 transition-colors',
    'legal-textarea': 'legal-input resize-none',
    
    // Citation and evidence styling
    'citation-block': 'border-l-4 border-primary-500 bg-primary-50 p-4 my-4 rounded-r',
    'evidence-highlight': 'bg-yellow-100 border-l-4 border-yellow-500 p-2 rounded-r',
    'statute-reference': 'bg-purple-50 border border-purple-200 px-2 py-1 rounded text-purple-800 text-sm',
    
    // Desktop UI patterns
    'window-controls': 'flex items-center space-x-2 p-2',
    'menu-item': 'px-3 py-2 text-sm text-legal-neutral hover:bg-desktop-hover hover:text-legal-ink cursor-pointer rounded',
    'context-menu': 'bg-white border border-desktop-border rounded-lg shadow-desktop-elevated py-1 min-w-32',
    'status-bar': 'bg-desktop-toolbar border-t border-desktop-border px-4 py-1 text-xs text-legal-neutral',
    
    // AI and search interface
    'ai-response': 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4',
    'search-result': 'hover:bg-desktop-hover transition-colors duration-150 p-3 rounded cursor-pointer',
    'rag-context': 'bg-green-50 border-l-4 border-green-500 p-3 text-sm text-green-800',
    
    // Editor and WYSIWYG
    'editor-toolbar': 'desktop-toolbar',
    'editor-content': 'prose prose-legal max-w-none p-6 focus:outline-none',
  },
  rules: [
    // Custom rules for legal document styling
    [/^text-case-(.+)$/, ([, type]) => {
      const colors = {
        contract: '#3b82f6',
        evidence: '#059669',
        statute: '#7c3aed',
        case: '#dc2626',
        regulation: '#ea580c',
        motion: '#0891b2',
        brief: '#7c2d12',
      };
      return { color: colors[type as keyof typeof colors] || colors.contract };
    }],
    [/^bg-case-(.+)$/, ([, type]) => {
      const backgrounds = {
        contract: '#eff6ff',
        evidence: '#ecfdf5',
        statute: '#f3e8ff',
        case: '#fef2f2',
        regulation: '#fff7ed',
        motion: '#ecfeff',
        brief: '#fef7ff',
      };
      return { 'background-color': backgrounds[type as keyof typeof backgrounds] || backgrounds.contract };
    }],
  ],
  safelist: [
    // Ensure these classes are always available
    'prose',
    'prose-legal',
    'legal-card',
    'legal-button-primary',
    'legal-button-secondary',
    'citation-block',
    'evidence-highlight',
    'ai-response',
    'desktop-panel',
    'desktop-sidebar',
    'desktop-toolbar',
    'i-phosphor-scales',
    'i-lucide-gavel',
    'i-mdi-book-open-variant',
    'i-tabler-file-text',
  ],
});
