    // vite.config.js
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react'; // or other framework plugins
    import tailwindcss from '@tailwindcss/vite';

    export default defineConfig({
      plugins: [
        react(), // or other framework plugins
        tailwindcss(),
      ],
    });