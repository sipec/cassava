import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

const host = process.env.TAURI_DEV_HOST

export default defineConfig({
 plugins: [tailwindcss(), react()],
 clearScreen: false,
 server: {
  port: 5254,
  strictPort: true,
  host: host || false,
  hmr: host
   ? {
      protocol: 'ws',
      host,
      port: 5255,
     }
   : undefined,
  watch: {
   ignored: ['**/src-tauri/**'],
  },
 },
 envPrefix: ['VITE_', 'TAURI_ENV_*'],
 build: {
  target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
  minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
  sourcemap: !!process.env.TAURI_DEBUG,
 },
})
