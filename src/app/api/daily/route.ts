import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connect from '@/lib/db';
import Question from '@/models/Question';
import Practice from '@/models/Practice';
import CustomQuestion from '@/models/CustomQuestion';

// 获取或创建今日练习
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const userId = session.user.id;
    
    // 获取今天的日期（使用本地时区）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 查找今天的练习记录
    const practice = await Practice.findOne({
      userId,
      type: 'daily',
      createdAt: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('questions');

    // 如果今天还没有练习记录，创建新的练习
    if (!practice) {
      // 获取用户的自定义题库
      const customQuestions = await CustomQuestion.find({ userId });
      
      // 获取专业题库
      const standardQuestions = await Question.find();
      
      // 合并所有可用题目
      const allQuestions = [
        ...standardQuestions.map(q => ({ ...q.toObject(), isCustom: false })),
        ...customQuestions.map(q => ({ 
          _id: q._id,
          title: q.subject,
          content: q.content,
          type: q.type === 'multiple_choice' ? 'choice' : q.type === 'fill_blank' ? 'fill' : 'code',
          options: q.options ? q.options.map((opt: string, index: number) => ({
            label: String.fromCharCode(65 + index),
            text: opt
          })) : [],
          answer: q.answer,
          explanation: q.explanation || '暂无解析',
          isCustom: true
        }))
      ];

      if (allQuestions.length === 0) {
        return new Response(JSON.stringify({ error: 'No questions available' }), { status: 404 });
      }

      // 随机选择5道题目
      const selectedQuestions = allQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

      const newPractice = await Practice.create({
        userId,
        type: 'daily',
        title: `每日一练 - ${new Date().toLocaleDateString('zh-CN')}`,
        questions: selectedQuestions.map(q => ({
          questionId: q._id,
          isCorrect: false
        })),
        totalQuestions: selectedQuestions.length,
        correctCount: 0,
        accuracy: 0,
        timeStarted: new Date(),
        completed: false
      });

      await newPractice.populate('questions');
      
      return new Response(JSON.stringify({
        practice: {
          ...newPractice.toObject(),
          questions: selectedQuestions
        },
        completed: false
      }));
    }

    // 检查是否已完成
    const completed = practice.completed || false;
    
    return new Response(JSON.stringify({
      practice,
      completed
    }));
  } catch (error) {
    console.error('Error in GET /api/daily:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

// 获取用户的每日一练记录（用于展示打卡记录）
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const userId = session.user.id;
    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return new Response(JSON.stringify({ error: 'Missing date range' }), { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // 获取日期范围内的所有练习记录
    const practices = await Practice.find({
      userId,
      type: 'daily',
      createdAt: {
        $gte: start,
        $lte: end
      }
    }).sort({ createdAt: -1 });

    // 构建打卡记录
    const checkInRecords = [];
    let currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      // 查找当天的练习记录
      const practice = practices.find(p => {
        const practiceDate = new Date(p.createdAt);
        return practiceDate >= dayStart && practiceDate <= dayEnd;
      });
      
      checkInRecords.push({
        date: dayStart.toISOString(),
        completed: practice ? practice.completed : false
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return new Response(JSON.stringify({ checkInRecords }));
  } catch (error) {
    console.error('Error in POST /api/daily:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
} 