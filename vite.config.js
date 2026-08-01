import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Ensure relative paths for smooth browser hosting
  plugins: [
    react(),
    {
      name: 'ping-endpoint-plugin',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/ping' || req.url?.startsWith('/ping?')) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end('pong');
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 5000,
    host: true
  },
  preview: {
    port: 5000,
    host: true
  }
})
