import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    // 👇 Add this proxy configuration
    proxy: {
      '/auth': { // When a request starts with /auth
        target: 'http://localhost:8080', // Proxy it to your backend
        changeOrigin: true, // Needed for virtual hosting
        // rewrite: (path) => path.replace(/^\/auth/, '/auth'), // Optional: if your backend also expects /auth
        // You generally don't need rewrite if the path segment matches
      },
      // If you have other API endpoints not under /auth, add them too
      // '/api': {
      //   target: 'http://localhost:8080',
      //   changeOrigin: true,
      // },
    },
  },
});