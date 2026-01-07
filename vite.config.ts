import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pagesのリポジトリ名に合わせて変更してください（例: '/NBCBattleSimulator/'）
  base: '/NBCBattleSimulator/',
})
