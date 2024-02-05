import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  // use base to specify web base dir
  // do not use when targeting android or ios
  // base:"/ble/",
  plugins: [vue()],
})
