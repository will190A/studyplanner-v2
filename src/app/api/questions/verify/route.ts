import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connect from '@/lib/db';
import Question from '@/models/Question';
import Mistake from '@/models/Mistake';
import CustomQuestion from '@/models/CustomQuestion';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { questionId, userAnswer } = data;

    if (!questionId || userAnswer === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connect();

    // 尝试从标准题库获取题目
    let question = await Question.findById(questionId);
    let isCustomQuestion = false;

    // 如果在标准题库中找不到，尝试从自定义题库获取
    if (!question) {
      question = await CustomQuestion.findById(questionId);
      isCustomQuestion = true;

      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }
    }

    // 记录调试信息
    console.log('问题ID:', questionId);
    console.log('问题类型:', isCustomQuestion ? '自定义题目' : '标准题目');
    console.log('正确答案:', question.answer);
    console.log('用户答案:', userAnswer);

    // 检查答案是否正确
    let isCorrect = false;
    if (Array.isArray(question.answer)) {
      // 多选题
      if (Array.isArray(userAnswer)) {
        // 排序两个数组，确保顺序不同但内容相同的答案也能被判定为正确
        const sortedCorrectAnswer = [...question.answer].sort();
        const sortedUserAnswer = [...userAnswer].sort();
        isCorrect = sortedCorrectAnswer.length === sortedUserAnswer.length &&
          sortedCorrectAnswer.every((ans, index) => ans === sortedUserAnswer[index]);
      }
    } else {
      // 单选题、判断题、填空题或编程题
      isCorrect = question.answer === userAnswer;
    }

    // 如果答案不正确，记录错题
    if (!isCorrect) {
      try {
        // 使用 upsert 操作来更新或创建错题记录
        const mistake = await Mistake.findOneAndUpdate(
          { 
            userId, 
            questionId: question._id,
            isCustom: isCustomQuestion
          },
          {
            $inc: { wrongCount: 1 },
            $set: { 
              lastWrongDate: new Date(),
              wrongAnswer: userAnswer,
              status: 'unresolved',
              category: isCustomQuestion ? question.subject : question.category
            }
          },
          { 
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
          }
        );
        console.log('更新或创建错题记录:', mistake._id);
      } catch (error) {
        console.error('保存错题时出错:', error);
        // 不要因为保存错题失败而影响答案验证结果
      }
    }

    return NextResponse.json({
      isCorrect,
      correctAnswer: isCorrect ? null : question.answer,
      explanation: question.explanation || '暂无解析' // 无论正确与否都返回解释
    });
  } catch (error) {
    console.error('验证答案时出错:', error);
    return NextResponse.json({ error: 'Failed to verify answer' }, { status: 500 });
  }
} 