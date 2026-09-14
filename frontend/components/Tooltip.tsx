'use client'

import { useState } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <span className="relative inline-flex items-center">
      <span
        tabIndex={0}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        onClick={() => setVisible((prev) => !prev)}
        className="cursor-help border-b border-dotted border-textSecondary hover:text-primary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
        aria-label={`${typeof children === 'string' ? children : 'Term'}: ${content}`}
      >
        {children}
      </span>
      {visible && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-textPrimary text-white text-xs rounded-xl shadow-lg z-50 pointer-events-none text-center leading-relaxed"
        >
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-textPrimary" />
        </span>
      )}
    </span>
  )
}
