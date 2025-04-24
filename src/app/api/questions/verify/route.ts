import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connect from '@/lib/db';
import Question from '@/models/Question';
import Mistake from '@/models/Mistake';
import mongoose from 'mongoose';

// 定义CustomQuestion模型
const customQuestionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ["multiple_choice", "fill_blank", "short_answer"] },
  content: { type: String, required: true },
  options: [String],
  answer: { type: String, required: true },
  explanation: { type: String },
  subject: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

// 确保模型只被创建一次
const CustomQuestion = mongoose.models.CustomQuestion || 
  mongoose.model("CustomQuestion", customQuestionSchema);

export async function POST(request: Request) {
  try {
    let userId;
    const data = await request.json();
    const { questionId, userAnswer, userId: requestUserId } = data;
    
    // 检查请求中是否包含userId
    if (requestUserId) {
      userId = requestUserId;
    } else {
      // 如果没有提供userId，则检查用户是否已登录
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = session.user.id;
    }
    
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
    console.log('问题类型:', isCustomQuestion ? question.type : question.type);
    console.log('正确答案:', question.answer);
    console.log('用户答案:', userAnswer);
    console.log('正确答案类型:', typeof question.answer);
    console.log('用户答案类型:', typeof userAnswer);
    
    // 检查答案是否正确
    let isCorrect = false;
    
    if (Array.isArray(question.answer)) {
      // 多选题
      console.log('多选题答案验证');
      if (Array.isArray(userAnswer)) {
        // 排序两个数组，确保顺序不同但内容相同的答案也能被判定为正确
        const sortedCorrectAnswer = [...question.answer].sort();
        const sortedUserAnswer = [...userAnswer].sort();
        
        console.log('排序后正确答案:', sortedCorrectAnswer);
        console.log('排序后用户答案:', sortedUserAnswer);
        
        // 检查长度是否相同
        if (sortedCorrectAnswer.length === sortedUserAnswer.length) {
          // 检查每个元素是否相同
          isCorrect = sortedCorrectAnswer.every((ans, index) => ans === sortedUserAnswer[index]);
          console.log('数组长度相同，逐个比较结果:', isCorrect);
        }
      }
    } else {
      // 单选题、判断题、填空题或编程题
      console.log('单选/判断/填空题答案验证');
      isCorrect = question.answer === userAnswer;
      console.log('严格比较结果:', isCorrect);
      
      // 如果不相等，尝试更宽松的比较
      if (!isCorrect) {
        console.log('严格比较不相等，尝试更宽松比较');
        const trimmedCorrect = String(question.answer).trim();
        const trimmedUser = String(userAnswer).trim();
        console.log('修剪后正确答案:', trimmedCorrect);
        console.log('修剪后用户答案:', trimmedUser);
        isCorrect = trimmedCorrect === trimmedUser;
        console.log('宽松比较结果:', isCorrect);
      }
    }
    
    console.log('最终是否正确:', isCorrect);
    
    // 如果答案不正确，记录错题
    if (!isCorrect) {
      const existingMistake = await Mistake.findOne({ 
        userId, 
        questionId: question._id 
      });
      
      if (existingMistake) {
        // 更新已有错题记录
        existingMistake.wrongCount += 1;
        existingMistake.lastWrongDate = new Date();
        existingMistake.wrongAnswer = userAnswer;
        existingMistake.status = 'unresolved';
        await existingMistake.save();
      } else {
        // 创建新的错题记录
        const mistake = new Mistake({
          userId,
          questionId: question._id,
          category: isCustomQuestion ? question.subject : question.category,
          wrongAnswer: userAnswer,
          status: 'unresolved'
        });
        await mistake.save();
      }
    }
    
    return NextResponse.json({
      isCorrect,
      correctAnswer: isCorrect ? null : question.answer,
      explanation: question.explanation || '暂无解析' // 无论正确与否都返回解释
    });
  } catch (error) {
    console.error('Error verifying answer:', error);
    return NextResponse.json({ error: 'Failed to verify answer' }, { status: 500 });
  }
} 