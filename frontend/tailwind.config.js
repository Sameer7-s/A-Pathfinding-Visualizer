/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563eb",
          hover: "#1d4ed8",
        },
        surface: {
          bg: "#f8fafc",
          card: "#ffffff",
        },
        ink: {
          DEFAULT: "#111827",
          muted: "#6b7280",
        },
        border: {
          DEFAULT: "#e5e7eb",
          input: "#d1d5db",
        },
        status: {
          error: "#dc2626",
          success: "#16a34a",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
