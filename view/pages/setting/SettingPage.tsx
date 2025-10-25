import React, { useState, useEffect } from 'react'
import { ModelProviderCard } from './widgets/ModelProviderCard'
import { MCPConnectionCard } from './widgets/MCPConnectionCard'

export function SettingPage() {
  const [activeTab, setActiveTab] = useState<'model' | 'mcp'>('model')

  return (
    <div className="min-h-screen bg-linear-to-br from-mint-50 via-emerald-50 to-teal-50 p-4 md:p-8">
      {/* 页面头部 */}
      <div className="max-w-6xl mx-auto mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
          设置
        </h1>
        <p className="text-gray-600">管理您的 AI 助手配置</p>
      </div>

      {/* 选项卡导航 */}
      <div className="max-w-6xl mx-auto mb-4 md:mb-6">
        <div className="flex gap-1 md:gap-2 p-1 bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm border border-emerald-100/50">
          <button
            onClick={() => setActiveTab('model')}
            className={`flex-1 px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium transition-all duration-300 text-sm md:text-base ${
              activeTab === 'model'
                ? 'bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200/50'
                : 'text-gray-600 hover:bg-emerald-50/50'
            }`}
          >
            <div className="flex items-center justify-center gap-1 md:gap-2">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="hidden sm:inline">模型配置</span>
              <span className="sm:hidden">模型</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('mcp')}
            className={`flex-1 px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium transition-all duration-300 text-sm md:text-base ${
              activeTab === 'mcp'
                ? 'bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200/50'
                : 'text-gray-600 hover:bg-emerald-50/50'
            }`}
          >
            <div className="flex items-center justify-center gap-1 md:gap-2">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">MCP 连接</span>
              <span className="sm:hidden">MCP</span>
            </div>
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-6xl mx-auto">
        {activeTab === 'model' && <ModelProviderCard />}
        {activeTab === 'mcp' && <MCPConnectionCard />}
      </div>
    </div>
  )
}
