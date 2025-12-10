import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Only use proxy in development
    proxy: isProduction ? undefined : {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Ensure proper handling of environment variables
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  // Handle environment variables properly
  define: {
    'process.env': {}
  }
})