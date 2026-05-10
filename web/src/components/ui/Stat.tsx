import type { ReactNode } from 'react'

type StatProps = {
  label: ReactNode
  value: ReactNode
}

export const Stat = ({ label, value }: StatProps) => (
  <div className="ui-stat">
    <div className="ui-stat-value">{value}</div>
    <div className="ui-stat-label">{label}</div>
  </div>
)
