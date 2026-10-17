import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vercel from './vercel.json';

export default defineConfig({
  plugins: [react()],
  preview: { headers: Object.fromEntries(vercel.headers[0].headers.map(h => [h.key,h.value])) },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
              return 'react-vendor';
            }
            if (id.includes('recharts')) return 'recharts';
            // d3 modules are pulled in by recharts and are sizeable on their own
            if (id.includes('d3-') || id.includes('victory-vendor')) return 'd3-vendor';
            if (id.includes('leaflet')) return 'leaflet';
          }
        },
      },
    },
  },
});
