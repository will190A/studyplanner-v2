import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connect from '@/lib/db';
import Mistake from '@/models/Mistake';
import Question from '@/models/Question';

// 获取用户错题列表
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    const query: any = { userId };
    if (category) query.category = category;
    if (status) query.status = status;
    
    await connect();
    
    // 计算总数
    const total = await Mistake.countDocuments(query);
    
    // 获取错题列表
    const mistakes = await Mistake.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ lastWrongDate: -1 });
      
    // 获取题目详情
    const questionIds = mistakes.map(mistake => mistake.questionId);
    const questions = await Question.find({ 
      _id: { $in: questionIds } 
    });
    
    // 将题目信息与错题记录合并
    const mistakesWithQuestions = mistakes.map(mistake => {
      const question = questions.find(q => 
        q._id.toString() === mistake.questionId.toString()
      );
      
      return {
        ...mistake.toObject(),
        question: question || null
      };
    });
    
    return NextResponse.json({
      mistakes: mistakesWithQuestions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching mistakes:', error);
    return NextResponse.json({ error: 'Failed to fetch mistakes' }, { status: 500 });
  }
}

// 批量更新错题状态
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();
    const { mistakeIds, status } = data;
    
    if (!mistakeIds || !Array.isArray(mistakeIds) || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    await connect();
    
    // 更新错题状态
    const result = await Mistake.updateMany(
      { 
        _id: { $in: mistakeIds },
        userId // 确保只能更新自己的错题
      },
      { $set: { status } }
    );
    
    return NextResponse.json({
      message: 'Mistakes updated successfully',
      updated: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating mistakes:', error);
    return NextResponse.json({ error: 'Failed to update mistakes' }, { status: 500 });
  }
} 