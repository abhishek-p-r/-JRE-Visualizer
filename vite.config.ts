import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@react-three/fiber',
      '@react-three/drei',
      'three',
      '@monaco-editor/react',
      'zustand',
      'framer-motion'
    ]
  },
  server: {
    hmr: {
      overlay: false
    }
  }
})
