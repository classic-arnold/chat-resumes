import type { ReactNode } from 'react'

type SectionHeaderProps = {
  action?: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  title: ReactNode
}

export const SectionHeader = ({ action, description, eyebrow, title }: SectionHeaderProps) => (
  <div className="flex flex-col gap-[0.25rem] mb-[0.75rem]">
    <div className="flex items-end justify-between gap-[0.75rem]">
      <div>
        {eyebrow ? (
          <div className="uppercase tracking-[0.18em] text-[0.66rem] text-blue-bright font-semibold">
            {eyebrow}
          </div>
        ) : null}
        <h2 className="font-inter font-bold tracking-[-0.02em] text-[1.1rem] text-navy-text m-0">{title}</h2>
        {description ? (
          <p className="text-[0.78rem] text-muted mt-[0.15rem] m-0 leading-[1.6]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  </div>
)
