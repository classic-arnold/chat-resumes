import type { ReactNode } from 'react'

type StatProps = {
  label: ReactNode
  value: ReactNode
}

export const Stat = ({ label, value }: StatProps) => (
  <div className="flex flex-col gap-[0.25rem]">
    <div className="font-inter font-bold text-[1.6rem] tracking-[-0.03em] text-navy-text leading-[1]">{value}</div>
    <div className="text-[0.7rem] tracking-[0.08em] uppercase text-muted">{label}</div>
  </div>
)
