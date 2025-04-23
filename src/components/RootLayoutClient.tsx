'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import { HydrationErrorSuppress } from './HydrationErrorSuppress'
import { useEffect, useState } from 'react'

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLandingPage = pathname === '/landing' || pathname === '/login' || pathname === '/register'
  const [isClient, setIsClient] = useState(false)

  // 确保只在客户端渲染时设置isClient
  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <>
      {!isLandingPage && (
        <HydrationErrorSuppress>
          <Navbar />
        </HydrationErrorSuppress>
      )}
      <main className={isLandingPage ? '' : 'pt-16'}>
        {children}
      </main>
    </>
  )
} 