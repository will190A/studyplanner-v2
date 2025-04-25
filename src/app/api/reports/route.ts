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
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7'; // 默认7天
    
    // 连接数据库
    await connect();
    
    // 计算日期范围
    const endDate = new Date();
    const startDate = new Date();
    
    // 根据不同的时间段设置开始日期
    if (period === 'year') {
      // 如果是近一年，设置开始日期为12个月前
      startDate.setMonth(endDate.getMonth() - 12);
    } else {
      // 否则根据period计算日期范围
      startDate.setDate(endDate.getDate() - parseInt(period));
    }
    
    // 获取日期范围内的练习记录
    const practices = await Practice.find({
      userId,
      timeStarted: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    // 计算掌握程度（按分类统计）
    const categoryStats = new Map();
    practices.forEach(practice => {
      if (practice.completed) {
        const category = practice.category || '其他';
        if (!categoryStats.has(category)) {
          categoryStats.set(category, {
            total: 0,
            correct: 0,
            accuracy: 0
          });
        }
        const stats = categoryStats.get(category);
        stats.total += practice.totalQuestions;
        stats.correct += practice.correctCount;
        stats.accuracy = (stats.correct / stats.total) * 100;
      }
    });
    
    // 计算练习趋势（按日期统计）
    const dailyStats = new Map();
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyStats.set(dateStr, {
        count: 0,
        accuracy: 0,
        time: 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    practices.forEach(practice => {
      const dateStr = new Date(practice.timeStarted).toISOString().split('T')[0];
      if (dailyStats.has(dateStr)) {
        const stats = dailyStats.get(dateStr);
        stats.count++;
        if (practice.completed) {
          stats.accuracy = (stats.accuracy * (stats.count - 1) + practice.accuracy) / stats.count;
          if (practice.timeStarted && practice.timeCompleted) {
            const duration = new Date(practice.timeCompleted).getTime() - new Date(practice.timeStarted).getTime();
            stats.time += Math.round(duration / 60000); // 转换为分钟
          }
        }
      }
    });
    
    // 获取薄弱点排名
    const weakPoints = Array.from(categoryStats.entries())
      .map(([category, stats]) => ({
        category,
        accuracy: stats.accuracy
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);
    
    // 计算学习统计
    const totalPractices = practices.length;
    const completedPractices = practices.filter(p => p.completed);
    const averageAccuracy = completedPractices.length > 0
      ? completedPractices.reduce((sum, p) => sum + p.accuracy, 0) / completedPractices.length
      : 0;
    
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
    let currentStreakDate = new Date(endDate);
    
    while (practiceDates.has(currentStreakDate.toISOString().split('T')[0])) {
      streak++;
      currentStreakDate.setDate(currentStreakDate.getDate() - 1);
    }
    
    return new Response(JSON.stringify({
      reports: {
        mastery: Array.from(categoryStats.entries()).map(([category, stats]) => ({
          category,
          accuracy: stats.accuracy
        })),
        trend: Array.from(dailyStats.entries()).map(([date, stats]) => ({
          date,
          count: stats.count,
          accuracy: stats.accuracy,
          time: stats.time
        })),
        weakPoints,
        statistics: {
          totalPractices,
          averageAccuracy,
          totalTime,
          streak
        }
      }
    }));
  } catch (error) {
    console.error('Error in GET /api/reports:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
} 