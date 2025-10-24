import React from 'react'
import { Card } from '../../../components/ui'

export function AboutPage() {
  return (
    <div className="space-y-6">
      {/* 应用信息 */}
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-white">Voice Assistant</h2>
            <p className="text-white/60">智能语音助手</p>
          </div>
          
          <div className="text-sm text-white/60">
            <p>版本 1.0.0</p>
            <p>构建时间: {new Date().toLocaleDateString('zh-CN')}</p>
          </div>
        </div>
      </Card>

      {/* 功能特性 */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-white mb-4">功能特性</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="text-white font-medium">语音识别与合成</h4>
              <p className="text-sm text-white/60">支持实时语音识别和自然语音合成</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="text-white font-medium">多模型支持</h4>
              <p className="text-sm text-white/60">支持 OpenAI、Anthropic 等多种AI模型</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="text-white font-medium">MCP 协议支持</h4>
              <p className="text-sm text-white/60">支持 Model Context Protocol 扩展能力</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="text-white font-medium">全局快捷键</h4>
              <p className="text-sm text-white/60">Cmd+Shift+V 显示/隐藏，Cmd+Shift+Space 语音激活</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 开发信息 */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-white mb-4">开发信息</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-white/60">开发者:</span>
            <span className="text-white">Alain</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">邮箱:</span>
            <span className="text-white">yinxulai@hotmail.com</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">框架:</span>
            <span className="text-white">Electron + React + TypeScript</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">构建工具:</span>
            <span className="text-white">Vite + Electron Forge</span>
          </div>
        </div>
      </Card>

      {/* 许可证信息 */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-white mb-4">许可证</h3>
        <div className="space-y-2">
          <p className="text-sm text-white/60">
            本软件基于 MIT 许可证开源
          </p>
          <div className="text-xs text-white/40 bg-black/30 p-3 rounded-lg">
            <p>MIT License</p>
            <p className="mt-2">
              Permission is hereby granted, free of charge, to any person obtaining a copy
              of this software and associated documentation files...
            </p>
          </div>
        </div>
      </Card>

      {/* 快捷键说明 */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-white mb-4">快捷键</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/60">显示/隐藏窗口</span>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-black/50 border border-white/20 rounded text-xs text-white/80">Cmd</kbd>
              <span className="text-white/40">+</span>
              <kbd className="px-2 py-1 bg-black/50 border border-white/20 rounded text-xs text-white/80">Shift</kbd>
              <span className="text-white/40">+</span>
              <kbd className="px-2 py-1 bg-black/50 border border-white/20 rounded text-xs text-white/80">V</kbd>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-white/60">语音激活</span>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-black/50 border border-white/20 rounded text-xs text-white/80">Cmd</kbd>
              <span className="text-white/40">+</span>
              <kbd className="px-2 py-1 bg-black/50 border border-white/20 rounded text-xs text-white/80">Shift</kbd>
              <span className="text-white/40">+</span>
              <kbd className="px-2 py-1 bg-black/50 border border-white/20 rounded text-xs text-white/80">Space</kbd>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
