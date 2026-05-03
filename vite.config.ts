import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'


export default defineConfig({
  plugins: [vue()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('vue-router')) {
              return 'vue-vendor';
            }
            if (id.includes('primevue') || id.includes('primeicons')) {
              return 'primevue-vendor';
            }
            if (id.includes('pinia')) {
              return 'pinia-vendor';
            }
            return 'vendor';
          }
        }
      }
    }
  },
 
});