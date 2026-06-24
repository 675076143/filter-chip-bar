import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // shadcn HSL refs — FilterChipBar component depends on these
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },

        // Kami design tokens (hex) — page-level styling
        parchment: '#f5f4ed',
        brand: '#1B365D',
        'brand-light': '#2D5A8A',
        ivory: '#FAF9F5',
        'warm-sand': '#E8E6DC',
        'border-cream': '#D4D1C4',
        'near-black': '#141413',
        'dark-warm': '#3d3d3a',
        olive: '#504e49',
        stone: '#6b6a64',
      },
      fontFamily: {
        serif: ['Charter', 'Georgia', 'TsangerJinKai02', 'Noto Serif SC', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        whisper: '0 4px 24px rgba(0, 0, 0, 0.05)',
        ring: '0 0 0 2px rgba(27, 54, 93, 0.15)',
      },
    },
  },
  plugins: [],
};
export default config;
