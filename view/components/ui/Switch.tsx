import React from 'react'
import { cn } from '../../utils/cn'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function Switch({ 
  checked, 
  onChange, 
  disabled = false, 
  size = 'md',
  className 
}: SwitchProps) {
  const switchSize = size === 'sm' ? 'w-9 h-5' : 'w-11 h-6'
  const thumbSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  const thumbTranslate = size === 'sm' ? 'translate-x-4' : 'translate-x-5'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 no-drag-region',
        checked ? 'bg-blue-500' : 'bg-gray-600',
        disabled && 'opacity-50 cursor-not-allowed',
        switchSize,
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
          checked ? thumbTranslate : 'translate-x-0',
          thumbSize
        )}
      />
    </button>
  )
}
