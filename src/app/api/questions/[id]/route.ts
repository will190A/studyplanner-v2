import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connect from '@/lib/db';
import Question from '@/models/Question';
import CustomQuestion from '@/models/CustomQuestion';

// 获取单个题目
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 不再强制要求登录
    const { id } = params;
    
    await connect();
    
    // 先尝试从标准题库获取题目
    let question = await Question.findById(id);
    let isCustomQuestion = false;
    
    // 如果在标准题库中找不到，尝试从自定义题库获取
    if (!question) {
      question = await CustomQuestion.findById(id);
      isCustomQuestion = true;
      
      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }
      
      // 转换自定义题目格式
      question = {
        ...question.toObject(),
        title: question.subject,
        type: question.type === 'multiple_choice' ? 'choice' : 
              question.type === 'fill_blank' ? 'fill' : 'short_answer',
        options: question.options ? question.options.map((opt: string, index: number) => ({
          label: String.fromCharCode(65 + index),
          text: opt
        })) : [],
        difficulty: 'medium',
        category: question.subject,
        isCustom: true
      };
    }
    
    // 可以根据需求返回或隐藏答案和解析
    const { searchParams } = new URL(request.url);
    const showAnswer = searchParams.get('showAnswer') === 'true';
    
    if (!showAnswer) {
      // 不返回答案和解析
      const { answer, explanation, ...questionData } = question;
      return NextResponse.json(questionData);
    }
    
    return NextResponse.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 });
  }
}

// 更新题目（仅管理员可用）
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 这里可以添加管理员权限检查
    // if (!isAdmin(session)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }
    
    const { id } = params;
    const data = await request.json();
    
    await connect();
    
    const question = await Question.findById(id);
    
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    // 更新题目
    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    
    return NextResponse.json({ message: 'Question updated successfully', question: updatedQuestion });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

// 删除题目（仅管理员可用）
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 这里可以添加管理员权限检查
    // if (!isAdmin(session)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }
    
    const { id } = params;
    
    await connect();
    
    const question = await Question.findById(id);
    
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    // 删除题目
    await Question.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
} 