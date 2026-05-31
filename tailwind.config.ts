import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-2': 'var(--bg-2)',
        'bg-3': 'var(--bg-3)',
        ink: 'var(--ink)',
        'ink-dim': 'var(--ink-dim)',
        'ink-mute': 'var(--ink-mute)',
        'ink-faint': 'var(--ink-faint)',
        yellow: 'var(--yellow)',
        amber: 'var(--amber)',
        cyan: 'var(--cyan)',
        green: 'var(--green)',
        red: 'var(--red)',
      },
      fontFamily: {
        sans: ['var(--font-grotesk)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        DEFAULT: 'var(--r)',
      },
      maxWidth: {
        shell: 'var(--maxw)',
      },
    },
  },
  plugins: [],
};

export default config;
