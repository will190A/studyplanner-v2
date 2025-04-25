import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connect from '@/lib/db';
import Mistake from '@/models/Mistake';
import Question from '@/models/Question';
import CustomQuestion from '@/models/CustomQuestion';

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
    if (status) {
      // 支持多个状态筛选，用逗号分隔
      const statuses = status.split(',');
      query.status = { $in: statuses };
    }
    
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
    
    // 分别获取标准题目和自定义题目
    const standardQuestions = await Question.find({ 
      _id: { $in: questionIds } 
    });
    
    const customQuestions = await CustomQuestion.find({
      _id: { $in: questionIds }
    });
    
    console.log('获取到的题目:', {
      standardQuestions: standardQuestions.length,
      customQuestions: customQuestions.length,
      totalMistakes: mistakes.length
    });
    
    // 将题目信息与错题记录合并
    const mistakesWithQuestions = mistakes.map(mistake => {
      let question = null;
      
      if (mistake.isCustom) {
        // 查找自定义题目
        const customQuestion = customQuestions.find(q => 
          q._id.toString() === mistake.questionId.toString()
        );
        
        if (customQuestion) {
          question = {
            _id: customQuestion._id,
            title: customQuestion.subject,
            content: customQuestion.content,
            type: customQuestion.type === 'multiple_choice' ? 'choice' : 
                  customQuestion.type === 'fill_blank' ? 'fill' : 'short_answer',
            options: customQuestion.options ? customQuestion.options.map((opt, index) => ({
              label: String.fromCharCode(65 + index),
              text: opt
            })) : [],
            difficulty: 'medium',
            category: customQuestion.subject
          };
        }
      } else {
        // 查找标准题目
        question = standardQuestions.find(q => 
          q._id.toString() === mistake.questionId.toString()
        );
      }
      
      // 如果找不到题目，记录日志
      if (!question) {
        console.log('找不到题目:', {
          mistakeId: mistake._id,
          questionId: mistake.questionId,
          isCustom: mistake.isCustom
        });
      }
      
      return {
        ...mistake.toObject(),
        question: question || null
      };
    });
    
    // 过滤掉没有题目的错题记录
    const validMistakes = mistakesWithQuestions.filter(mistake => mistake.question !== null);
    
    console.log('错题列表处理结果:', {
      totalMistakes: mistakes.length,
      validMistakes: validMistakes.length,
      invalidMistakes: mistakes.length - validMistakes.length
    });
    
    return NextResponse.json({
      mistakes: validMistakes,
      pagination: {
        total: validMistakes.length,
        page,
        limit,
        totalPages: Math.ceil(validMistakes.length / limit)
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