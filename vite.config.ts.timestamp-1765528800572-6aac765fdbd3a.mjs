// vite.config.ts
import { defineConfig } from "file:///D:/%5BPERSONAL%20PROJECT%20FILES%5D/Nobleco/node_modules/vite/dist/node/index.js";
import react from "file:///D:/%5BPERSONAL%20PROJECT%20FILES%5D/Nobleco/node_modules/@vitejs/plugin-react/dist/index.js";
function noCachePlugin() {
  return {
    name: "no-cache",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (process.env.NODE_ENV !== "production") {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
        next();
      });
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [
    react(),
    noCachePlugin()
    // Add cache-busting plugin
  ],
  server: {
    // Force HMR (Hot Module Replacement) to always update
    hmr: {
      overlay: true
    },
    proxy: {
      // Proxy API calls to Vercel local dev server when running `vercel dev`
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true
      }
    }
  },
  build: {
    // Add hash to filenames for cache busting in production
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    },
    // Ensure sourcemaps don't cause caching issues
    sourcemap: true
  },
  // Clear cache on each dev server start
  clearScreen: true
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxbUEVSU09OQUwgUFJPSkVDVCBGSUxFU11cXFxcTm9ibGVjb1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcW1BFUlNPTkFMIFBST0pFQ1QgRklMRVNdXFxcXE5vYmxlY29cXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6LyU1QlBFUlNPTkFMJTIwUFJPSkVDVCUyMEZJTEVTJTVEL05vYmxlY28vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcclxuXHJcbi8vIFBsdWdpbiB0byBkaXNhYmxlIGNhY2hpbmcgaW4gZGV2ZWxvcG1lbnRcclxuZnVuY3Rpb24gbm9DYWNoZVBsdWdpbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgbmFtZTogJ25vLWNhY2hlJyxcclxuICAgICAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XHJcbiAgICAgICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvLyBEaXNhYmxlIGNhY2hpbmcgZm9yIGFsbCByZXF1ZXN0cyBpbiBkZXZlbG9wbWVudFxyXG4gICAgICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDYWNoZS1Db250cm9sJywgJ25vLXN0b3JlLCBuby1jYWNoZSwgbXVzdC1yZXZhbGlkYXRlLCBwcm94eS1yZXZhbGlkYXRlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignUHJhZ21hJywgJ25vLWNhY2hlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignRXhwaXJlcycsICcwJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBuZXh0KCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gICAgcGx1Z2luczogW1xyXG4gICAgICAgIHJlYWN0KCksXHJcbiAgICAgICAgbm9DYWNoZVBsdWdpbigpLCAvLyBBZGQgY2FjaGUtYnVzdGluZyBwbHVnaW5cclxuICAgIF0sXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgICAvLyBGb3JjZSBITVIgKEhvdCBNb2R1bGUgUmVwbGFjZW1lbnQpIHRvIGFsd2F5cyB1cGRhdGVcclxuICAgICAgICBobXI6IHtcclxuICAgICAgICAgICAgb3ZlcmxheTogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgICAgIC8vIFByb3h5IEFQSSBjYWxscyB0byBWZXJjZWwgbG9jYWwgZGV2IHNlcnZlciB3aGVuIHJ1bm5pbmcgYHZlcmNlbCBkZXZgXHJcbiAgICAgICAgICAgICcvYXBpJzoge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDozMDAxJyxcclxuICAgICAgICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgfSxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgICAgLy8gQWRkIGhhc2ggdG8gZmlsZW5hbWVzIGZvciBjYWNoZSBidXN0aW5nIGluIHByb2R1Y3Rpb25cclxuICAgICAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIG91dHB1dDoge1xyXG4gICAgICAgICAgICAgICAgZW50cnlGaWxlTmFtZXM6IGBhc3NldHMvW25hbWVdLVtoYXNoXS5qc2AsXHJcbiAgICAgICAgICAgICAgICBjaHVua0ZpbGVOYW1lczogYGFzc2V0cy9bbmFtZV0tW2hhc2hdLmpzYCxcclxuICAgICAgICAgICAgICAgIGFzc2V0RmlsZU5hbWVzOiBgYXNzZXRzL1tuYW1lXS1baGFzaF0uW2V4dF1gLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy8gRW5zdXJlIHNvdXJjZW1hcHMgZG9uJ3QgY2F1c2UgY2FjaGluZyBpc3N1ZXNcclxuICAgICAgICBzb3VyY2VtYXA6IHRydWUsXHJcbiAgICB9LFxyXG4gICAgLy8gQ2xlYXIgY2FjaGUgb24gZWFjaCBkZXYgc2VydmVyIHN0YXJ0XHJcbiAgICBjbGVhclNjcmVlbjogdHJ1ZSxcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVMsU0FBUyxvQkFBb0I7QUFDdFUsT0FBTyxXQUFXO0FBR2xCLFNBQVMsZ0JBQWdCO0FBQ3JCLFNBQU87QUFBQSxJQUNILE1BQU07QUFBQSxJQUNOLGdCQUFnQixRQUFRO0FBQ3BCLGFBQU8sWUFBWSxJQUFJLENBQUMsS0FBSyxLQUFLLFNBQVM7QUFFdkMsWUFBSSxRQUFRLElBQUksYUFBYSxjQUFjO0FBQ3ZDLGNBQUksVUFBVSxpQkFBaUIsdURBQXVEO0FBQ3RGLGNBQUksVUFBVSxVQUFVLFVBQVU7QUFDbEMsY0FBSSxVQUFVLFdBQVcsR0FBRztBQUFBLFFBQ2hDO0FBQ0EsYUFBSztBQUFBLE1BQ1QsQ0FBQztBQUFBLElBQ0w7QUFBQSxFQUNKO0FBQ0o7QUFHQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUN4QixTQUFTO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUE7QUFBQSxFQUNsQjtBQUFBLEVBQ0EsUUFBUTtBQUFBO0FBQUEsSUFFSixLQUFLO0FBQUEsTUFDRCxTQUFTO0FBQUEsSUFDYjtBQUFBLElBQ0EsT0FBTztBQUFBO0FBQUEsTUFFSCxRQUFRO0FBQUEsUUFDSixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDbEI7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUFBLEVBQ0EsT0FBTztBQUFBO0FBQUEsSUFFSCxlQUFlO0FBQUEsTUFDWCxRQUFRO0FBQUEsUUFDSixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxNQUNwQjtBQUFBLElBQ0o7QUFBQTtBQUFBLElBRUEsV0FBVztBQUFBLEVBQ2Y7QUFBQTtBQUFBLEVBRUEsYUFBYTtBQUNqQixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
