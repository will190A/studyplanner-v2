import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connect from '@/lib/db';
import Practice from '@/models/Practice';
import Mistake from '@/models/Mistake';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const userId = session.user.id;
    
    // 连接数据库
    await connect();
    
    // 获取今天的日期（使用本地时区）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 获取本周的日期范围
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // 获取所有练习记录
    const practices = await Practice.find({ userId });
    
    // 计算总练习数
    const totalPractices = practices.length;
    
    // 计算平均正确率
    const completedPractices = practices.filter(p => p.completed);
    const averageAccuracy = completedPractices.length > 0
      ? completedPractices.reduce((sum, p) => sum + p.accuracy, 0) / completedPractices.length
      : 0;
    
    // 计算总学习时长（分钟）
    const totalTime = completedPractices.reduce((sum, p) => {
      if (p.timeStarted && p.timeCompleted) {
        const duration = new Date(p.timeCompleted).getTime() - new Date(p.timeStarted).getTime();
        return sum + Math.round(duration / 60000); // 转换为分钟
      }
      return sum;
    }, 0);
    
    // 计算连续学习天数
    const practiceDates = new Set(
      practices.map(p => new Date(p.timeStarted).toISOString().split('T')[0])
    );
    let streak = 0;
    let currentDate = new Date(today);
    
    while (practiceDates.has(currentDate.toISOString().split('T')[0])) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // 获取今日任务完成情况
    const todayPractice = await Practice.findOne({
      userId,
      type: 'daily',
      createdAt: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    // 获取本周学习时长
    const weekPractices = practices.filter(p => {
      const practiceDate = new Date(p.timeStarted);
      return practiceDate >= weekStart && practiceDate <= weekEnd;
    });
    
    const weekTime = weekPractices.reduce((sum, p) => {
      if (p.timeStarted && p.timeCompleted) {
        const duration = new Date(p.timeCompleted).getTime() - new Date(p.timeStarted).getTime();
        return sum + Math.round(duration / 60000); // 转换为分钟
      }
      return sum;
    }, 0);
    
    // 获取最近练习记录
    const recentPractices = await Practice.find({ userId })
      .sort({ timeStarted: -1 })
      .limit(5)
      .populate('questions');
    
    return new Response(JSON.stringify({
      statistics: {
        totalPractices,
        averageAccuracy,
        totalTime,
        streak,
        todayTasks: {
          dailyPractice: todayPractice ? todayPractice.completed : false,
          totalTasks: 5,
          completedTasks: todayPractice && todayPractice.completed ? 5 : 0
        },
        weekProgress: {
          time: weekTime,
          completionRate: weekPractices.length > 0
            ? (weekPractices.filter(p => p.completed).length / weekPractices.length) * 100
            : 0
        },
        recentPractices: recentPractices.map(p => ({
          id: p._id,
          title: p.title,
          type: p.type,
          category: p.category,
          completed: p.completed,
          accuracy: p.accuracy,
          timeStarted: p.timeStarted
        }))
      }
    }));
  } catch (error) {
    console.error('Error in GET /api/statistics:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
} 