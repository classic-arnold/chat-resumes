import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  flush?: boolean
  padding?: 'lg' | 'md' | 'sm'
}

export const Card = ({ children, className, flush, padding = 'md', ...rest }: CardProps) => {
  const padClass =
    padding === 'sm' ? 'ui-card-tight' : padding === 'lg' ? 'ui-card-pad-lg' : ''
  const classes = ['ui-card', flush ? 'ui-card-flush' : '', padClass, className ?? '']
    .filter(Boolean)
    .join(' ')
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}
