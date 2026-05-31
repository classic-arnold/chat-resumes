import type { ReactNode } from 'react'

type EmptyStateProps = {
  action?: ReactNode
  icon?: ReactNode
  subtext?: ReactNode
  text: ReactNode
}

export const EmptyState = ({ action, icon, subtext, text }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-[0.55rem] py-[1.6rem] px-[1rem] text-center text-muted">
    {icon ? (
      <span className="w-[36px] h-[36px] rounded-full bg-blue-pale text-blue-deep inline-flex items-center justify-center text-[1rem]">
        {icon}
      </span>
    ) : null}
    <div className="text-[0.82rem] text-navy-text">{text}</div>
    {subtext ? <div className="text-[0.72rem] text-muted">{subtext}</div> : null}
    {action}
  </div>
)
