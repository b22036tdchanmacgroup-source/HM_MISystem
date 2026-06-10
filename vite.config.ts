import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/HM_MIS/',  // ← 이 줄 추가 (저장소명이 HM_MIS)
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
})
