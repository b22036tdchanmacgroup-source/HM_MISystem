import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/HM_MISystem/',
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,   // 포트 사용 중이면 다른 포트로 넘어가지 않고 오류 출력
  },
})
