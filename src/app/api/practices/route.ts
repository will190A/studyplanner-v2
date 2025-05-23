import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connect from '@/lib/db';
import Question from '@/models/Question';
import Practice from '@/models/Practice';
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

// 获取用户练习记录
export async function GET(request: Request) {
  try {
    let userId;
    const { searchParams } = new URL(request.url);
    
    // 检查是否在查询参数中提供了userId
    const queryUserId = searchParams.get('userId');
    if (queryUserId) {
      userId = queryUserId;
    } else {
      // 如果没有提供userId，则检查用户是否已登录
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = session.user.id;
    }
    
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const type = searchParams.get('type');
    
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    const query: any = { userId };
    if (type) query.type = type;
    
    await connect();
    
    // 计算总数
    const total = await Practice.countDocuments(query);
    
    // 获取练习记录列表
    const practices = await Practice.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    return NextResponse.json({
      practices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching practices:', error);
    return NextResponse.json({ error: 'Failed to fetch practices' }, { status: 500 });
  }
}

// 创建新练习
export async function POST(request: Request) {
  try {
    let userId;
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
    
    const { type, category, count = 10, isCustom = false } = data;
    
    if (!type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    await connect();
    
    // 获取题目列表
    let questions;
    
    try {
      switch (type) {
        case 'daily':
          // 每日一练：随机选择不同类型的题目
          questions = await Question.aggregate([
            { $sample: { size: count } },
            { $project: { answer: 0, explanation: 0 } }
          ]);
          break;
          
        case 'category':
          // 分类练习：根据指定分类选择题目
          if (!category) {
            return NextResponse.json({ error: 'Category is required for category practice' }, { status: 400 });
          }
          
          if (isCustom) {
            // 从自定义题库中获取题目
            const customQuestions = await CustomQuestion.find({ 
              userId, 
              subject: category 
            }).lean();
            
            if (customQuestions.length === 0) {
              return NextResponse.json({ error: '未找到相关题目，请先添加题目到该题库' }, { status: 404 });
            }
            
            // 如果题库中的题目数量少于请求的数量，使用实际题目数量
            const actualCount = Math.min(customQuestions.length, count);
            
            // 随机选择题目
            const selectedQuestions = customQuestions
              .sort(() => Math.random() - 0.5)
              .slice(0, actualCount);
            
            // 转换自定义题目为标准格式
            questions = (selectedQuestions as unknown as Array<{
              _id: mongoose.Types.ObjectId;
              subject: string;
              content: string;
              type: 'multiple_choice' | 'fill_blank' | 'short_answer';
              options?: string[];
              answer: string;
              explanation?: string;
            }>).map(q => ({
              _id: q._id,
              title: q.subject,
              content: q.content,
              type: q.type === 'multiple_choice' ? 'choice' : q.type === 'fill_blank' ? 'fill' : 'short_answer',
              options: q.options ? q.options.map((opt: string, index: number) => ({
                label: String.fromCharCode(65 + index), // A, B, C...
                text: opt
              })) : [],
              answer: q.answer,
              explanation: q.explanation || '暂无解析'
            }));
          } else {
            // 从专业题库中获取题目
            questions = await Question.find({ category })
              .limit(count)
              .lean();
            
            if (questions.length === 0) {
              return NextResponse.json({ error: '未找到相关题目' }, { status: 404 });
            }
          }
          break;
          
        case 'review':
          // 错题复习：从用户的错题中选择题目
          if (data.questionIds && Array.isArray(data.questionIds)) {
            // 如果提供了具体的题目ID列表，直接使用这些ID
            const questionIds = data.questionIds.map((id: string) => new mongoose.Types.ObjectId(id));
            
            // 分别获取标准题目和自定义题目
            const standardQuestions = await Question.find({
              _id: { $in: questionIds }
            }).select('-answer -explanation');
            
            const customQuestions = await CustomQuestion.find({
              _id: { $in: questionIds }
            }).select('-answer -explanation');
            
            // 合并题目列表
            questions = [
              ...standardQuestions,
              ...customQuestions.map(q => ({
                _id: new mongoose.Types.ObjectId(q._id),
                title: q.subject,
                content: q.content,
                type: q.type === 'multiple_choice' ? 'choice' : q.type === 'fill_blank' ? 'fill' : 'short_answer',
                options: q.options ? q.options.map((opt: string, index: number) => ({
                  label: String.fromCharCode(65 + index),
                  text: opt
                })) : [],
                difficulty: 'medium',
                category: q.subject
              }))
            ];
          } else {
            // 否则使用原来的逻辑，但移除limit限制
            const mistakes = await Mistake.find({ 
              userId, 
              status: { $in: ['unresolved', 'reviewing'] } 
            }).sort({ lastWrongDate: -1 });
            
            const questionIds = mistakes.map(mistake => new mongoose.Types.ObjectId(mistake.questionId));
            
            // 分别获取标准题目和自定义题目
            const standardQuestions = await Question.find({
              _id: { $in: questionIds }
            }).select('-answer -explanation');
            
            const customQuestions = await CustomQuestion.find({
              _id: { $in: questionIds }
            }).select('-answer -explanation');
            
            // 合并题目列表
            questions = [
              ...standardQuestions,
              ...customQuestions.map(q => ({
                _id: new mongoose.Types.ObjectId(q._id),
                title: q.subject,
                content: q.content,
                type: q.type === 'multiple_choice' ? 'choice' : q.type === 'fill_blank' ? 'fill' : 'short_answer',
                options: q.options ? q.options.map((opt: string, index: number) => ({
                  label: String.fromCharCode(65 + index),
                  text: opt
                })) : [],
                difficulty: 'medium',
                category: q.subject
              }))
            ];
          }
          break;
          
        case 'random':
          // 随机练习：从所有题库中随机选择题目
          // 获取用户的自定义题库
          const customQuestions = await CustomQuestion.find({ userId });
          
          // 获取专业题库
          const standardQuestions = await Question.find();
          
          // 合并所有可用题目
          const allQuestions = [
            ...standardQuestions.map(q => ({ ...q.toObject(), isCustom: false })),
            ...customQuestions.map(q => ({ 
              _id: new mongoose.Types.ObjectId(q._id),
              title: q.subject,
              content: q.content,
              type: q.type === 'multiple_choice' ? 'choice' : q.type === 'fill_blank' ? 'fill' : 'short_answer',
              options: q.options ? q.options.map((opt: string, index: number) => ({
                label: String.fromCharCode(65 + index),
                text: opt
              })) : [],
              answer: q.answer,
              explanation: q.explanation || '暂无解析',
              isCustom: true
            }))
          ];

          if (allQuestions.length === 0) {
            return NextResponse.json({ error: 'No questions available' }, { status: 404 });
          }

          // 随机选择题目
          questions = allQuestions
            .sort(() => Math.random() - 0.5)
            .slice(0, count);
          break;
          
        default:
          return NextResponse.json({ error: 'Invalid practice type' }, { status: 400 });
      }
      
      // 如果没有找到题目
      if (!questions || questions.length === 0) {
        return NextResponse.json({ error: '未找到题目' }, { status: 404 });
      }
      
      // 创建练习记录
      const title = type === 'daily' 
        ? `每日一练 - ${new Date().toLocaleDateString('zh-CN')}` 
        : type === 'category' 
          ? `${category}专项练习` 
          : type === 'review' 
            ? '错题复习' 
            : '随机练习';
      
      const practice = new Practice({
        userId,
        title,
        type,
        questions: questions.map(q => ({
          questionId: q._id,
          isCorrect: false
        })),
        totalQuestions: questions.length,
        correctCount: 0,
        accuracy: 0,
        timeStarted: new Date(),
        completed: false,
        category: category || undefined
      });
      
      await practice.save();
      
      return NextResponse.json({
        message: 'Practice created successfully',
        practice: {
          ...practice.toObject(),
          questions: questions
        }
      }, { status: 201 });
    } catch (error) {
      console.error('Error processing questions:', error);
      return NextResponse.json({ error: 'Failed to process questions' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating practice:', error);
    return NextResponse.json({ error: 'Failed to create practice' }, { status: 500 });
  }
} 