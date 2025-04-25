'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'
import QuestionCard from '@/components/QuestionCard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Clock, Check } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useToast } from "@/components/ui/use-toast"

interface Question {
  _id: string
  title: string
  content: string
  type: 'choice' | 'multiple' | 'judge' | 'fill' | 'code'
  options?: { label: string; text: string }[]
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
}

interface PracticeQuestion {
  questionId: string
  isCorrect: boolean
  userAnswer?: string | string[]
  questionDetail?: Question
}

interface Practice {
  _id: string
  title: string
  type: 'daily' | 'category' | 'review' | 'random'
  questions: PracticeQuestion[]
  totalQuestions: number
  correctCount: number
  accuracy: number
  timeStarted: string
  timeCompleted?: string
  completed: boolean
  category?: string
  createdAt: string
}

export default function PracticePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [practice, setPractice] = useState<Practice | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [correctAnswers, setCorrectAnswers] = useState<Record<string, string | string[]>>({})
  const [explanations, setExplanations] = useState<Record<string, string>>({})
  const [questionResults, setQuestionResults] = useState<Record<string, boolean>>({})
  const [selfJudgments, setSelfJudgments] = useState<Record<string, boolean>>({})
  
  // 开始计时器
  const [startTime] = useState(new Date())
  const [elapsedTime, setElapsedTime] = useState(0)
  
  // 获取当前用户ID - 如果已登录则使用实际ID，否则返回null
  const getUserId = () => {
    if (session?.user && 'id' in session.user) {
      return session.user.id as string;
    }
    return null;  // 未登录时返回 null
  };
  
  // 格式化时间
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // 计时器逻辑
  useEffect(() => {
    // 如果已完成，不启动计时器
    if (isCompleted) {
      return;
    }
    
    console.log('启动计时器，isCompleted =', isCompleted);
    
    // 创建计时器
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
    }, 1000);
    
    // 清理函数 - 组件卸载或依赖项变化时执行
    return () => {
      console.log('清理计时器，isCompleted =', isCompleted);
      clearInterval(timer);
    };
  }, [isCompleted, startTime]); // 依赖于isCompleted和startTime

  // 获取练习详情
  useEffect(() => {
    const fetchPractice = async () => {
      try {
        setLoading(true)
        
        // 获取当前用户ID
        const userId = getUserId();
        
        // 检查是否从错题本页面进入
        const isFromMistakes = sessionStorage.getItem('fromMistakes') === 'true';
        
        const response = await fetch(`/api/practices/${params.id}${userId ? `?userId=${userId}` : ''}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch practice');
        }
        
        const data = await response.json();
        console.log('获取到练习数据:', data);
        
        if (!data || !data._id) {
          throw new Error('Invalid practice data received');
        }
        
        setPractice(data);
        
        // 获取所有题目
        const practiceQuestions = data.questions
          .map((q: PracticeQuestion) => q.questionDetail)
          .filter((q: Question | null | undefined): q is Question => q !== null && q !== undefined);
        
        if (practiceQuestions.length === 0) {
          throw new Error('No questions found in practice');
        }
        
        setQuestions(practiceQuestions);
        
        // 如果练习已完成，获取所有的答案和解析并停止计时
        if (data.completed) {
          setIsCompleted(true);
          
          // 设置最终时间
          if (data.timeCompleted && data.timeStarted) {
            const startTime = new Date(data.timeStarted).getTime();
            const endTime = new Date(data.timeCompleted).getTime();
            const duration = Math.floor((endTime - startTime) / 1000);
            setElapsedTime(duration);
          }
          
          // 获取所有题目的正确答案和解析
          const questionIds = practiceQuestions.map((q: Question) => q._id);
          
          const answersData: Record<string, string | string[]> = {};
          const explanationsData: Record<string, string> = {};
          const questionResultsData: Record<string, boolean> = {};
          
          // 获取用户的答案和题目结果
          const userAnswers: Record<string, string | string[]> = {};
          data.questions.forEach((q: PracticeQuestion) => {
            if (q.userAnswer) {
              userAnswers[q.questionId] = q.userAnswer;
              questionResultsData[q.questionId] = q.isCorrect;
              console.log(`题目${q.questionId}实际状态:`, q.isCorrect);
            }
          });
          
          console.log('从服务器获取的用户答案:', userAnswers);
          console.log('从服务器获取的题目结果:', questionResultsData);
          
          // 设置答案和题目结果状态
          setAnswers(userAnswers);
          setQuestionResults(questionResultsData);
          
          // 从服务器获取正确答案和解析
          await Promise.all(questionIds.map(async (questionId) => {
            try {
              const answerResponse = await fetch(`/api/questions/${questionId}?showAnswer=true`);
              
              if (answerResponse.ok) {
                const questionData = await answerResponse.json();
                answersData[questionId] = questionData.answer;
                explanationsData[questionId] = questionData.explanation;
                
                // 设置所有答案为已揭示
                setRevealedAnswers(prev => ({
                  ...prev,
                  [questionId]: true
                }));
              }
            } catch (error) {
              console.error(`Error fetching answer for question ${questionId}:`, error);
            }
          }));
          
          setCorrectAnswers(answersData);
          setExplanations(explanationsData);
        }
        
        setLoading(false);
      } catch (error: any) {
        console.error('Error:', error);
        setError('获取练习失败，请重试');
        setLoading(false);
      }
    };
    
    fetchPractice();
  }, [params.id]);
  
  // 处理答案提交
  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }
  
  // 验证答案
  const verifyAnswer = async (questionId: string) => {
    try {
      const answer = answers[questionId]
      
      if (!answer) return
      
      // 获取当前用户ID
      const userId = getUserId();
      
      console.log(`验证答案 - 题目ID: ${questionId}, 用户答案:`, answer);
      
      const response = await fetch('/api/questions/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.id || ''}`
        },
        body: JSON.stringify({
          questionId,
          userAnswer: answer,
          userId
        })
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "验证失败",
            description: "请先登录后再进行练习",
            variant: "destructive"
          })
          return false
        }
        throw new Error('验证答案失败')
      }
      
      const data = await response.json()
      console.log('验证答案返回数据:', data);
      
      // 更新问题结果状态
      const isCorrect = data.isCorrect;
      setQuestionResults(prev => {
        const newResults = {
          ...prev,
          [questionId]: isCorrect
        };
        console.log('更新问题结果:', {
          questionId,
          isCorrect,
          allResults: newResults,
          totalQuestions: questions.length,
          correctCount: Object.values(newResults).filter(result => result).length
        });
        return newResults;
      });
      
      // 更新正确答案和解析
      setCorrectAnswers(prev => ({
        ...prev,
        [questionId]: data.correctAnswer
      }));
      
      setExplanations(prev => ({
        ...prev,
        [questionId]: data.explanation
      }));
      
      // 标记为已揭示
      setRevealedAnswers(prev => ({
        ...prev,
        [questionId]: true
      }));
      
      // 立即更新错题状态
      if (userId) {
        const mistakeResponse = await fetch('/api/mistakes/batch-update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userId}`
          },
          body: JSON.stringify({
            updates: [{
              questionId,
              status: isCorrect ? 'resolved' : 'reviewing'
            }]
          })
        });
        
        if (!mistakeResponse.ok) {
          console.error('Failed to update mistake status');
        } else {
          const mistakeData = await mistakeResponse.json();
          console.log('错题状态更新结果:', mistakeData);
        }
      }
      
      return isCorrect;
    } catch (error) {
      console.error('Error verifying answer:', error)
      toast({
        title: "验证失败",
        description: "请重试",
        variant: "destructive"
      })
      return false
    }
  }
  
  // 提交练习结果
  const submitPractice = async () => {
    try {
      setIsSubmitting(true);
      
      // 收集所有题目的结果，确保每个题目都有结果
      const finalQuestionResults = { ...questionResults };
      
      // 检查是否每个题目都有答案
      for (const question of questions) {
        const questionId = question._id;
        
        // 如果题目没有结果，但有答案，先验证
        if (finalQuestionResults[questionId] === undefined && answers[questionId] !== undefined) {
          console.log(`题目 ${questionId} 没有结果但有答案，进行验证`);
          
          // 构造问题结果
          const answer = answers[questionId];
          if (question.type === 'judge' || question.type === 'choice') {
            // 对于简单类型题目，与正确答案比较
            if (correctAnswers[questionId] !== undefined) {
              const isCorrect = correctAnswers[questionId] === answer;
              finalQuestionResults[questionId] = isCorrect;
              console.log(`题目 ${questionId} 直接比较结果:`, isCorrect);
            }
          } else if (selfJudgments[questionId] !== undefined) {
            // 使用自我判断结果
            finalQuestionResults[questionId] = selfJudgments[questionId];
            console.log(`题目 ${questionId} 使用自我判断结果:`, selfJudgments[questionId]);
          } else {
            // 默认为错误
            finalQuestionResults[questionId] = false;
            console.log(`题目 ${questionId} 没有结果或自我判断，默认为错误`);
          }
        }
      }
      
      // 计算正确率
      const totalQuestions = questions.length;
      const correctCount = Object.values(finalQuestionResults).filter(result => result).length;
      const correctRate = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
      
      console.log('提交练习最终结果:', {
        totalQuestions,
        correctCount,
        correctRate,
        allResults: finalQuestionResults,
        originalResults: questionResults
      });
      
      // 获取当前用户ID
      const userId = getUserId();
      
      // 转换答案格式 - 从对象映射转为数组格式
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
        isCorrect: finalQuestionResults[questionId] || false
      }));
      
      console.log('转换后的答案数组:', answersArray);
      
      // 更新练习记录
      const response = await fetch(`/api/practices/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`
        },
        body: JSON.stringify({
          completed: true,
          correctCount,
          accuracy: correctRate,
          timeCompleted: new Date().toISOString(),
          answers: answersArray
        })
      });
      
      if (!response.ok) {
        throw new Error('提交练习结果失败')
      }
      
      const data = await response.json()
      console.log('提交练习记录返回:', data);
      
      // 更新本地结果状态
      setQuestionResults(finalQuestionResults);
      
      toast({
        title: "练习完成！",
        description: `正确率: ${correctRate.toFixed(1)}% (${correctCount}/${totalQuestions})`,
        variant: "default"
      })
      
      // 更新练习状态
      setPractice(prev => ({
        ...prev!,
        completed: true,
        correctCount,
        accuracy: correctRate,
        timeCompleted: new Date().toISOString()
      }));
      setIsCompleted(true);
      
      // 更新所有问题的答案显示状态
      const newRevealedAnswers = questions.reduce((acc, question) => {
        acc[question._id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setRevealedAnswers(newRevealedAnswers);
      
      // 如果用户已登录，更新错题状态
      if (userId) {
        const mistakeUpdates = questions.map(question => ({
          questionId: question._id,
          status: finalQuestionResults[question._id] ? 'resolved' : 'reviewing'
        }));
        
        const mistakeResponse = await fetch('/api/mistakes/batch-update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userId}`
          },
          body: JSON.stringify({
            updates: mistakeUpdates
          })
        });
        
        if (!mistakeResponse.ok) {
          console.error('Failed to update mistake statuses');
        }
      }
      
    } catch (error) {
      console.error('Error submitting practice:', error)
      toast({
        title: "提交失败",
        description: "请重试",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // 跳转到下一题
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }
  
  // 跳转到上一题
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }
  
  // 跳转到指定题目
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index)
    }
  }
  
  // 计算正确率
  const calculateAccuracy = () => {
    if (!practice || !questions.length) return 0
    
    const correctCount = practice.questions.filter(q => q.isCorrect).length
    return (correctCount / questions.length) * 100
  }
  
  // 处理自我判断
  const handleSelfJudge = (questionId: string, judgment: boolean) => {
    setSelfJudgments(prev => ({
      ...prev,
      [questionId]: judgment
    }))
    setQuestionResults(prev => ({
      ...prev,
      [questionId]: judgment
    }))
  }
  
  // 完成练习
  const completePractice = async () => {
    try {
      setLoading(true)
      
      // 计算正确率
      const correctCount = Object.values(questionResults).filter(result => result).length;
      const accuracy = (correctCount / questions.length) * 100;
      
      // 更新练习记录
      const response = await fetch(`/api/practices/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          completed: true,
          correctCount,
          accuracy,
          timeCompleted: new Date()
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to complete practice')
      }
      
      // 更新错题状态
      const mistakeUpdates = questions.map((question, index) => {
        const isCorrect = questionResults[question._id];
        return {
          questionId: question._id,
          status: isCorrect ? 'resolved' : 'reviewing'
        };
      });
      
      // 批量更新错题状态
      const mistakeResponse = await fetch('/api/mistakes/batch-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          updates: mistakeUpdates
        })
      });
      
      if (!mistakeResponse.ok) {
        console.error('Failed to update mistake statuses');
      }
      
      // 更新本地状态
      setIsCompleted(true)
      setElapsedTime(0)
      
      // 显示完成提示
      toast({
        title: "练习完成",
        description: `正确率: ${accuracy.toFixed(1)}%`,
      })
      
      // 3秒后跳转到练习列表
      setTimeout(() => {
        router.push('/practice')
      }, 3000)
    } catch (error) {
      console.error('Error completing practice:', error)
      setError('完成练习失败，请重试')
    } finally {
      setLoading(false)
    }
  }
  
  // 返回按钮点击处理
  const handleBack = () => {
    // 如果是错题复习，返回到错题本页面
    if (practice?.type === 'review') {
      router.push('/mistakes');
    } else {
      router.push('/practice');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">加载中...</span>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={() => router.push('/practice')}>
            返回练习列表
          </Button>
        </div>
      </div>
    )
  }
  
  if (!practice || !questions.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Alert>
            <AlertDescription>未找到练习或练习中没有题目</AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={() => router.push('/practice')}>
            返回练习列表
          </Button>
        </div>
      </div>
    )
  }
  
  const currentQuestion = questions[currentQuestionIndex]
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleBack}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 select-none">{practice.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-600 select-none pointer-events-none">
                <Clock className="h-4 w-4 mr-1" />
                <span>{formatTime(elapsedTime)}</span>
              </div>
              {isCompleted && (
                <div className="flex items-center text-green-600 select-none pointer-events-none">
                  <Check className="h-4 w-4 mr-1" />
                  <span>正确率: {practice?.accuracy ? practice.accuracy.toFixed(1) : calculateAccuracy().toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
          
          {/* 题目导航 */}
          <div className="mb-6 flex flex-wrap gap-2">
            {questions.map((q, index) => {
              // 添加对null值的检查
              if (!q) {
                console.error(`题目${index}数据为空`);
                return null; // 跳过空题目
              }
              
              const isAnswered = !!answers[q._id]
              const isRevealed = !!revealedAnswers[q._id]
              // 使用服务器返回的题目正确性状态
              const isCorrect = questionResults[q._id]
              
              console.log(`题目导航 - 题目${q._id}状态:`, {isAnswered, isRevealed, isCorrect})
              
              return (
                <Button 
                  key={q._id}
                  variant={currentQuestionIndex === index ? "default" : "outline"}
                  size="sm"
                  className={`
                    ${isAnswered ? "border-2" : ""}
                    ${isRevealed && isCorrect ? "bg-green-100 border-green-500 text-green-800" : ""}
                    ${isRevealed && !isCorrect ? "bg-red-100 border-red-500 text-red-800" : ""}
                  `}
                  onClick={() => goToQuestion(index)}
                >
                  {index + 1}
                </Button>
              )
            })}
          </div>
          
          {/* 当前题目 */}
          {currentQuestion && (
            <QuestionCard
              key={`question-${currentQuestion._id}-${currentQuestionIndex}`}
              id={currentQuestion._id}
              title={currentQuestion.title}
              content={currentQuestion.content}
              type={currentQuestion.type}
              options={currentQuestion.options}
              onAnswer={handleAnswer}
              userAnswer={answers[currentQuestion._id]}
              isRevealed={revealedAnswers[currentQuestion._id]}
              isCorrect={questionResults[currentQuestion._id]}
              correctAnswer={correctAnswers[currentQuestion._id]}
              explanation={explanations[currentQuestion._id]}
              disabled={isCompleted}
              onSelfJudge={handleSelfJudge}
              selfJudged={selfJudgments[currentQuestion._id]}
            />
          )}
          
          {/* 底部导航 */}
          <div className="mt-6 flex justify-between">
            <Button 
              variant="outline" 
              onClick={goToPrevQuestion}
              disabled={currentQuestionIndex === 0}
            >
              上一题
            </Button>
            
            <div>
              {!isCompleted && !revealedAnswers[currentQuestion?._id] && (
                <Button 
                  className="mr-2"
                  onClick={() => verifyAnswer(currentQuestion._id)}
                  disabled={!answers[currentQuestion?._id]}
                >
                  检查答案
                </Button>
              )}
              
              {!isCompleted && (
                <Button 
                  onClick={submitPractice}
                  disabled={isSubmitting || Object.keys(answers).length !== questions.length}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    '提交全部'
                  )}
                </Button>
              )}
            </div>
            
            <Button 
              variant="outline" 
              onClick={goToNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              下一题
            </Button>
          </div>
          
          {/* 练习统计 */}
          {isCompleted && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="select-none">练习结果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-md">
                    <div className="text-sm text-green-600 select-none">正确题数</div>
                    <div className="text-2xl font-bold text-green-700 select-none">
                      {practice.correctCount} / {practice.totalQuestions}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-md">
                    <div className="text-sm text-blue-600 select-none">正确率</div>
                    <div className="text-2xl font-bold text-blue-700 select-none">
                      {practice?.accuracy ? practice.accuracy.toFixed(1) : calculateAccuracy().toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-md">
                    <div className="text-sm text-purple-600 select-none">用时</div>
                    <div className="text-2xl font-bold text-purple-700 select-none">
                      {formatTime(elapsedTime)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
} 