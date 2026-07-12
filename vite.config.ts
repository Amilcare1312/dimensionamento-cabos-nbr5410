import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/dimensionamento-cabos-nbr5410/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
