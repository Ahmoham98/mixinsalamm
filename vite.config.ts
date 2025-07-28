// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { ProxyOptions } from 'vite'

// The defineConfig function can accept a function that receives the command and mode
export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()],
    optimizeDeps: {
      // exclude: ['lucide-react'], // Usually not needed
    },
  };

  // Conditionally add the server configuration only for the 'serve' command (npm run dev)
  if (command === 'serve') {
    return {
      ...config,
      server: {
          host: true,
          port: 5173,
          allowedHosts: ['myapp.test'],
        proxy: {
          '^/mixin/.*|^/basalam/.*|^/products/.*': {
            target: 'http://myapp.test:8000',
            changeOrigin: true,
            secure: false,
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, _res) => {
                console.log('Proxy Error:', err);
              });
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log(`[Proxy] Sending request: ${req.method} ${req.url}`);
              });
              proxy.on('proxyRes', (proxyRes, req, _res) => {
                console.log(`[Proxy] Received response: ${proxyRes.statusCode} ${req.url}`);
              });
            },
          },
        }
      }
    };
  }

  // For the 'build' command, return the base config without the server proxy
  return config;
});