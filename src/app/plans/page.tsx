'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePlanStore } from '@/lib/store'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function PlansPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { fetchPlans, isLoading, error, plans } = usePlanStore()
  const [mounted, setMounted] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // 获取当前用户ID - 如果已登录则使用实际ID，否则使用默认ID
  const getUserId = () => {
    if (session?.user && 'id' in session.user) {
      return session.user.id as string;
    }
    return null;  // 未登录时返回 null
  };

  useEffect(() => {
    console.log("[PlansPage] Component mounted");
    setMounted(true)
  }, [])

  useEffect(() => {
    console.log(`[PlansPage] Status changed: ${status}, Mounted: ${mounted}`);
    // 仅在客户端挂载后并且 session 状态明确后执行
    if (!mounted) {
      console.log("[PlansPage] Effect skipped: not mounted yet");
      return;
    }

    const userId = getUserId();
    if (userId) {
      console.log("[PlansPage] Status: authenticated, Session user:", userId);
      const loadPlans = async () => {
        try {
          console.log("[PlansPage] Fetching plans for user:", userId)
          const result = await fetchPlans(userId)
          if (!result.success) {
            console.error("[PlansPage] Fetch plans failed:", result.error);
            setFetchError(result.error || '加载计划失败')
          } else {
            console.log("[PlansPage] Fetch plans successful");
          }
        } catch (err) {
          console.error("[PlansPage] Error fetching plans:", err)
          setFetchError('加载计划时出错')
        }
      }
      loadPlans()
    } else {
      console.log("[PlansPage] No user ID available, showing public view");
      // 清空可能存在的旧计划数据
      usePlanStore.setState({ plans: [], currentPlan: null })
    }

  }, [mounted, status, session, fetchPlans])

  const calculateProgress = (tasks: any[]) => {
    if (!tasks || !Array.isArray(tasks)) return 0
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.completed).length
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  }

  const handlePlanClick = (planId: string) => {
    console.log(`[PlansPage] handlePlanClick called with planId: ${planId}, status: ${status}`);
    // 如果未登录，先保存目标URL，然后重定向到登录页
    if (!session?.user) {
      console.log(`[PlansPage] User not logged in, saving redirect URL and redirecting to login`);
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirectAfterLogin', `/plan?id=${planId}`);
      }
      router.push('/login');
      return;
    }

    console.log("[PlansPage] User is logged in, navigating to plan details");
    const plan = plans.find(p => (p._id === planId || p.id === planId));
    if (plan) {
      const planWithId = {
        ...plan,
        id: planId,
        _id: planId
      };
      usePlanStore.getState().setPlan(planWithId);
      router.push(`/plan?id=${planId}`);
    } else {
      console.error("[PlansPage] Plan not found in local store for ID:", planId);
    }
  };

  console.log(`[PlansPage] Rendering with status: ${status}, mounted: ${mounted}, isLoading: ${isLoading}`);

  // 统一加载状态：等待客户端挂载和 session 状态明确
  if (!mounted || status === 'loading') {
    console.log("[PlansPage] Rendering loading spinner (waiting for mount or session)");
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // 已认证状态下的渲染逻辑
  console.log("[PlansPage] Rendering main content");
  return (
    <div className="container mx-auto p-4 pt-16">
      {(error || fetchError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error || fetchError}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">我的学习计划</h1>
        <Button 
          asChild
          onClick={(e) => {
            // 如果未登录，先保存目标URL，然后重定向到登录页
            if (!session?.user) {
              e.preventDefault();
              localStorage.setItem('redirectAfterLogin', '/generate');
              router.push('/login');
            }
          }}
        >
          <Link href={session?.user ? "/generate" : "#"}>创建新计划</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : !session?.user ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-4">登录后可查看您的学习计划</p>
            <Button onClick={() => router.push('/login')}>登录/注册</Button>
          </CardContent>
        </Card>
      ) : !plans || plans.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-4">你还没有创建任何学习计划</p>
            <Button asChild>
               <Link href="/generate">创建第一个计划</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const planId = plan._id || plan.id
            if (!planId) {
                console.warn("[PlansPage] Plan found in list missing ID:", plan);
                return null;
            }
            
            return (
              <Card
                key={planId}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handlePlanClick(planId)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">
                    {Array.isArray(plan.subjects) ? plan.subjects.join('、') : '未设置科目'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>总体进度</span>
                        <span>{Math.round(calculateProgress(plan.tasks))}%</span>
                      </div>
                      <Progress value={calculateProgress(plan.tasks)} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">总任务数</p>
                        <p className="text-2xl font-bold">
                          {Array.isArray(plan.tasks) ? plan.tasks.length : 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">已完成任务</p>
                        <p className="text-2xl font-bold">
                          {Array.isArray(plan.tasks) 
                            ? plan.tasks.filter((task: any) => task.completed).length 
                            : 0}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>开始日期：{plan.startDate || '未设置'}</p>
                      <p>结束日期：{plan.endDate || '未设置'}</p>
                      <p>每日学习时长：{plan.dailyHours || 0} 小时</p>
                    </div>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation(); // 阻止冒泡到卡片
                        handlePlanClick(planId);
                      }}
                      className="w-full"
                    >
                      查看详情
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
} 