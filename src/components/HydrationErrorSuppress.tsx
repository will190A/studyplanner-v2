'use client'

import { useEffect, useState } from 'react'

export function HydrationErrorSuppress({
  children
}: {
  children: React.ReactNode
}) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    // 服务端渲染或客户端首次渲染时使用空div
    // 这样避免水合不匹配
    return <div className="invisible" />
  }

  return <>{children}</>
} 