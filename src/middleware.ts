import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// 需要身份验证的路由列表
const authRoutes = [
  '/plan', // 仅单个plan详情页需要验证
  '/practice/create',
  '/reports/user',
  '/generate' // 添加生成计划的路由到需要验证的列表
]

// 不需要身份验证的路由列表
const publicRoutes = [
  '/',
  '/landing',
  '/login',
  '/register',
  '/home',
  '/plans', // 计划列表页可以公开访问
  '/practice',
  '/mistakes', // 添加错题本页面
  '/daily', // 添加每日一练页面
  '/reports',
  '/api/plans',
  '/api/practices',
  '/force-logout' // 添加强制登出路由
]

export async function middleware(request: NextRequest) {
  // 处理强制登出路由
  if (request.nextUrl.pathname === '/force-logout') {
    const response = NextResponse.redirect(new URL('/landing', request.url))
    
    // 清除所有相关cookie
    response.cookies.delete('next-auth.session-token')
    response.cookies.delete('next-auth.callback-url')
    response.cookies.delete('next-auth.csrf-token')
    response.cookies.delete('__Secure-next-auth.session-token')
    response.cookies.delete('__Secure-next-auth.callback-url')
    response.cookies.delete('__Secure-next-auth.csrf-token')
    
    return response
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl

  // API路由特殊处理，仅验证特定路由
  if (pathname.startsWith('/api/')) {
    // 公开API路由直接放行
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }
    
    // 查看计划详情的API不需要身份验证（GET请求）
    if (pathname.match(/^\/api\/plans\/[^\/]+$/) && request.method === 'GET') {
      return NextResponse.next()
    }
    
    // 查看练习详情的API不需要身份验证（GET请求）
    if (pathname.match(/^\/api\/practices\/[^\/]+$/) && request.method === 'GET') {
      return NextResponse.next()
    }
    
    // 其他API路由需要身份验证
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.next()
  }

  // 处理页面路由
  // 如果是公开页面，直接放行
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    console.log(`[Middleware] 公开页面放行: ${pathname}`)
    return NextResponse.next()
  }

  // 如果是需要身份验证的页面但用户未登录，重定向到登录页
  if (authRoutes.some(route => pathname === route || pathname.startsWith(route + '/')) && !token) {
    console.log(`[Middleware] 需要认证但未登录，重定向到登录页: ${pathname}`)
    // 保存当前URL作为登录后的重定向目标
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url))
  }

  // 其他情况放行
  console.log(`[Middleware] 默认放行: ${pathname}`)
  return NextResponse.next()
}

// 配置中间件应用于哪些路由
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了:
     * - 静态文件 (如 /favicon.ico, /images/*, 等)
     * - 特殊API路由
     */
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
} 