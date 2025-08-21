import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // Color aliases for specific use cases
        success: {
          DEFAULT: "hsl(142, 69%, 48%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        warning: {
          DEFAULT: "hsl(43, 74%, 66%)",
          foreground: "hsl(0, 0%, 0%)",
        },
        error: {
          DEFAULT: "hsl(0, 84%, 60%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        // Status-specific colors
        status: {
          active: "hsl(142, 69%, 48%)",
          "part-time": "hsl(43, 74%, 66%)",
          fired: "hsl(0, 84%, 60%)",
          sent: "hsl(142, 69%, 48%)",
          draft: "hsl(43, 74%, 66%)",
        },
        // Timesheet specific colors
        timesheet: {
          sick: "hsl(217, 91%, 85%)",
          vacation: "hsl(291, 64%, 85%)",
          absence: "hsl(220, 13%, 85%)",
          fired: "hsl(0, 84%, 85%)",
          weekend: "hsl(0, 84%, 95%)",
          locked: "hsl(220, 13%, 75%)",
        },
        // Quality rating colors
        quality: {
          1: "hsl(0, 84%, 85%)",
          2: "hsl(43, 100%, 85%)",
          3: "hsl(60, 100%, 85%)",
          4: "hsl(142, 69%, 85%)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
            transform: "translateY(-10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-in-right": {
          from: {
            opacity: "0",
            transform: "translateX(100%)",
          },
          to: {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "pulse-green": {
          "0%, 100%": {
            boxShadow: "0 0 0 0 hsl(var(--primary) / 0.7)",
          },
          "50%": {
            boxShadow: "0 0 0 10px hsl(var(--primary) / 0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "pulse-green": "pulse-green 2s infinite",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "100": "25rem",
        "112": "28rem",
        "128": "32rem",
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
      },
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },
      minHeight: {
        "screen-75": "75vh",
        "screen-50": "50vh",
      },
      backdropBlur: {
        xs: "2px",
      },
      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    // Custom plugin for Russian typography
    function({ addUtilities }: { addUtilities: any }) {
      const newUtilities = {
        '.text-russian': {
          'font-feature-settings': '"cv11", "ss01"',
          'font-variant-numeric': 'oldstyle-nums',
        },
        '.print-exact': {
          '-webkit-print-color-adjust': 'exact',
          'color-adjust': 'exact',
        },
      }
      addUtilities(newUtilities)
    }
  ],
} satisfies Config;
