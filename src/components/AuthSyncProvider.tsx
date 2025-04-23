'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store'

// 此组件用于同步 Next-Auth 会话状态和 useAuthStore 状态
export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { login, logout } = useAuthStore()

  useEffect(() => {
    // 仅在会话状态确定后执行
    if (status === 'loading') return

    // 如果有有效会话，则更新 useAuthStore
    if (session?.user) {
      const user = {
        id: session.user.id as string,
        name: session.user.name as string,
        email: session.user.email as string
      }
      console.log('[AuthSyncProvider] 同步登录状态到 store')
      login(user)
    } else if (status === 'unauthenticated') {
      // 如果没有有效会话，则确保 useAuthStore 也是登出状态
      console.log('[AuthSyncProvider] 同步登出状态到 store')
      logout()
    }
  }, [session, status, login, logout])

  return <>{children}</>
} 