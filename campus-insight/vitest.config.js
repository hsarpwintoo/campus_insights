import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { reactCompilerPreset } from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './testcases/setup.js',
    css: false
  }
});
