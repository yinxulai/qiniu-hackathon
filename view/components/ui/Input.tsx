import React, { forwardRef } from 'react'
import { cn } from '../../utils/cn'

interface InputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string
}

export const Input = forwardRef<HTMLTextAreaElement, InputProps>(({ 
  className,
  ...props 
}, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full bg-transparent text-white placeholder-white/60 px-4 py-3 resize-none outline-none min-h-12 max-h-[120px] no-drag-region',
        className
      )}
      {...props}
    />
  )
})

Input.displayName = 'Input'

export default Input
