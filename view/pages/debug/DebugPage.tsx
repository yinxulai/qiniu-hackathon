import React, { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface SystemInfo {
  appName: string
  appVersion: string
  electronVersion: string
  platform: string
  arch: string
  hostname: string
  totalMemory: number
  freeMemory: number
}

interface DebugPageProps {}

function DebugPage({}: DebugPageProps) {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [serverStatus, setServerStatus] = useState<'loading' | 'online' | 'offline'>('loading')
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    // 模拟系统信息获取
    const mockSystemInfo: SystemInfo = {
      appName: 'Voice Assistant',
      appVersion: '1.0.0',
      electronVersion: '38.3.0',
      platform: window.electronAPI?.platform || 'unknown',
      arch: 'x64',
      hostname: 'localhost',
      totalMemory: 16 * 1024 * 1024 * 1024, // 16GB
      freeMemory: 8 * 1024 * 1024 * 1024, // 8GB
    }
    setSystemInfo(mockSystemInfo)

    // 模拟服务器状态检查
    setTimeout(() => setServerStatus('online'), 1000)

    // 模拟日志
    const mockLogs = [
      '[INFO] Application started',
      '[INFO] Server listening on port 3000',
      '[DEBUG] Voice activation system initialized',
      '[INFO] Main window created',
      '[DEBUG] System tray configured',
    ]
    setLogs(mockLogs)
  }, [])

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleClearLogs = () => {
    setLogs([])
  }

  const handleRefreshInfo = () => {
    setServerStatus('loading')
    setTimeout(() => setServerStatus('online'), 1000)
  }

  return (
    <div className="h-screen w-full bg-gray-900 text-white flex flex-col">
      {/* 标题栏 */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <h1 className="text-lg font-semibold">调试窗口</h1>
        <p className="text-gray-400 text-sm">Voice Assistant Debug Panel</p>
      </div>

      {/* 主要内容 */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 系统信息 */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">系统信息</h2>
              <button
                onClick={handleRefreshInfo}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
              >
                刷新
              </button>
            </div>
            {systemInfo ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">应用名称:</span>
                  <span>{systemInfo.appName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">版本:</span>
                  <span>{systemInfo.appVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Electron:</span>
                  <span>{systemInfo.electronVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">平台:</span>
                  <span>{systemInfo.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">架构:</span>
                  <span>{systemInfo.arch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">主机名:</span>
                  <span>{systemInfo.hostname}</span>
                </div>
                <div className="border-t border-gray-700 pt-2 mt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">总内存:</span>
                    <span>{formatBytes(systemInfo.totalMemory)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">可用内存:</span>
                    <span>{formatBytes(systemInfo.freeMemory)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400">加载中...</div>
            )}
          </div>

          {/* 服务器状态 */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">服务器状态</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  serverStatus === 'online' ? 'bg-green-500' :
                  serverStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                )}>
                </div>
                <span className="text-sm">
                  {serverStatus === 'online' ? '在线' :
                   serverStatus === 'offline' ? '离线' : '检查中...'}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                内置服务器状态监控
              </div>
              <div className="mt-4">
                <button
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
                  onClick={() => window.open('http://localhost:3000/openapi.json', '_blank')}
                >
                  查看 API 文档
                </button>
              </div>
            </div>
          </div>

          {/* 日志输出 */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">应用日志</h2>
              <button
                onClick={handleClearLogs}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
              >
                清空日志
              </button>
            </div>
            <div className="bg-gray-900 rounded p-3 h-48 overflow-auto font-mono text-sm">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className="text-gray-300 mb-1">
                    <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic">暂无日志</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DebugPage
