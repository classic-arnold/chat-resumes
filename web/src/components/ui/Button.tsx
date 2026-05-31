import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'danger' | 'ghost' | 'primary' | 'secondary'
type Size = 'lg' | 'md' | 'sm'

type CommonProps = {
  block?: boolean
  children: ReactNode
  size?: Size
  variant?: Variant
}

const buildClassName = ({
  block,
  className,
  size = 'md',
  variant = 'primary',
}: CommonProps & { className?: string }) => {
  const baseClasses = 'inline-flex items-center justify-center gap-[0.45rem] border border-transparent rounded-[8px] font-mono font-medium text-[0.78rem] tracking-[0.01em] cursor-pointer transition-all duration-120 no-underline whitespace-nowrap disabled:opacity-55 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-blue-deep text-white border-blue-deep hover:bg-blue-mid hover:border-blue-mid',
    secondary: 'bg-transparent text-blue-deep border-blue-deep hover:bg-blue-pale',
    ghost: 'bg-transparent text-navy-text border-transparent hover:bg-blue-pale',
    danger: 'bg-transparent text-[#b42318] border-transparent hover:bg-[#fef3f2]'
  }[variant]

  const sizeClasses = {
    sm: 'py-[0.4rem] px-[0.7rem] text-[0.72rem]',
    md: 'py-[0.6rem] px-[0.95rem]',
    lg: 'py-[0.85rem] px-[1.3rem] text-[0.86rem]'
  }[size]

  return [
    baseClasses,
    variantClasses,
    sizeClasses,
    block ? 'w-full' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & CommonProps

export const Button = ({
  block,
  children,
  className,
  size,
  type = 'button',
  variant,
  ...rest
}: ButtonProps) => (
  <button
    className={buildClassName({ block, children, className, size, variant })}
    type={type}
    {...rest}
  >
    {children}
  </button>
)

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & CommonProps

export const ButtonLink = ({
  block,
  children,
  className,
  size,
  variant,
  ...rest
}: AnchorProps) => (
  <a className={buildClassName({ block, children, className, size, variant })} {...rest}>
    {children}
  </a>
)
