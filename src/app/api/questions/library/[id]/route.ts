import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connect from '@/lib/db';
import CustomQuestion from '@/models/CustomQuestion';
import Mistake from '@/models/Mistake';

// 删除自定义题目
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connect();
    
    const questionId = params.id;
    
    // 查找题目
    const question = await CustomQuestion.findById(questionId);
    
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    // 验证用户是否拥有此题目
    if (question.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // 删除题目（这会触发 pre-remove 钩子，自动删除相关的错题记录）
    await question.remove();
    
    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
} 