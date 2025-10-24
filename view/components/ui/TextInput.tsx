import React from 'react'
import { cn } from '../../utils/cn'

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export function TextInput({ className, ...props }: TextInputProps) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white text-sm',
        'placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed no-drag-region',
        className
      )}
      {...props}
    />
  )
}
