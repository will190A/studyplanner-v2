'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { User } from "lucide-react"

const Navbar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  const navItems = [
    { name: '首页', href: '/home' },
    { name: '学习计划', href: '/plans' },
    { name: '题库练习', href: '/practice' },
    { name: '学习报告', href: '/reports' }
  ]

  const handleSignOut = () => {
    // 使用强制登出路由进行彻底的登出
    router.push('/force-logout')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/home" className="text-xl font-bold text-gray-900">
                StudyPlanner
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                    pathname === item.href
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {session?.user ? (
              <>
                <div className="flex items-center mr-4">
                  <div className="flex items-center rounded-full bg-indigo-100 text-indigo-800 p-2 mr-2">
                    <User size={18} />
                  </div>
                  <span className="text-gray-700 font-medium">
                    {session.user.name || '用户'}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md text-sm font-medium"
                >
                  退出登录
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                登录
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 