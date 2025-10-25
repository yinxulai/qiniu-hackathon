import React, { useState } from 'react'
import { ASRConfigPanel } from './ASRConfigPanel'
import { VoiceWakeupPanel } from './VoiceWakeupPanel'

export function VoiceConfigCard() {
  const [activeSubTab, setActiveSubTab] = useState<'asr' | 'wakeup'>('asr')

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-emerald-100/50 overflow-hidden">
      {/* 子选项卡导航 */}
      <div className="border-b border-emerald-100/50">
        <div className="flex gap-1 p-4">
          <button
            onClick={() => setActiveSubTab('asr')}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeSubTab === 'asr'
                ? 'bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-200/50'
                : 'text-gray-600 hover:bg-blue-50/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>阿里云语音识别</span>
            </div>
          </button>
          <button
            onClick={() => setActiveSubTab('wakeup')}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeSubTab === 'wakeup'
                ? 'bg-linear-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200/50'
                : 'text-gray-600 hover:bg-purple-50/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 12.536L12 9l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Picovoice 语音唤醒</span>
            </div>
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        {activeSubTab === 'asr' && <ASRConfigPanel />}
        {activeSubTab === 'wakeup' && <VoiceWakeupPanel />}
      </div>
    </div>
  )
}
