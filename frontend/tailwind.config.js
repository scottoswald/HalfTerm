/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Halfterm Mondrian palette
        'ht-orange': '#E8500A',
        'ht-yellow': '#F5C800',
        'ht-blue': '#1A4FBF',
        'ht-red': '#D42B2B',
        'ht-green': '#2A8C4A',
        'ht-black': '#111111',
        'ht-grey': '#F0F0F0',
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#E8500A",           // Halfterm orange
          "primary-content": "#ffffff",
          "secondary": "#1A4FBF",          // Mondrian blue
          "secondary-content": "#ffffff",
          "accent": "#F5C800",             // Mondrian yellow
          "accent-content": "#111111",
          "neutral": "#111111",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",           // Card surface
          "base-200": "#F0F0F0",           // Page background — light grey
          "base-300": "#E0E0E0",           // Borders
          "base-content": "#111111",       // Text
          "info": "#1A4FBF",
          "info-content": "#ffffff",
          "success": "#2A8C4A",            // Green for free/success
          "success-content": "#ffffff",
          "warning": "#F5C800",
          "warning-content": "#111111",
          "error": "#D42B2B",
          "error-content": "#ffffff",
        },
        dark: {
          "primary": "#E8500A",
          "primary-content": "#ffffff",
          "secondary": "#4A7FEF",          // Lighter blue for dark mode
          "secondary-content": "#ffffff",
          "accent": "#F5C800",
          "accent-content": "#111111",
          "neutral": "#E0E0E0",
          "neutral-content": "#111111",
          "base-100": "#242424",           // Card surface dark
          "base-200": "#1A1A1A",           // Page background dark
          "base-300": "#333333",           // Borders dark
          "base-content": "#F0F0F0",       // Text dark
          "info": "#4A7FEF",
          "info-content": "#ffffff",
          "success": "#3AB55E",            // Lighter green for dark
          "success-content": "#ffffff",
          "warning": "#F5C800",
          "warning-content": "#111111",
          "error": "#E84444",
          "error-content": "#ffffff",
        },
      },
    ],
  },
}
 