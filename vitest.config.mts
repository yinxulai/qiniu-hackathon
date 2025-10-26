import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@server': path.resolve(__dirname, './server'),
      '@view': path.resolve(__dirname, './view')
    }
  },
  test: {
    pool: 'forks', // 在新进程中运行每个测试文件
    fileParallelism: false, // 避免文件级别的并行执行
    isolate: true, // 确保测试之间的隔离
    sequence: {
      concurrent: false // 顺序运行测试
    },
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.vite']
  }
})
