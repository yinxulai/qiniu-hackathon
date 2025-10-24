import React from 'react'
import { cn } from '../../utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
  variant?: 'default' | 'primary' | 'danger' | 'pill'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
}

const buttonVariants = {
  default: 'bg-gray-700/70 text-white',
  primary: 'bg-blue-500/80 text-white',
  danger: 'bg-red-500/70 text-white',
  pill: 'bg-black/70 text-white'
}

const buttonSizes = {
  sm: 'p-2',
  md: 'py-2 px-3'
}

export function Button({ 
  children, 
  className, 
  variant = 'default', 
  size = 'md',
  icon,
  disabled,
  ...props 
}: ButtonProps) {
  const isSmall = size === 'sm'
  const isPill = variant === 'pill'
  
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-200 no-drag-region border border-white/20',
        'disabled:bg-gray-700/40 disabled:text-white/40 disabled:cursor-not-allowed',
        isPill ? 'rounded-full text-xs px-3 py-1' : 'rounded-lg text-xs',
        buttonVariants[variant],
        !isPill && buttonSizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

export default Button
