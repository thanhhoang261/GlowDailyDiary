/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        glow: {
          blush: '#FFF0F5',       // Lavender blush
          cream: '#FFFDF9',       // Warm milk cream background
          peach: '#FFE8DC',       // Soft warm peach
          apricot: '#FFB899',     // Warm peachy accent
          honey: '#FEF3C7',       // Soft butter honey
          mint: '#D1FAE5',        // Minty pastel
          sage: '#A7F3D0',        // Calm sage green
          lavender: '#EDE9FE',    // Soft lavender
          lilac: '#C4B5FD',       // Bubbly purple accent
          sky: '#E0F2FE',         // Cotton sky blue
          coral: '#FDA4AF',       // Warm coral pink
          berry: '#FB7185',       // Strawberry pink
          cocoa: '#4A3E3D',       // Soft deep brown text (softer than harsh black)
          muted: '#8C7B79',       // Cozy secondary text
        },
      },
      fontFamily: {
        sans: ['Quicksand', 'Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      boxShadow: {
        cute: '0 8px 24px -4px rgba(244, 114, 182, 0.12), 0 4px 12px -2px rgba(251, 146, 60, 0.08)',
        soft: '0 4px 20px -2px rgba(90, 70, 70, 0.05), 0 2px 6px -1px rgba(90, 70, 70, 0.04)',
        glow: '0 0 25px rgba(251, 182, 206, 0.45)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.85' },
        },
        floatCute: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
        floatCute: 'floatCute 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
