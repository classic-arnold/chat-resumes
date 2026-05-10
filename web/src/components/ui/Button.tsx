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
  return [
    'ui-btn',
    `ui-btn-${variant}`,
    size === 'sm' ? 'ui-btn-sm' : '',
    size === 'lg' ? 'ui-btn-lg' : '',
    block ? 'ui-btn-block' : '',
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
