/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: 'var(--color-bg-secondary, #E9E6D8)',
          light: 'var(--color-bg-primary, #F7F5EF)',
        },
        coffee: {
          DEFAULT: 'var(--color-primary, #4B2E24)',
          dark: 'var(--color-text-primary, #241914)',
          muted: 'var(--color-text-muted, #8C7565)',
          beige: 'var(--color-accent, #D5C6AD)',
        },
      },
      fontFamily: {
        serif: ['var(--font-heading, "Lora")', '"Playfair Display"', 'serif'],
        sans: ['var(--font-body, "Be Vietnam Pro")', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        brand: 'var(--radius-brand, 0.25rem)',
      }
    },
  },
  plugins: [],
}
