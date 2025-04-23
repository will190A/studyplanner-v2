'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePlanStore } from '@/lib/store'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import Navbar from '@/components/Navbar'

interface Task {
  id: string
  date: string
  subject: string
  description: string
  duration: number
  completed: boolean
}

interface StudyPlan {
  id: string
  _id?: string
  userId: string
  subjects: string[]
  startDate: string
  endDate: string
  dailyHours: number
  tasks: Task[]
}

export default function GeneratePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { savePlan, updatePlan, isLoading: isPlanLoading, error } = usePlanStore()
  const [subjectsInput, setSubjectsInput] = useState('')
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date
  })
  const [dailyHours, setDailyHours] = useState(2)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setError(null)

    // 检查用户是否已登录
    if (!session?.user?.id) {
      setError('请先登录')
      setIsGenerating(false)
      return
    }

    // 将输入的科目字符串转换为数组
    const subjects = subjectsInput
      .split(/[,，、\n]/) // 支持逗号、中文逗号、顿号、换行作为分隔符
      .map(subject => subject.trim())
      .filter(subject => subject.length > 0)

    if (subjects.length === 0) {
      setError('请输入至少一个科目')
      setIsGenerating(false)
      return
    }

    try {
      console.log('Starting plan generation...')
      // 生成 AI 计划
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjects,
          startDate: startDate.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-'),
          endDate: endDate.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-'),
          dailyHours,
        }),
      });

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '生成计划失败')
      }

      console.log('Plan generated, saving...')
      const { tasks } = data

      // 保存计划
      const plan: StudyPlan = {
        id: '', // 服务器会生成id
        userId: session.user.id,
        subjects,
        startDate: startDate.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-'),
        endDate: endDate.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-'),
        dailyHours,
        tasks
      }

      const result = await savePlan(plan)

      console.log('Save plan result:', result)

      if (result.success) {
        console.log('Plan saved successfully')
        // 跳转到全部学习计划页面
        router.push('/plans')
      } else {
        console.error('Failed to save plan:', result.error)
        throw new Error(result.error || '保存计划失败')
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      setError(error instanceof Error ? error.message : '创建计划时发生错误')
    } finally {
      setIsGenerating(false)
    }
  }

  // 加载中状态
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 pt-16">
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex items-center">
            <span className="mr-2">⚠️</span>
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>创建学习计划</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Label>输入科目</Label>
              <Textarea
                placeholder="请输入要学习的科目，用逗号、顿号或换行分隔。例如：&#10;数学&#10;英语&#10;物理&#10;化学"
                value={subjectsInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSubjectsInput(e.target.value)}
                className="mt-2 min-h-[100px]"
                disabled={isGenerating || isSubmitting}
              />
              <p className="text-sm text-muted-foreground mt-1">
                提示：可以输入多个科目，用逗号、顿号或换行分隔
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>开始日期</Label>
                <div className={cn(isGenerating || isSubmitting ? "opacity-50" : "")}>
                  <DatePicker
                    date={startDate}
                    setDate={(date: Date | undefined) => date && setStartDate(date)}
                  />
                </div>
              </div>
              <div>
                <Label>结束日期</Label>
                <div className={cn(isGenerating || isSubmitting ? "opacity-50" : "")}>
                  <DatePicker
                    date={endDate}
                    setDate={(date: Date | undefined) => date && setEndDate(date)}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>每日学习时长（小时）</Label>
              <div className="flex items-center space-x-4 mt-2">
                <Slider
                  value={[dailyHours]}
                  onValueChange={([value]) => setDailyHours(value)}
                  min={1}
                  max={8}
                  step={0.5}
                  disabled={isGenerating || isSubmitting}
                />
                <span className="text-sm font-medium">{dailyHours} 小时</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!subjectsInput.trim() || isGenerating || isSubmitting}
              >
                {isGenerating ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    正在生成计划...
                  </div>
                ) : (
                  '生成学习计划'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 