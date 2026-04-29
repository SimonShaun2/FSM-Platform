import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--color-brand-primary)",
          accent: "var(--color-brand-accent)",
          "accent-light": "var(--color-brand-accent-light)"
        },
        neutral: {
          900: "var(--color-neutral-900)",
          800: "var(--color-neutral-800)",
          700: "var(--color-neutral-700)",
          600: "var(--color-neutral-600)",
          500: "var(--color-neutral-500)",
          400: "var(--color-neutral-400)",
          300: "var(--color-neutral-300)",
          200: "var(--color-neutral-200)",
          100: "var(--color-neutral-100)"
        },
        success: "var(--color-success)",
        "success-light": "var(--color-success-light)",
        warning: "var(--color-warning)",
        "warning-light": "var(--color-warning-light)",
        error: "var(--color-error)",
        "error-light": "var(--color-error-light)",
        ai: "var(--color-ai)",
        "ai-light": "var(--color-ai-light)",
        sidebar: {
          bg: "var(--color-sidebar-bg)",
          active: "var(--color-sidebar-active)"
        }
      },
      borderRadius: {
        shell: "1.5rem"
      },
      boxShadow: {
        panel: "0 18px 50px rgba(19, 21, 33, 0.12)"
      },
      spacing: {
        header: "var(--header-height)",
        sidebar: "var(--sidebar-width)"
      }
    }
  },
  plugins: []
};

export default config;
