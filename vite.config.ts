import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Replace 'Skycast' with your repository name. 
  // If your URL is https://username.github.io/my-weather-app/, use '/my-weather-app/'
  base: '/Skycast/',

});