import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration file
// defineConfig back to vite (not vitest/config) for compatibility
export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom simulates a browser environment for React component tests
    environment: 'jsdom',

    // Loads jest-dom matchers before every test file
    setupFiles: './src/test/setup.ts',

    // Makes describe, it, expect available without importing in every file
    globals: true,
  },
} as any) // 'as any' tells TypeScript to trust us on the test property