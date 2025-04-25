'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Navbar from '@/components/Navbar'

interface Question {
  _id: string
  title: string
  content: string
  type: 'choice' | 'multiple' | 'judge' | 'fill' | 'code' | 'short_answer'
  category: string
  subcategory?: string
  difficulty: 'easy' | 'medium' | 'hard'
  options?: { label: string; text: string }[]
  answer?: string | string[]
  explanation?: string
  isCustom?: boolean
}

export default function QuestionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [question, setQuestion] = useState<Question | null>(null)

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/questions/${params.id}?showAnswer=true`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch question')
        }
        
        const data = await response.json()
        setQuestion(data)
        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        setError('获取题目失败，请重试')
        setLoading(false)
      }
    }
    
    fetchQuestion()
  }, [params.id])

  // 获取题目类型标签
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'choice': return '单选题'
      case 'multiple': return '多选题'
      case 'judge': return '判断题'
      case 'fill': return '填空题'
      case 'code': return '编程题'
      case 'short_answer': return '简答题'
      default: return type
    }
  }

  // 获取难度标签样式
  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

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
          <Button className="mt-4" onClick={() => router.back()}>
            返回
          </Button>
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Alert>
            <AlertDescription>未找到题目</AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={() => router.back()}>
            返回
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">题目详情</h1>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={getDifficultyClass(question.difficulty)}>
                  {question.difficulty}
                </Badge>
                <Badge className="bg-blue-100 text-blue-800">
                  {getTypeLabel(question.type)}
                </Badge>
                <Badge className="bg-purple-100 text-purple-800">
                  {question.category}
                </Badge>
                {question.subcategory && (
                  <Badge className="bg-indigo-100 text-indigo-800">
                    {question.subcategory}
                  </Badge>
                )}
                {question.isCustom && (
                  <Badge className="bg-orange-100 text-orange-800">
                    自定义题目
                  </Badge>
                )}
              </div>

              <h2 className="text-xl font-semibold mb-4">{question.title}</h2>
              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 whitespace-pre-wrap">{question.content}</p>
              </div>

              {question.options && question.options.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h3 className="font-medium text-gray-900">选项：</h3>
                  {question.options.map((option) => (
                    <div 
                      key={option.label}
                      className={`p-3 rounded-lg border ${
                        question.answer && 
                        (Array.isArray(question.answer) 
                          ? question.answer.includes(option.label)
                          : question.answer === option.label)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <span className="font-medium mr-2">{option.label}.</span>
                      {option.text}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">答案：</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {Array.isArray(question.answer) 
                      ? question.answer.join('、')
                      : question.answer}
                  </p>
                </div>

                {question.explanation && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">解析：</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{question.explanation}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 