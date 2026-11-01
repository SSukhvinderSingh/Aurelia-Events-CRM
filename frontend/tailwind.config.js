/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.7)' },
          '50%': { boxShadow: '0 0 0 10px rgba(245, 158, 11, 0)' },
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 1.6s infinite',
      },
    },
  },
  plugins: [],
};
