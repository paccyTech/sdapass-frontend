module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--shell-bg)',
        foreground: 'var(--shell-foreground)',
        border: 'var(--surface-border)',
        input: 'var(--surface-border)',
        ring: 'var(--surface-ring)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--on-primary)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--on-primary)',
        },
        destructive: {
          DEFAULT: 'var(--danger)',
          foreground: 'var(--on-primary)',
        },
        muted: {
          DEFAULT: 'var(--surface-soft)',
          foreground: 'var(--muted)',
        },
        card: {
          DEFAULT: 'var(--surface-primary)',
          foreground: 'var(--shell-foreground)',
        },
        popover: {
          DEFAULT: 'var(--surface-primary)',
          foreground: 'var(--shell-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--surface-soft)',
          foreground: 'var(--shell-foreground)',
        },
      },
    },
  },
  plugins: [],
}