import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connect from '@/lib/db';
import Mistake from '@/models/Mistake';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { updates } = await request.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: '无效的更新数据' },
        { status: 400 }
      );
    }

    console.log('收到错题状态更新请求:', {
      userId,
      updatesCount: updates.length,
      updates
    });

    await connect();

    // 批量更新错题状态
    const updatePromises = updates.map(async ({ questionId, status }) => {
      try {
        console.log(`正在更新错题状态: questionId=${questionId}, status=${status}`);
        
        const result = await Mistake.findOneAndUpdate(
          {
            userId,
            questionId,
            status: { $ne: status } // 只更新状态不同的记录
          },
          {
            $set: { status }
          },
          { new: true }
        );
        
        if (result) {
          console.log(`成功更新错题状态: questionId=${questionId}, status=${status}`);
        } else {
          console.log(`错题状态未变化: questionId=${questionId}, status=${status}`);
        }
        
        return result;
      } catch (error) {
        console.error(`更新错题状态失败: questionId=${questionId}, status=${status}`, error);
        return null;
      }
    });

    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(result => result !== null);

    console.log('错题状态更新完成:', {
      totalUpdates: updates.length,
      successfulUpdates: successfulUpdates.length,
      failedUpdates: updates.length - successfulUpdates.length
    });

    return NextResponse.json({
      success: true,
      message: `成功更新 ${successfulUpdates.length} 道错题状态`,
      updated: successfulUpdates,
      stats: {
        total: updates.length,
        successful: successfulUpdates.length,
        failed: updates.length - successfulUpdates.length
      }
    });
  } catch (error) {
    console.error('批量更新错题状态失败:', error);
    return NextResponse.json(
      { error: '批量更新错题状态失败' },
      { status: 500 }
    );
  }
} 