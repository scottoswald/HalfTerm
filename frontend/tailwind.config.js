/** @type {import('tailwindcss').Config} */
module.exports = {
  // content tells Tailwind which files to scan for class names
  // Any class not found in these files gets removed from the final CSS bundle
  // This keeps the production CSS file small and lean
  content: [
    "./index.html",                     // The main HTML entry point
    "./src/**/*.{js,ts,jsx,tsx}",       // All JS/TS/JSX/TSX files inside src
  ],

  plugins: [
    // daisyui — adds pre-built component classes on top of Tailwind
    // e.g. btn, card, select, badge etc
    // Uses CommonJS require() because Tailwind v3 config doesn't support ES module imports
    require('daisyui'),

    // @tailwindcss/typography — adds the 'prose' class
    // prose automatically styles markdown rendered as HTML
    // It handles headings, paragraphs, lists, tables, links etc
    // We use it on the Results page to style the agent's markdown response
    require('@tailwindcss/typography'),
  ],

  daisyui: {
    themes: [
      {
        // Custom theme called 'halfterm'
        // Daisy UI reads these colour values and applies them to all its components
        // So btn-primary automatically uses our orange, base-200 sets the page background etc
        halfterm: {
          // primary — main brand colour, used for buttons, active states, accents
          "primary": "#ff6b35",

          // primary-content — text colour rendered ON TOP of primary backgrounds
          // White text on orange buttons
          "primary-content": "#ffffff",

          // base-100 — main surface/card background colour
          "base-100": "#ffffff",

          // base-200 — slightly darker background, used behind cards to create depth
          "base-200": "#f9f6f1",

          // base-content — main body text colour throughout the app
          "base-content": "#1a1a1a",

          // neutral — used for secondary UI elements and borders
          "neutral": "#444444",
        },
      },
    ],
  },
}