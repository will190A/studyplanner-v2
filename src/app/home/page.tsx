'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import Navbar from '@/components/Navbar'

interface Statistics {
  totalPractices: number;
  averageAccuracy: number;
  totalTime: number;
  streak: number;
  todayTasks: {
    dailyPractice: boolean;
    totalTasks: number;
    completedTasks: number;
  };
  weekProgress: {
    time: number;
    completionRate: number;
  };
  recentPractices: {
    id: string;
    title: string;
    type: string;
    category?: string;
    completed: boolean;
    accuracy: number;
    timeStarted: string;
  }[];
}

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statistics, setStatistics] = useState<Statistics | null>(null)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/statistics')
      
      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }
      
      const data = await response.json()
      setStatistics(data.statistics)
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setError('获取数据失败，请重试')
      setLoading(false)
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-red-500">{error}</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">学习总览</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>今日任务</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">待完成任务</span>
                    <span className="font-semibold">
                      {statistics?.todayTasks.completedTasks}/{statistics?.todayTasks.totalTasks}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">每日一练</span>
                    <span className="font-semibold">
                      {statistics?.todayTasks.dailyPractice ? '已完成' : '未完成'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>学习进度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">本周学习时长</span>
                    <span className="font-semibold">
                      {Math.round(statistics?.weekProgress.time || 0 / 60)} 小时
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">完成率</span>
                    <span className="font-semibold">
                      {statistics?.weekProgress.completionRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>成就进度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">连续学习</span>
                    <span className="font-semibold">{statistics?.streak} 天</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">总练习数</span>
                    <span className="font-semibold">{statistics?.totalPractices}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>最近练习</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics?.recentPractices.map((practice) => (
                    <div 
                      key={practice.id}
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                      onClick={() => router.push(`/practice/${practice.id}`)}
                    >
                      <div>
                        <span className="text-gray-600">{practice.title}</span>
                        {practice.category && (
                          <span className="ml-2 text-sm text-gray-500">
                            {practice.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">
                          {new Date(practice.timeStarted).toLocaleDateString()}
                        </span>
                        {practice.completed ? (
                          <span className="text-sm font-medium text-green-600">
                            {practice.accuracy.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-yellow-600">
                            未完成
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>学习建议</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-md">
                    <h3 className="font-medium text-blue-800 mb-2">学习习惯</h3>
                    <p className="text-gray-700">
                      根据数据分析，你在晚上8点-10点的学习效率最高。建议在这个时间段安排重点学习内容，每天保持1-2小时的高质量学习。
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-md">
                    <h3 className="font-medium text-purple-800 mb-2">学习目标</h3>
                    <p className="text-gray-700">
                      当前平均正确率为 {statistics?.averageAccuracy.toFixed(1)}%，建议通过错题复习和专项练习来提高薄弱环节的掌握程度。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 