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
        azul: {
          DEFAULT: '#094780',
          escuro: '#063357',
          claro: '#1a6ab5',
        },
        laranja: {
          DEFAULT: '#E67A0E',
          escuro: '#b85f08',
          claro: '#f4a04a',
        },
        cinza: '#939393',
      },
      fontFamily: {
        barlow: ['Barlow', 'sans-serif'],
        condensed: ['"Barlow Condensed"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
