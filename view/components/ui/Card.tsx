import React from 'react'
import { cn } from '../../utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hover?: boolean
}

export function Card({ 
  children, 
  className, 
  hover = false,
  ...props 
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-black/80 border border-white/50 p-3 rounded-lg transition-all duration-200 shadow-sm',
        hover && 'hover:bg-gray-700/80 hover:border-white/60 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
