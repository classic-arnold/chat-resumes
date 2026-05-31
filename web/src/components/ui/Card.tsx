import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  flush?: boolean
  padding?: 'lg' | 'md' | 'sm'
}

export const Card = ({ children, className, flush, padding = 'md', ...rest }: CardProps) => {
  const padClass =
    padding === 'sm'
      ? 'py-[0.9rem] px-[1rem]'
      : padding === 'lg'
        ? 'p-[1.75rem]'
        : 'p-[1.25rem]'
  
  const baseClasses = 'bg-white border border-border rounded-[14px] shadow-[0_18px_48px_rgba(10,36,99,0.08)]'
  const flushClasses = flush ? 'p-0 overflow-hidden' : ''
  const classes = [baseClasses, flushClasses, padClass, className ?? '']
    .filter(Boolean)
    .join(' ')
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}
