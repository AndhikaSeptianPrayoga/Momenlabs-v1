/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "rgb(var(--c-ink) / <alpha-value>)", soft: "rgb(var(--c-ink-soft) / <alpha-value>)", mute: "rgb(var(--c-ink-mute) / <alpha-value>)" },
        cream: { DEFAULT: "rgb(var(--c-cream) / <alpha-value>)", deep: "rgb(var(--c-cream-deep) / <alpha-value>)" },
        rose: { brand: "rgb(var(--c-rose-brand) / <alpha-value>)", soft: "rgb(var(--c-rose-soft) / <alpha-value>)" },
        peach: "rgb(var(--c-peach) / <alpha-value>)",
        paper: "rgb(var(--c-paper) / <alpha-value>)",
        ivory: "#F3EADB",
        violet: { brand: "rgb(var(--c-violet-brand) / <alpha-value>)" },
        gold: { DEFAULT: "rgb(var(--c-gold) / <alpha-value>)", light: "rgb(var(--c-gold-light) / <alpha-value>)", deep: "rgb(var(--c-gold-deep) / <alpha-value>)" },
        noir: { DEFAULT: "rgb(var(--c-noir) / <alpha-value>)", 900: "rgb(var(--c-noir-900) / <alpha-value>)", 800: "rgb(var(--c-noir-800) / <alpha-value>)", 700: "rgb(var(--c-noir-700) / <alpha-value>)", 600: "rgb(var(--c-noir-600) / <alpha-value>)" },
      },
      fontFamily: {
        display: ['"Instrument Serif"', "Georgia", "serif"],
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        script: ['"Great Vibes"', "cursive"],
        cinzel: ['"Cinzel"', "serif"],
        cormorant: ['"Cormorant Garamond"', "Georgia", "serif"],
      },
      boxShadow: {
        glow: "0 20px 60px -15px rgba(201,164,92,0.35)",
        soft: "0 10px 40px -12px rgba(0,0,0,0.55)",
        phone: "0 50px 100px -20px rgba(0,0,0,0.8), 0 30px 80px -30px rgba(201,164,92,0.35)",
      },
      keyframes: {
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [],
};
