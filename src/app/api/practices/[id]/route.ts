import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connect from '@/lib/db';
import Practice from '@/models/Practice';
import Question from '@/models/Question';
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

// 获取单个练习记录
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to the database
    await connect();
    
    // Find practice by ID
    const practice = await Practice.findOne({
      _id: params.id
    });

    if (!practice) {
      return NextResponse.json(
        { error: "Practice not found" },
        { status: 404 }
      );
    }
    
    // Get question details
    const questionIds = practice.questions.map(q => q.questionId);
    
    // 从标准题库获取题目
    const standardQuestions = await Question.find({ 
      _id: { $in: questionIds } 
    }).select('-answer -explanation');
    
    // 从自定义题库获取题目
    const customQuestions = await CustomQuestion.find({
      _id: { $in: questionIds }
    }).select('-answer -explanation');
    
    // 合并题目信息
    const questions = [
      ...standardQuestions.map(q => ({ ...q.toObject(), isCustom: false })),
      ...customQuestions.map(q => ({ 
        _id: q._id,
        title: q.subject,
        content: q.content,
        type: q.type === 'multiple_choice' ? 'choice' : q.type === 'fill_blank' ? 'fill' : 'short_answer',
        options: q.options ? q.options.map((opt, index) => ({
          label: String.fromCharCode(65 + index), // A, B, C...
          text: opt
        })) : [],
        difficulty: 'medium', // 默认难度
        category: q.subject,
        isCustom: true
      }))
    ];
    
    // Merge question information with practice record
    const questionsWithDetail = practice.questions.map(practiceQuestion => {
      const questionDetail = questions.find(q => 
        q._id.toString() === practiceQuestion.questionId.toString()
      );
      
      return {
        ...practiceQuestion.toObject(),
        questionDetail: questionDetail || null
      };
    });
    
    return NextResponse.json({
      ...practice.toObject(),
      questions: questionsWithDetail
    });
  } catch (error) {
    console.error("Error fetching practice:", error);
    return NextResponse.json(
      { error: "Failed to fetch practice" },
      { status: 500 }
    );
  }
}

// 更新练习记录（例如提交答案）
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    let userId;
    const { id } = params;
    const data = await request.json();
    
    // 检查请求中是否包含userId
    if (data.userId) {
      userId = data.userId;
    } else {
      // 如果没有提供userId，则检查用户是否已登录
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = session.user.id;
    }
    
    await connect();
    
    // 如果提供了userId参数，仅根据ID查找，否则同时检查userId
    const query = data.userId 
      ? { _id: id }
      : { _id: id, userId };
    
    const practice = await Practice.findOne(query);
    
    if (!practice) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 });
    }
    
    // 更新练习记录
    if (data.answers) {
      // 提交答案
      const { answers } = data;
      
      // 获取所有题目的答案
      const questionIds = practice.questions.map(q => q.questionId);
      
      // 从标准题库获取题目
      const standardQuestions = await Question.find({ 
        _id: { $in: questionIds } 
      });
      
      // 从自定义题库获取题目
      const customQuestions = await CustomQuestion.find({
        _id: { $in: questionIds }
      });
      
      // 合并题目信息
      const questions = [
        ...standardQuestions.map(q => ({ ...q.toObject(), isCustom: false })),
        ...customQuestions.map(q => ({ 
          _id: q._id,
          answer: q.answer,
          isCustom: true
        }))
      ];
      
      let correctCount = 0;
      
      // 更新每道题的答案和是否正确
      practice.questions = practice.questions.map(practiceQuestion => {
        const questionId = practiceQuestion.questionId.toString();
        if (!answers[questionId]) return practiceQuestion;
        
        const question = questions.find(q => q._id.toString() === questionId);
        if (!question) return practiceQuestion;
        
        // 检查答案是否正确
        let isCorrect = false;
        const userAnswer = answers[questionId];
        
        if (Array.isArray(question.answer)) {
          // 多选题
          if (Array.isArray(userAnswer)) {
            // 排序两个数组，确保顺序不同但内容相同的答案也能被判定为正确
            const sortedCorrectAnswer = [...question.answer].sort();
            const sortedUserAnswer = [...userAnswer].sort();
            
            // 检查长度是否相同
            if (sortedCorrectAnswer.length === sortedUserAnswer.length) {
              // 检查每个元素是否相同
              isCorrect = sortedCorrectAnswer.every((ans, index) => ans === sortedUserAnswer[index]);
            }
          }
        } else {
          // 单选题、判断题、填空题或编程题
          isCorrect = question.answer === userAnswer;
          
          // 如果不相等，尝试更宽松的比较
          if (!isCorrect) {
            console.log('严格比较不相等，尝试更宽松比较');
            isCorrect = String(question.answer).trim() === String(userAnswer).trim();
          }
        }
        
        if (isCorrect) correctCount++;
        
        return {
          ...practiceQuestion.toObject(),
          isCorrect,
          userAnswer
        };
      });
      
      // 更新练习记录
      practice.correctCount = correctCount;
      practice.accuracy = (correctCount / practice.totalQuestions) * 100;
      practice.timeCompleted = new Date();
      practice.completed = true;
    } else if (data.status === 'completed') {
      // 手动完成练习
      practice.timeCompleted = new Date();
      practice.completed = true;
    }
    
    await practice.save();
    
    return NextResponse.json({
      message: 'Practice updated successfully',
      practice
    });
  } catch (error) {
    console.error('Error updating practice:', error);
    return NextResponse.json({ error: 'Failed to fetch practice' }, { status: 500 });
  }
} 