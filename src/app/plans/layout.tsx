'use client'

import { useSession } from 'next-auth/react' 
import { Loader2 } from 'lucide-react'

export default function PlansLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { status } = useSession()
  
  // 只有在会话正在加载时显示加载指示器
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // 不管用户是否登录，都渲染子组件
  return <>{children}</>
} 