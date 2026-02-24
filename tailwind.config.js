/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Expose CSS-var palette tokens as Tailwind utilities.
      // Example: bg-token-fg, text-token-muted, border-token-border
      colors: {
        token: {
          fg:            'var(--fg)',
          'fg-muted':    'var(--fg-muted)',
          'fg-faint':    'var(--fg-faint)',
          bg:            'var(--bg)',
          'bg-subtle':   'var(--bg-subtle)',
          'bg-muted':    'var(--bg-muted)',
          'bg-inset':    'var(--bg-inset)',
          border:        'var(--border)',
          'border-strong': 'var(--border-strong)',
        },
      },
      fontFamily: {
        sans: ['Aileron', 'system-ui', '-apple-system', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
