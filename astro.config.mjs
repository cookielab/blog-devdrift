import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: process.env.GITHUB_ACTIONS
    ? 'https://cookielab.github.io'
    : 'http://localhost:4321',
  base: process.env.GITHUB_ACTIONS ? '/blog-devdrift/' : '/',
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
