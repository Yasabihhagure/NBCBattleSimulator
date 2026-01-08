import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pagesのリポジトリ名に合わせて変更してください（例: '/NBCBattleSimulator/'）
  base: '/NBCBattleSimulator/',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
})
