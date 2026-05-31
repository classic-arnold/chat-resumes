import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer className="flex flex-col md:flex-row md:items-center justify-between md:flex-wrap gap-[1rem] p-[2rem] bg-[#0a0b10] border-t border-white/[0.05]">
      <div className="font-inter text-[0.95rem] font-extrabold text-white">ChatResumes</div>
      <div className="flex flex-col md:flex-row gap-[0.5rem] md:gap-[2rem]">
        <span className="text-[0.75rem] text-white/40 cursor-pointer transition-colors duration-200 hover:text-white">Privacy Policy</span>
        <span className="text-[0.75rem] text-white/40 cursor-pointer transition-colors duration-200 hover:text-white">Terms of Service</span>
        <span className="text-[0.75rem] text-white/40 cursor-pointer transition-colors duration-200 hover:text-white">Cookie Policy</span>
      </div>
      <div className="text-[0.72rem] text-white/25">© 2024 ChatResumes. All rights reserved.</div>
    </footer>
  )
}
