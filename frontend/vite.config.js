import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'https://student-profile-management-system-backend.onrender.com',
      '/uploads': 'https://student-profile-management-system-backend.onrender.com'
    }
  }
});
