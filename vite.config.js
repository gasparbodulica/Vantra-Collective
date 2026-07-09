import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:     resolve(__dirname, 'index.html'),
        creators: resolve(__dirname, 'creators.html'),
        brands:   resolve(__dirname, 'brands.html'),
        cases:    resolve(__dirname, 'case-studies.html'),
        privacy:  resolve(__dirname, 'privacy.html'),
        terms:    resolve(__dirname, 'terms.html'),
      },
    },
  },
});
