import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('@react-pdf')) {
            return 'pdf-export';
          }

          if (id.includes('xlsx')) {
            return 'xlsx-export';
          }

          if (id.includes('recharts')) {
            return 'charts-vendor';
          }

          if (id.includes('@dnd-kit')) {
            return 'kanban-vendor';
          }

          if (id.includes('@apollo') || id.includes('graphql')) {
            return 'apollo';
          }

          if (id.includes('@radix-ui') || id.includes('lucide-react')) {
            return 'ui-vendor';
          }

          return;
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
