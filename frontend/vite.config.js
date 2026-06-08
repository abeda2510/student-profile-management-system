import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/student_profile/',
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    }
  },
  server: {
    proxy: {
      '/student_profile/spm': {
        target: 'http://localhost:5000',
        rewrite: (path) => path.replace(/^\/student_profile/, '')
      },
      '/spm': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000'
    }
  }
});
