export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        a2: {
          green: "var(--color-primary)",
          bg: "var(--color-bg)",
          panel: "var(--color-panel)",
          border: "var(--color-border)",
          danger: "var(--color-danger)",
          warning: "var(--color-warning)",
          success: "var(--color-success)"
        }
      },
      boxShadow: {
        glow: "0 0 32px rgba(183, 254, 26, 0.14)"
      }
    }
  },
  plugins: []
};
