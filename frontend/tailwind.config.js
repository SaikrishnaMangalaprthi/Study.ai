// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,html}"] ,
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary, #3B82F6)",
        secondary: "#7C3AED",
        accent: "#F59E0B",
        success: "#10B981",
        danger: "#EF4444",
        surface: "#1E293B",
        surfaceStrong: "#111827",
        border: "rgba(255,255,255,0.08)",
        muted: "#94A3B8",
        darkBg: "#0F172A",
      },
      borderRadius: {
        xl: "18px",
      },
      boxShadow: {
        soft: "0 18px 40px rgba(15, 23, 42, 0.18)",
      },
    },
  },
  plugins: [],
};
