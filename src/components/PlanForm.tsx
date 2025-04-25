'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { usePlanStore } from '@/lib/store'

export default function PlanForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const { currentPlan, updateTask, deletePlan, isLoading, error, fetchPlans } = usePlanStore()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingPlan, setIsLoadingPlan] = useState(true)

  useEffect(() => {
    // 如果会话状态仍在加载，则等待
    if (status === 'loading') return;
    
    // 如果用户未登录，则重定向到登录页
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    const loadPlan = async () => {
      if (session?.user) {
        const planId = searchParams.get('id')
        if (!planId) {
          router.push('/plans')
          return
        }

        // 使用 session 中的用户ID
        const userId = session.user.id as string
        const result = await fetchPlans(userId)
        if (result.success && result.data) {
          const plan = result.data.find(p => (p._id === planId || p.id === planId))
          if (plan) {
            const planWithId = {
              ...plan,
              id: plan._id || plan.id,
              _id: plan._id || plan.id
            }
            usePlanStore.getState().setPlan(planWithId)
          } else {
            router.push('/plans')
          }
        }
        setIsLoadingPlan(false)
      }
    }

    loadPlan()
  }, [status, session, router, fetchPlans, searchParams])

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    if (!currentPlan) {
      console.error('No current plan found')
      return
    }

    const planId = currentPlan._id || currentPlan.id
    if (!planId) {
      console.error('Plan ID is missing')
      return
    }
    
    try {
      const result = await updateTask(taskId, completed)
      if (!result.success) {
        console.error('Failed to update task:', result.error)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeletePlan = async () => {
    if (!currentPlan) return

    if (!confirm('确定要删除这个学习计划吗？')) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deletePlan(currentPlan.id)
      if (result.success) {
        router.push('/plans')
      } else {
        console.error('Failed to delete plan:', result.error)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoadingPlan) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!currentPlan) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>没有找到学习计划</CardTitle>
          </CardHeader>
          <CardContent>
            <p>请选择一个现有的计划。</p>
            <Button onClick={() => router.push('/plans')} className="mt-4">
              返回计划列表
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalTasks = currentPlan.tasks.length
  const completedTasks = currentPlan.tasks.filter((task) => task.completed).length
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  // 按日期分组任务
  const tasksByDate = currentPlan.tasks.reduce((acc, task) => {
    if (!acc[task.date]) {
      acc[task.date] = []
    }
    acc[task.date].push(task)
    return acc
  }, {} as Record<string, typeof currentPlan.tasks>)

  return (
    <div className="container mx-auto p-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>学习计划进度</CardTitle>
            <Button
              variant="destructive"
              onClick={handleDeletePlan}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  删除中...
                </>
              ) : (
                '删除计划'
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span>总体进度</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">总任务数</p>
                <p className="text-2xl font-bold">{totalTasks}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">已完成任务</p>
                <p className="text-2xl font-bold">{completedTasks}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {Object.entries(tasksByDate)
          .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
          .map(([date, tasks]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle>{new Date(date).toLocaleDateString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center space-x-4 p-4 border rounded-lg"
                    >
                      <Checkbox
                        id={task.id}
                        checked={task.completed}
                        onCheckedChange={(checked) =>
                          handleTaskToggle(task.id, checked as boolean)
                        }
                        disabled={isLoading}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={task.id}
                          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                            task.completed ? 'line-through text-gray-500' : ''
                          }`}
                        >
                          {task.subject} - {task.description}
                        </label>
                        <p className="text-sm text-gray-500">
                          预计时长: {task.duration} 小时
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
} 