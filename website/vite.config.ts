import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'filter-chip-bar': path.resolve(__dirname, '../src'),
      'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react'),
      '@radix-ui/react-popover': path.resolve(__dirname, 'node_modules/@radix-ui/react-popover'),
      'clsx': path.resolve(__dirname, 'node_modules/clsx'),
      'tailwind-merge': path.resolve(__dirname, 'node_modules/tailwind-merge'),
    },
  },
});
