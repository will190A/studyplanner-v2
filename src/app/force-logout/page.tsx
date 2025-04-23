'use client'

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function ForceLogout() {
  const router = useRouter()

  useEffect(() => {
    // 清除所有NextAuth的会话信息
    const logout = async () => {
      // 删除localStorage中的数据
      localStorage.clear()
      
      // 清除会话状态
      await signOut({ redirect: false })
      
      // 清除所有cookie
      document.cookie.split(';').forEach(c => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`)
      })
      
      // 导航到着陆页
      router.push('/landing')
      router.refresh()
    }
    
    logout()
  }, [router])
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin mb-4" />
      <p className="text-lg">正在退出登录...</p>
    </div>
  )
} 