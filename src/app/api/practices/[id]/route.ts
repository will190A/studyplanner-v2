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

interface PracticeQuestion {
  questionId: string;
  userAnswer?: string;
  isCorrect?: boolean;
  toObject?: () => any;
}

interface Question {
  _id: string;
  content: string;
  type: string;
  options?: string[];
  answer: string;
  explanation?: string;
  isCustom?: boolean;
  toObject?: () => any;
  subject?: string;
}

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
    const questionIds = practice.questions.map((q: PracticeQuestion) => q.questionId);
    
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
      ...standardQuestions.map((q: Question) => ({ 
        ...(q.toObject ? q.toObject() : q), 
        isCustom: false 
      })),
      ...customQuestions.map((q: Question) => ({
        _id: q._id,
        answer: q.answer,
        isCustom: true
      }))
    ];
    
    // Merge question information with practice record
    const questionsWithDetail = practice.questions.map((practiceQuestion: PracticeQuestion) => {
      const questionDetail = questions.find(q =>
        q._id.toString() === practiceQuestion.questionId.toString()
      );
      
      return {
        ...(practiceQuestion.toObject ? practiceQuestion.toObject() : practiceQuestion),
        questionDetail: questionDetail || null
      };
    });
    
    return NextResponse.json({
      ...(practice.toObject ? practice.toObject() : practice),
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
      const questionIds = practice.questions.map((q: PracticeQuestion) => q.questionId);
      
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
        ...standardQuestions.map((q: Question) => ({ ...q.toObject(), isCustom: false })),
        ...customQuestions.map((q: Question) => ({ 
          _id: q._id,
          answer: q.answer,
          isCustom: true
        }))
      ];
      
      console.log('更新练习 - 原始数据:', {
        practiceId: id,
        answers,
        questionsInDb: questions.length,
        userAnswers: Object.keys(answers).length
      });
      
      // 使用客户端提供的结果
      let correctCount = 0;
      
      // 更新每道题的答案和是否正确
      practice.questions = practice.questions.map(practiceQuestion => {
        const questionId = practiceQuestion.questionId.toString();
        const answerInfo = answers.find(a => a.questionId === questionId);
        
        if (!answerInfo) {
          return practiceQuestion;
        }
        
        // 使用客户端提供的正确性结果
        const isCorrect = answerInfo.isCorrect;
        
        // 更新正确题目计数
        if (isCorrect) {
          correctCount++;
        }
        
        console.log(`题目 ${questionId} 结果:`, {
          userAnswer: answerInfo.answer,
          isCorrect: isCorrect
        });
        
        return {
          ...practiceQuestion.toObject(),
          isCorrect,
          userAnswer: answerInfo.answer
        };
      });
      
      // 更新练习记录
      practice.correctCount = correctCount;
      practice.accuracy = data.accuracy || (correctCount / practice.totalQuestions) * 100;
      practice.timeCompleted = new Date();
      practice.completed = true;
      
      // 打印调试信息
      console.log('练习更新信息:', {
        totalQuestions: practice.totalQuestions,
        correctCount,
        accuracy: practice.accuracy
      });
    } else if (data.status === 'completed') {
      // 手动完成练习
      practice.timeCompleted = new Date();
      practice.completed = true;
    } else if (data.completed !== undefined) {
      // 直接从客户端更新练习状态
      practice.completed = data.completed;
      
      if (data.correctCount !== undefined) {
        practice.correctCount = data.correctCount;
      }
      
      if (data.accuracy !== undefined) {
        practice.accuracy = data.accuracy;
      }
      
      if (data.timeCompleted) {
        practice.timeCompleted = new Date(data.timeCompleted);
      }
    }
    
    await practice.save();
    
    // 确保返回的数据包含正确的正确率
    const updatedPractice = await Practice.findById(practice._id);
    
    return NextResponse.json({
      message: 'Practice updated successfully',
      practice: {
        ...(updatedPractice.toObject ? updatedPractice.toObject() : updatedPractice),
        correctCount: updatedPractice.correctCount,
        accuracy: updatedPractice.accuracy
      }
    });
  } catch (error) {
    console.error('Error updating practice:', error);
    return NextResponse.json({ error: 'Failed to update practice' }, { status: 500 });
  }
} 