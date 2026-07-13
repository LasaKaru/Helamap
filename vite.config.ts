import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base to '/<repo-name>/' when deploying to GitHub Pages project sites.
  base: '/',
});
