// @ts-expect-error - daisyui has no type declarations
import daisyui from 'daisyui'

// Tailwind CSS configuration file
export default {
  // content tells Tailwind which files to scan for class names
  // It removes any unused classes from the final build — keeping CSS lean
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // scan all JS/TS/JSX/TSX files in src
  ],
  plugins: [
    daisyui, // Adds Daisy UI component classes on top of Tailwind
  ],
  daisyui: {
    // themes controls which Daisy UI colour themes are available
    // "light" is clean and professional — we can add more themes later
    themes: ["light"],
  },
}