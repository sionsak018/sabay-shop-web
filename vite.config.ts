import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      usePolling: true,
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Keep React and the router in a chunk of their own. It barely changes
        // on an ordinary deploy, so returning visitors reuse the cached copy
        // instead of re-downloading it alongside every app-code change.
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|react-i18next|i18next)[\\/]/,
            },
          ],
        },
      },
    },
  },
});
