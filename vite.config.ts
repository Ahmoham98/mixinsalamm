import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/products': {
        target: 'https://mixinsalam.liara.run',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            proxyReq.setHeader('Pragma', 'no-cache');
            proxyReq.setHeader('Expires', '0');
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            proxyRes.headers['cache-control'] = 'no-cache, no-store, must-revalidate';
            proxyRes.headers['pragma'] = 'no-cache';
            proxyRes.headers['expires'] = '0';
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/api': {
        target: 'https://mixinsalam.liara.run',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            proxyReq.setHeader('Pragma', 'no-cache');
            proxyReq.setHeader('Expires', '0');
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            proxyRes.headers['cache-control'] = 'no-cache, no-store, must-revalidate';
            proxyRes.headers['pragma'] = 'no-cache';
            proxyRes.headers['expires'] = '0';
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/basalam': {
        target: 'https://mixinsalam.liara.run',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            proxyReq.setHeader('Pragma', 'no-cache');
            proxyReq.setHeader('Expires', '0');
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            proxyRes.headers['cache-control'] = 'no-cache, no-store, must-revalidate';
            proxyRes.headers['pragma'] = 'no-cache';
            proxyRes.headers['expires'] = '0';
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  }
})
