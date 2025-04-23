import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connect from '@/lib/db';
import Question from '@/models/Question';
import Practice from '@/models/Practice';

// 获取或创建今日练习
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    await connect();
    
    // 检查今天是否已经创建过每日一练
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 查询今天的每日一练
    const existingPractice = await Practice.findOne({
      userId,
      type: 'daily',
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    if (existingPractice) {
      // 如果今天已经创建过每日一练，则返回该练习及题目
      const questionIds = existingPractice.questions.map(q => q.questionId);
      const questions = await Question.find({ 
        _id: { $in: questionIds } 
      }).select('-answer -explanation');
      
      return NextResponse.json({
        practice: existingPractice,
        questions
      });
    }
    
    // 如果今天还没有创建每日一练，则创建新的练习
    // 随机选择5道题
    const questions = await Question.aggregate([
      { $sample: { size: 5 } },
      { $project: { answer: 0, explanation: 0 } }
    ]);
    
    // 创建新的每日一练记录
    const practice = new Practice({
      userId,
      title: `每日一练 - ${today.toLocaleDateString('zh-CN')}`,
      type: 'daily',
      questions: questions.map(q => ({
        questionId: q._id,
        isCorrect: false
      })),
      totalQuestions: questions.length,
      correctCount: 0,
      accuracy: 0,
      timeStarted: new Date(),
      completed: false
    });
    
    await practice.save();
    
    return NextResponse.json({
      practice,
      questions
    });
  } catch (error) {
    console.error('Error fetching daily practice:', error);
    return NextResponse.json({ error: 'Failed to fetch daily practice' }, { status: 500 });
  }
}

// 获取用户的每日一练记录（用于展示打卡记录）
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();
    const { startDate, endDate } = data;
    
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing date range' }, { status: 400 });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 确保日期范围有效
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }
    
    await connect();
    
    // 查询指定日期范围内的每日一练记录
    const practices = await Practice.find({
      userId,
      type: 'daily',
      createdAt: { $gte: start, $lte: end }
    }).sort({ createdAt: 1 });
    
    // 构建日期范围内的每一天
    const dateRange = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 构建打卡记录
    const checkInRecords = dateRange.map(date => {
      const dateString = date.toISOString().split('T')[0]; // 获取日期部分
      
      // 查找当天的每日一练记录
      const practice = practices.find(p => {
        const practiceDate = new Date(p.createdAt).toISOString().split('T')[0];
        return practiceDate === dateString;
      });
      
      return {
        date: dateString,
        completed: practice ? practice.completed : false,
        accuracy: practice ? practice.accuracy : 0,
        practiceId: practice ? practice._id : null
      };
    });
    
    return NextResponse.json({
      checkInRecords
    });
  } catch (error) {
    console.error('Error fetching check-in records:', error);
    return NextResponse.json({ error: 'Failed to fetch check-in records' }, { status: 500 });
  }
} 