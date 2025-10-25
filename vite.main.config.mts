import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  build: {
    rollupOptions: {
      external: [
        // Electron 模块
        'electron',
        // Picovoice 原生模块
        '@picovoice/porcupine-node',
        '@picovoice/pvrecorder-node',
        // 其他原生模块
        'node:*'
      ]
    },
    commonjsOptions: {
      // 忽略动态 require 调用
      ignoreDynamicRequires: true,
      // 配置动态 require 目标
      dynamicRequireTargets: [
        // 允许 Picovoice 模块的动态 require
        'node_modules/@picovoice/**/*.node',
        'node_modules/@picovoice/**/*.js'
      ]
    }
  },
  // 确保原生模块不被打包
  optimizeDeps: {
    exclude: [
      '@picovoice/porcupine-node',
      '@picovoice/pvrecorder-node'
    ]
  }
})
