import React, { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface SettingPageProps {}

interface Settings {
  general: {
    autoStart: boolean
    language: string
    theme: string
  }
  voice: {
    hotkey: string
    sensitivity: number
    language: string
  }
  appearance: {
    opacity: number
    position: string
    alwaysOnTop: boolean
  }
}

function SettingPage({}: SettingPageProps) {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState<Settings>({
    general: {
      autoStart: true,
      language: 'zh-CN',
      theme: 'system'
    },
    voice: {
      hotkey: 'CommandOrControl+Shift+Space',
      sensitivity: 70,
      language: 'zh-CN'
    },
    appearance: {
      opacity: 90,
      position: 'right',
      alwaysOnTop: true
    }
  })

  useEffect(() => {
    // 从URL参数中获取初始tab
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab && ['general', 'voice', 'appearance', 'about'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [])

  const handleSettingChange = (category: keyof Settings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const handleSave = () => {
    // 保存设置逻辑
    console.log('Saving settings:', settings)
    // 可以通过 electronAPI 发送到主进程
  }

  const handleReset = () => {
    // 重置设置
    setSettings({
      general: {
        autoStart: true,
        language: 'zh-CN',
        theme: 'system'
      },
      voice: {
        hotkey: 'CommandOrControl+Shift+Space',
        sensitivity: 70,
        language: 'zh-CN'
      },
      appearance: {
        opacity: 90,
        position: 'right',
        alwaysOnTop: true
      }
    })
  }

  const tabs = [
    { id: 'general', label: '通用', icon: '⚙️' },
    { id: 'voice', label: '语音', icon: '🎤' },
    { id: 'appearance', label: '外观', icon: '🎨' },
    { id: 'about', label: '关于', icon: 'ℹ️' }
  ]

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          开机自启动
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.general.autoStart}
            onChange={(e) => handleSettingChange('general', 'autoStart', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-400">启动时自动运行应用</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          语言
        </label>
        <select
          value={settings.general.language}
          onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
        >
          <option value="zh-CN">简体中文</option>
          <option value="en-US">English</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          主题
        </label>
        <select
          value={settings.general.theme}
          onChange={(e) => handleSettingChange('general', 'theme', e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
        >
          <option value="system">跟随系统</option>
          <option value="dark">深色模式</option>
          <option value="light">浅色模式</option>
        </select>
      </div>
    </div>
  )

  const renderVoiceSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          语音激活快捷键
        </label>
        <input
          type="text"
          value={settings.voice.hotkey}
          onChange={(e) => handleSettingChange('voice', 'hotkey', e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white w-full"
          placeholder="CommandOrControl+Shift+Space"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          语音识别灵敏度: {settings.voice.sensitivity}%
        </label>
        <input
          type="range"
          min="10"
          max="100"
          value={settings.voice.sensitivity}
          onChange={(e) => handleSettingChange('voice', 'sensitivity', parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          语音识别语言
        </label>
        <select
          value={settings.voice.language}
          onChange={(e) => handleSettingChange('voice', 'language', e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
        >
          <option value="zh-CN">中文（简体）</option>
          <option value="en-US">English (US)</option>
        </select>
      </div>
    </div>
  )

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          窗口透明度: {settings.appearance.opacity}%
        </label>
        <input
          type="range"
          min="50"
          max="100"
          value={settings.appearance.opacity}
          onChange={(e) => handleSettingChange('appearance', 'opacity', parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          窗口位置
        </label>
        <select
          value={settings.appearance.position}
          onChange={(e) => handleSettingChange('appearance', 'position', e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
        >
          <option value="right">屏幕右侧</option>
          <option value="left">屏幕左侧</option>
          <option value="center">屏幕中央</option>
        </select>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.appearance.alwaysOnTop}
            onChange={(e) => handleSettingChange('appearance', 'alwaysOnTop', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-400">窗口置顶</span>
        </label>
      </div>
    </div>
  )

  const renderAboutSection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🎙️</div>
        <h2 className="text-2xl font-bold text-white mb-2">Voice Assistant</h2>
        <p className="text-gray-400 mb-4">版本 1.0.0</p>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          一个可以通过文字和语音来控制操作电脑的智能工具，支持结合多种能力交叉执行复杂任务。
        </p>
      </div>

      <div className="border-t border-gray-700 pt-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Electron:</span>
            <span className="text-white ml-2">38.3.0</span>
          </div>
          <div>
            <span className="text-gray-400">Node.js:</span>
            <span className="text-white ml-2">20.x</span>
          </div>
          <div>
            <span className="text-gray-400">React:</span>
            <span className="text-white ml-2">19.2.0</span>
          </div>
          <div>
            <span className="text-gray-400">平台:</span>
            <span className="text-white ml-2">{window.electronAPI?.platform || 'Unknown'}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-6 text-center">
        <p className="text-gray-500 text-xs">
          © 2024 Voice Assistant. All rights reserved.
        </p>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings()
      case 'voice':
        return renderVoiceSettings()
      case 'appearance':
        return renderAppearanceSettings()
      case 'about':
        return renderAboutSection()
      default:
        return renderGeneralSettings()
    }
  }

  return (
    <div className="h-screen w-full bg-gray-900 text-white flex">
      {/* 左侧导航 */}
      <div className="w-64 bg-gray-800 border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-lg font-semibold">设置</h1>
          <p className="text-gray-400 text-sm">Voice Assistant Settings</p>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  )}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* 右侧内容 */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </div>

        {/* 底部操作按钮 */}
        {activeTab !== 'about' && (
          <div className="border-t border-gray-700 p-4 flex justify-end gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              重置
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              保存设置
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingPage
