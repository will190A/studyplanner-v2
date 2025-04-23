import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connect from '@/lib/db';
import Question from '@/models/Question';

// 获取题目列表
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    const query: any = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;
    
    await connect();
    
    // 计算总数
    const total = await Question.countDocuments(query);
    
    // 获取题目列表
    const questions = await Question.find(query)
      .skip(skip)
      .limit(limit)
      .select('-answer -explanation') // 不返回答案和解析
      .sort({ createdAt: -1 });
      
    return NextResponse.json({
      questions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// 创建题目（仅管理员可用）
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 这里可以添加管理员权限检查
    // if (!isAdmin(session)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }
    
    const data = await request.json();
    
    // 验证必要字段
    const requiredFields = ['title', 'content', 'type', 'category', 'difficulty', 'answer', 'explanation'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }
    
    // 如果是选择题，必须有选项
    if ((data.type === 'choice' || data.type === 'multiple') && (!data.options || data.options.length < 2)) {
      return NextResponse.json({ error: 'Choice questions must have at least 2 options' }, { status: 400 });
    }
    
    await connect();
    
    const question = new Question(data);
    await question.save();
    
    return NextResponse.json({ message: 'Question created successfully', question }, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
} 