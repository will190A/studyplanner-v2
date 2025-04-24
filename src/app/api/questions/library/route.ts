import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/db"
import mongoose from "mongoose"

// 定义题目模型
// 建立用户题库的模型
const customQuestionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ["multiple_choice", "fill_blank", "short_answer"] },
  content: { type: String, required: true },
  options: [String],
  answer: { type: String, required: true },
  explanation: { type: String },
  subject: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
})

// 确保模型只被创建一次
const CustomQuestion = mongoose.models.CustomQuestion || 
  mongoose.model("CustomQuestion", customQuestionSchema)

// 保存题目到用户自定义题库
export async function POST(req: Request) {
  try {
    // 验证用户是否已登录
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      )
    }

    // 获取用户ID
    const userId = session.user.id

    // 解析请求体
    const { questions, courseName } = await req.json()
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "题目数据格式不正确" },
        { status: 400 }
      )
    }

    // 连接数据库
    await connectToDatabase()

    // 添加用户ID到每个题目
    const questionsWithUserId = questions.map(q => ({
      ...q,
      userId,
      subject: courseName || q.subject
    }))

    // 批量保存题目
    await CustomQuestion.insertMany(questionsWithUserId)

    return NextResponse.json({
      success: true,
      message: "题目已保存到您的自定义题库",
      count: questions.length
    })
  } catch (error) {
    console.error("保存题目失败:", error)
    return NextResponse.json(
      { error: "保存题目失败，请稍后重试" },
      { status: 500 }
    )
  }
}

// 获取用户自定义题库
export async function GET(req: Request) {
  try {
    // 验证用户是否已登录
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      )
    }

    // 获取用户ID
    const userId = session.user.id

    // 获取查询参数
    const url = new URL(req.url)
    const subject = url.searchParams.get("subject")
    const type = url.searchParams.get("type")
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const page = parseInt(url.searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    // 构建查询条件
    const query: any = { userId }
    if (subject) query.subject = subject
    if (type) query.type = type

    // 连接数据库
    await connectToDatabase()

    // 查询题目总数
    const total = await CustomQuestion.countDocuments(query)

    // 查询题目
    const questions = await CustomQuestion.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // 查询所有科目
    const subjects = await CustomQuestion.distinct("subject", { userId })

    return NextResponse.json({
      questions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      subjects
    })
  } catch (error) {
    console.error("获取题库失败:", error)
    return NextResponse.json(
      { error: "获取题库失败，请稍后重试" },
      { status: 500 }
    )
  }
}

// 删除用户自定义题库
export async function DELETE(req: Request) {
  try {
    // 验证用户是否已登录
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      )
    }

    // 获取用户ID
    const userId = session.user.id

    // 获取查询参数
    const url = new URL(req.url)
    const subject = url.searchParams.get("subject")
    
    if (!subject) {
      return NextResponse.json(
        { error: "缺少题库名称参数" },
        { status: 400 }
      )
    }

    // 连接数据库
    await connectToDatabase()

    // 删除指定科目的所有题目
    const result = await CustomQuestion.deleteMany({ 
      userId, 
      subject 
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "未找到指定题库或题库为空" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `已成功删除题库"${subject}"，共删除${result.deletedCount}道题目`,
      deletedCount: result.deletedCount
    })
  } catch (error) {
    console.error("删除题库失败:", error)
    return NextResponse.json(
      { error: "删除题库失败，请稍后重试" },
      { status: 500 }
    )
  }
} 