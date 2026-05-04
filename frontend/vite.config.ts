import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration file
// Plugins: React for JSX support, Tailwind for CSS processing
export default defineConfig({
  plugins: [
    react() // Handles JSX and React
  ],
  test: {
    // jsdom simulates a browser environment for React component tests
    environment: 'jsdom',
    // Loads jest-dom matchers before every test file
    setupFiles: './src/test/setup.ts',
    // Makes describe, it, expect available without importing in every file
    globals: true,
  },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any)