/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                // Clean Athletic Design System - 차분하고 전문적인 색상
                primary: {
                    50: '#F0F9FF',
                    100: '#E0F2FE',
                    200: '#BAE6FD',
                    300: '#7DD3FC',
                    400: '#38BDF8',
                    500: '#0EA5E9',  // Main primary
                    600: '#0284C7',
                    700: '#0369A1',
                    800: '#075985',
                    900: '#0C4A6E',
                    DEFAULT: '#0EA5E9',
                },
                gray: {
                    50: '#F9FAFB',
                    100: '#F3F4F6',
                    200: '#E5E7EB',
                    300: '#D1D5DB',
                    400: '#9CA3AF',
                    500: '#6B7280',
                    600: '#4B5563',
                    700: '#374151',
                    800: '#1F2937',
                    900: '#111827',
                },
                success: {
                    50: '#ECFDF5',
                    100: '#D1FAE5',
                    500: '#10B981',
                    600: '#059669',
                    700: '#047857',
                    DEFAULT: '#10B981',
                },
                warning: {
                    50: '#FFFBEB',
                    100: '#FEF3C7',
                    500: '#F59E0B',
                    600: '#D97706',
                    700: '#B45309',
                    DEFAULT: '#F59E0B',
                },
                error: {
                    50: '#FEF2F2',
                    100: '#FEE2E2',
                    500: '#EF4444',
                    600: '#DC2626',
                    700: '#B91C1C',
                    DEFAULT: '#EF4444',
                },
                // Legacy support
                match: {
                    blue: "#0EA5E9",  // Updated to new primary
                    purple: "#7c3aed", // Will phase out
                    green: "#10B981",  // Updated to new success
                    orange: "#F59E0B", // Updated to new warning
                    red: "#EF4444",    // Updated to new error
                    gray: "#6B7280",
                },
                // Keep original variables for gradual migration
                border: "hsl(var(--border, 229 10% 90%))",
                input: "hsl(var(--input, 229 10% 90%))",
                ring: "hsl(var(--ring, 229 100% 62%))",
                background: "hsl(var(--background, 0 0% 100%))",
                foreground: "hsl(var(--foreground, 229 10% 10%))",
                secondary: {
                    DEFAULT: "hsl(var(--secondary, 229 10% 96%))",
                    foreground: "hsl(var(--secondary-foreground, 229 10% 10%))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive, 0 84% 60%))",
                    foreground: "hsl(var(--destructive-foreground, 0 0% 98%))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted, 229 10% 96%))",
                    foreground: "hsl(var(--muted-foreground, 229 10% 40%))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent, 229 10% 96%))",
                    foreground: "hsl(var(--accent-foreground, 229 10% 10%))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover, 0 0% 100%))",
                    foreground: "hsl(var(--popover-foreground, 229 10% 10%))",
                },
                card: {
                    DEFAULT: "hsl(var(--card, 0 0% 100%))",
                    foreground: "hsl(var(--card-foreground, 229 10% 10%))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
            screens: {
                'xs': '480px',
            },
        },
    },
    plugins: [
        require("@tailwindcss/forms"),
        require("@tailwindcss/typography"),
    ],
} 