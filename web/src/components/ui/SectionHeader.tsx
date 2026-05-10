import type { ReactNode } from 'react'

type SectionHeaderProps = {
  action?: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  title: ReactNode
}

export const SectionHeader = ({ action, description, eyebrow, title }: SectionHeaderProps) => (
  <div className="ui-section">
    <div className="ui-section-row">
      <div>
        {eyebrow ? <div className="ui-section-eyebrow">{eyebrow}</div> : null}
        <h2 className="ui-section-title">{title}</h2>
        {description ? <p className="ui-section-description">{description}</p> : null}
      </div>
      {action}
    </div>
  </div>
)
