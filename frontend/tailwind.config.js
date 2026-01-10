/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.35)",
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 20px 70px rgba(0,0,0,0.45)"
      }
    }
  },
  plugins: []
}
