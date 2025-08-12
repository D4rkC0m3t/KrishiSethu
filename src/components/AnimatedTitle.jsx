'use client'

import React from 'react'

export default function AnimatedTitle({ size = "large" }) {
  const isSmall = size === "small";

  return (
    <div className={`relative flex items-center justify-center ${isSmall ? 'py-2' : 'py-16'}`}>
      {/* Simple title */}
      <h1 className={`${isSmall ? 'text-[24px] md:text-[28px]' : 'text-[42px] md:text-[64px]'} font-serif font-bold tracking-wide text-gray-800 dark:text-gray-200 z-10 relative`}>
        Krishisethu
      </h1>

    </div>
  )
}
