import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Mistake from '@/models/Mistake'
import connectDB from '@/lib/db'
import mongoose from 'mongoose'

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    await connectDB()
    const { mistakeIds } = await request.json()

    if (!Array.isArray(mistakeIds) || mistakeIds.length === 0) {
      return NextResponse.json(
        { error: '请提供有效的错题ID列表' },
        { status: 400 }
      )
    }

    // 验证所有错题是否属于当前用户
    const mistakes = await Mistake.find({
      _id: { $in: mistakeIds },
      userId: session.user.id
    })

    if (mistakes.length !== mistakeIds.length) {
      return NextResponse.json(
        { error: '部分错题不存在或无权限删除' },
        { status: 403 }
      )
    }

    // 批量删除错题
    await Mistake.deleteMany({
      _id: { $in: mistakeIds }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('批量删除错题失败:', error)
    return NextResponse.json(
      { error: '批量删除错题失败' },
      { status: 500 }
    )
  }
} 