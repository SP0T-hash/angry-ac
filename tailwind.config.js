/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // White-label: cores de marca resolvidas por AR (tenant) via CSS vars.
        // O formato "R G B" permite modificadores de opacidade (bg-brand/5 etc.).
        brand: {
          DEFAULT: 'rgb(var(--brand-primary-rgb) / <alpha-value>)',
          verify: 'rgb(var(--brand-verify-rgb) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
