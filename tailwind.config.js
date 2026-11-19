const withAlpha = (variable, fallback) => ({ opacityValue }) => {
  if (opacityValue === undefined || opacityValue === '1') {
    return `var(${variable}, ${fallback})`;
  }
  return `color-mix(in srgb, var(${variable}, ${fallback}) calc(${opacityValue} * 100%), transparent)`;
};

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: withAlpha('--color-bg-secondary', '#E9E6D8'),
          light: withAlpha('--color-bg-primary', '#F7F5EF'),
        },
        coffee: {
          DEFAULT: withAlpha('--color-primary', '#4B2E24'),
          dark: withAlpha('--color-text-primary', '#241914'),
          muted: withAlpha('--color-text-muted', '#8C7565'),
          beige: withAlpha('--color-accent', '#D5C6AD'),
        },
      },
      borderColor: {
        DEFAULT: 'var(--color-accent, #D5C6AD)',
      },
      fontFamily: {
        serif: ['var(--font-heading, "Lora")', '"Playfair Display"', 'serif'],
        sans: ['var(--font-body, "Be Vietnam Pro")', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        brand: 'var(--radius-brand, 0.25rem)',
      },
      boxShadow: {
        editorial: '0 18px 45px -24px rgba(36, 25, 20, 0.22)',
        'editorial-lg': '0 28px 65px -28px rgba(36, 25, 20, 0.30)',
      },
    },
  },
  plugins: [],
};
