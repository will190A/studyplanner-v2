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
    let correctAnswer = null;

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
    
    // 记录更多调试信息
    console.log('问题类型详细:', question.type);
    console.log('题目选项:', question.options);
    console.log('正确答案类型:', typeof question.answer);
    console.log('用户答案类型:', typeof userAnswer);
    
    // 自定义题目处理逻辑
    if (isCustomQuestion) {
      // 如果是multiple_choice类型（单选题），预处理答案格式
      if (question.type === 'multiple_choice' && question.options) {
        // 如果答案是选项文本而不是字母，转换为字母格式
        const optionIndex = question.options.findIndex((opt: string) => opt === question.answer);
        if (optionIndex >= 0) {
          correctAnswer = String.fromCharCode(65 + optionIndex);
          console.log('将原始答案转换为字母格式:', {
            originalAnswer: question.answer,
            convertedAnswer: correctAnswer
          });
        } else {
          // 如果答案已经是字母格式，保持不变
          correctAnswer = question.answer;
        }
      } else {
        // 其他类型题目保持原始答案
        correctAnswer = question.answer;
      }
      
      console.log('自定义题目最终处理后的答案:', correctAnswer);
      
      // 处理多选题 - 答案格式如 "A,B,C" 或 "A|B|C"
      if (question.answer.includes(',') || question.answer.includes('|')) {
        const separator = question.answer.includes(',') ? ',' : '|';
        const correctAnswerArray = question.answer.split(separator).map((a: string) => a.trim());
        
        if (Array.isArray(userAnswer)) {
          // 排序两个数组进行比较
          const sortedCorrectAnswer = [...correctAnswerArray].sort();
          const sortedUserAnswer = [...userAnswer].sort();
          isCorrect = sortedCorrectAnswer.length === sortedUserAnswer.length &&
            sortedCorrectAnswer.every((ans, index) => ans === sortedUserAnswer[index]);
        } else if (typeof userAnswer === 'string') {
          // 如果用户答案是单个字符串，但可能包含多个选项
          const userAnswerArray = userAnswer.includes(',') || userAnswer.includes('|') ? 
            userAnswer.replace(/[,|]/g, ',').split(',').map(a => a.trim()) : 
            [userAnswer.trim()];
          
          const sortedCorrectAnswer = [...correctAnswerArray].sort();
          const sortedUserAnswer = [...userAnswerArray].sort();
          isCorrect = sortedCorrectAnswer.length === sortedUserAnswer.length &&
            sortedCorrectAnswer.every((ans, index) => ans === sortedUserAnswer[index]);
        }
        
        console.log('多选题比较:', { correctAnswerArray, userAnswer, isCorrect });
      } 
      // 处理单选题
      else if (question.type === 'multiple_choice') {
        console.log('处理自定义单选题 multiple_choice');
        
        if (typeof userAnswer === 'string') {
          // 直接比较字母答案
          isCorrect = userAnswer.toUpperCase() === correctAnswer.toUpperCase();
          console.log('字母直接比较:', { userAnswer, correctAnswer, isCorrect });
          
          // 如果不匹配且用户答案可能是选项内容
          if (!isCorrect && question.options && question.options.length > 0) {
            // 检查用户是否输入了选项内容而不是字母
            const userOptionIndex = question.options.findIndex((opt: string) => opt === userAnswer);
            if (userOptionIndex >= 0) {
              const userLetterFromContent = String.fromCharCode(65 + userOptionIndex);
              isCorrect = userLetterFromContent.toUpperCase() === correctAnswer.toUpperCase();
              console.log('用户内容转字母比较:', {
                userContent: userAnswer,
                userLetterFromContent,
                correctAnswer,
                isCorrect
              });
            }
          }
        }
      } else {
        // 其他类型的自定义题目
        isCorrect = userAnswer === correctAnswer;
        console.log('其他类型直接比较:', { userAnswer, correctAnswer, isCorrect });
      }
    } 
    // 标准题库处理逻辑
    else if (Array.isArray(question.answer)) {
      // 多选题
      correctAnswer = question.answer;
      if (Array.isArray(userAnswer)) {
        // 排序两个数组，确保顺序不同但内容相同的答案也能被判定为正确
        const sortedCorrectAnswer = [...question.answer].sort();
        const sortedUserAnswer = [...userAnswer].sort();
        isCorrect = sortedCorrectAnswer.length === sortedUserAnswer.length &&
          sortedCorrectAnswer.every((ans, index) => ans === sortedUserAnswer[index]);
      }
    } else {
      // 单选题、判断题、填空题或编程题
      correctAnswer = question.answer;
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
              category: isCustomQuestion ? question.subject : question.category,
              isCustom: isCustomQuestion // 确保设置 isCustom 字段
            }
          },
          { 
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
          }
        );
        console.log('更新或创建错题记录:', mistake._id);
        console.log('错题详情:', {
          userId,
          questionId: question._id,
          isCustom: isCustomQuestion,
          category: isCustomQuestion ? question.subject : question.category,
          status: 'unresolved'
        });
      } catch (error) {
        console.error('保存错题时出错:', error);
        // 不要因为保存错题失败而影响答案验证结果
      }
    }

    // 最终调试输出
    console.log('最终结果:', { 
      isCorrect, 
      correctAnswer: isCorrect ? null : correctAnswer,
      explanation: question.explanation || '暂无解析'
    });

    return NextResponse.json({
      isCorrect,
      correctAnswer: isCorrect ? null : correctAnswer,
      explanation: question.explanation || '暂无解析' // 无论正确与否都返回解释
    });
  } catch (error) {
    console.error('验证答案时出错:', error);
    return NextResponse.json({ error: 'Failed to verify answer' }, { status: 500 });
  }
} 