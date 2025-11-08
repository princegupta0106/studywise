// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true, // allows access from network (so ngrok can connect)
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.ngrok-free.app',  // allow ngrok URLs
      '.loca.lt',          // allow localtunnel URLs
      '.trycloudflare.com' // allow cloudflare tunnels
    ],
    port: 5173, // optional, ensures consistent port
  },
})
