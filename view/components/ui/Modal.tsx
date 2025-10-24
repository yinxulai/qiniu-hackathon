import React from 'react'
import { cn } from '../../utils/cn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center no-drag-region">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 模态框内容 */}
      <div className={cn(
        'relative bg-black/90 border border-white/30 rounded-lg shadow-2xl max-w-md w-full mx-4',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        className
      )}>
        {/* 头部 */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <h3 className="text-lg font-medium text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* 内容 */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}
