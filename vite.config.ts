
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    host: true
  },
  esbuild: {
    // Drop console/debugger in production to reduce JS size and CPU execution time
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    target: 'es2015',
    minify: 'esbuild', 
    sourcemap: false, // Disable sourcemaps to save bandwidth
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core Vendor Chunk (Cached long-term)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Heavy Library Chunk (Loaded only when needed)
          'supabase': ['@supabase/supabase-js'],
          // We intentionally do NOT manually chunk lucide-react. 
          // Vite's default tree-shaking works best when icons are imported into the components that need them.
        }
      }
    }
  }
}))
