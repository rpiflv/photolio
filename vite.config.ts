import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  plugins: [
    devtools(),
    nitro({ serverDir: 'server' }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  build: {
    // Raise limit to reduce chunk size warnings for larger bundles.
    chunkSizeWarningLimit: 1500,
  },
  // Ensure service worker is copied to build output
  publicDir: 'public',
})

export default config
