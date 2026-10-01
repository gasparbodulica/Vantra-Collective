import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:     resolve(__dirname, 'index.html'),
        services: resolve(__dirname, 'services.html'),
        pricing:  resolve(__dirname, 'pricing.html'),
        about:    resolve(__dirname, 'about.html'),
        creators: resolve(__dirname, 'creators.html'),
        brands:   resolve(__dirname, 'brands.html'),
        privacy:  resolve(__dirname, 'privacy.html'),
        terms:    resolve(__dirname, 'terms.html'),
      },
    },
  },
});
