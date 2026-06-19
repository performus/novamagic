import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Docs/ — рабочая папка Арта (секвенция бутылки и т.п.), туда идёт запись
      // файлов; watcher Vite падал на EBUSY. .tmp/ — служебные скрипты.
      // public/fonts, public/sequences — статичные ассеты; при подмене watcher падал на EBUSY.
      ignored: ['**/Docs/**', '**/.tmp/**', '**/public/fonts/**', '**/public/sequences/**'],
    },
  },
})
