import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({envPrefix:['VITE_NEON_AUTH_URL','VITE_NEON_DATA_API_URL'],plugins:[react(),tailwindcss()]});
