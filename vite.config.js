import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    supabase: ['@supabase/supabase-js'],
                }
            }
        }
    },
    server: {
        proxy: {
            '/api/dodo': {
                target: 'https://live.dodopayments.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/dodo/, '')
            }
        }
    }
})
