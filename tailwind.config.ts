import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'uc-navy': 'var(--uc-navy)',
        'uc-navy-light': 'var(--uc-navy-light)',
        'uc-navy-dark': 'var(--uc-navy-dark)',
        'uc-teal': 'var(--uc-teal)',
        'uc-teal-light': 'var(--uc-teal-light)',
        'uc-teal-dark': 'var(--uc-teal-dark)',
        'uc-gold': 'var(--uc-gold)',
        'uc-gold-light': 'var(--uc-gold-light)',
        'uc-gold-dark': 'var(--uc-gold-dark)',
        'uc-sky': 'var(--uc-sky)',
        'uc-coral': 'var(--uc-coral)',
        'uc-bg': 'var(--uc-bg)',
        'uc-surface': 'var(--uc-surface)',
        'uc-border': 'var(--uc-border)',
        'uc-text': 'var(--uc-text)',
        'uc-text-muted': 'var(--uc-text-muted)',
      },
    },
  },
  plugins: [],
}

export default config