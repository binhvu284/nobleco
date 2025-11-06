import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin to disable caching in development
function noCachePlugin() {
    return {
        name: 'no-cache',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                // Disable caching for all requests in development
                if (process.env.NODE_ENV !== 'production') {
                    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                    res.setHeader('Pragma', 'no-cache');
                    res.setHeader('Expires', '0');
                }
                next();
            });
        },
    };
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        noCachePlugin(), // Add cache-busting plugin
    ],
    server: {
        // Force HMR (Hot Module Replacement) to always update
        hmr: {
            overlay: true,
        },
        proxy: {
            // Proxy API calls to Vercel local dev server when running `vercel dev`
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
    build: {
        // Add hash to filenames for cache busting in production
        rollupOptions: {
            output: {
                entryFileNames: `assets/[name]-[hash].js`,
                chunkFileNames: `assets/[name]-[hash].js`,
                assetFileNames: `assets/[name]-[hash].[ext]`,
            },
        },
        // Ensure sourcemaps don't cause caching issues
        sourcemap: true,
    },
    // Clear cache on each dev server start
    clearScreen: true,
});
