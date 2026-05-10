import type { ReactNode } from 'react'

type EmptyStateProps = {
  action?: ReactNode
  icon?: ReactNode
  subtext?: ReactNode
  text: ReactNode
}

export const EmptyState = ({ action, icon, subtext, text }: EmptyStateProps) => (
  <div className="ui-empty">
    {icon ? <span className="ui-empty-icon">{icon}</span> : null}
    <div className="ui-empty-text">{text}</div>
    {subtext ? <div className="ui-empty-subtext">{subtext}</div> : null}
    {action}
  </div>
)
