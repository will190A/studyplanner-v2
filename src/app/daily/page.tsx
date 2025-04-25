'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Calendar, Trophy, Clock } from 'lucide-react'

interface CheckInRecord {
  date: string
  completed: boolean
  accuracy: number
  practiceId: string | null
}

export default function DailyPracticePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [todayPractice, setTodayPractice] = useState<any>(null)
  const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>([])
  
  // 获取当前日期
  const today = new Date().toISOString().split('T')[0]
  
  // 获取最近7天的日期范围
  const getDateRange = () => {
    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 6) // 最近7天
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }
  
  // 获取今日练习和打卡记录
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // 获取今日练习
        const practiceResponse = await fetch('/api/daily')
        
        if (!practiceResponse.ok) {
          throw new Error('Failed to fetch daily practice')
        }
        
        const practiceData = await practiceResponse.json()
        setTodayPractice(practiceData)
        
        // 获取打卡记录
        const { startDate, endDate } = getDateRange()
        
        const recordsResponse = await fetch('/api/daily', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ startDate, endDate })
        })
        
        if (!recordsResponse.ok) {
          throw new Error('Failed to fetch check-in records')
        }
        
        const recordsData = await recordsResponse.json()
        // 确保打卡记录按日期正序排序（从早到晚）
        const sortedRecords = (recordsData.checkInRecords || []).sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        setCheckInRecords(sortedRecords)
        
        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        setError('获取每日一练失败，请重试')
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // 格式化日期显示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
  
  // 开始今日练习
  const startPractice = () => {
    if (todayPractice && todayPractice.practice) {
      router.push(`/practice/${todayPractice.practice._id}`)
    }
  }
  
  // 计算连续打卡天数
  const calculateStreak = () => {
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 按日期降序排序（为了计算连续天数，仍然需要从最近的开始算）
    const recordsForStreak = [...checkInRecords].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    
    // 从最近的记录开始检查
    for (let i = 0; i < recordsForStreak.length; i++) {
      const record = recordsForStreak[i]
      const recordDate = new Date(record.date)
      recordDate.setHours(0, 0, 0, 0)
      
      // 如果是今天的记录且练习已完成，或者是之前的记录且已完成
      if ((recordDate.getTime() === today.getTime() && record.completed) || 
          (recordDate.getTime() < today.getTime() && record.completed)) {
        streak++
      } else {
        break
      }
    }
    
    return streak
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
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button className="mt-4" onClick={() => router.push('/practice')}>
              返回练习列表
            </Button>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-8">每日一练</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* 今日练习卡片 */}
            <Card className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                  今日练习 - {new Date().toLocaleDateString('zh-CN')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    {todayPractice && todayPractice.practice && todayPractice.practice.completed
                      ? '你已完成今日练习！'
                      : '每日坚持练习，巩固知识点，提高学习效果。'}
                  </p>
                  
                  {todayPractice && todayPractice.practice && (
                    <div>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>题目数量：{todayPractice.practice.totalQuestions}题</span>
                        <span>
                          状态：
                          {todayPractice.practice.completed 
                            ? <span className="text-green-600 font-medium">已完成</span>
                            : <span className="text-orange-600 font-medium">未完成</span>
                          }
                        </span>
                      </div>
                      
                      <Button 
                        className="w-full"
                        onClick={startPractice}
                      >
                        {todayPractice.practice.completed 
                          ? '查看练习结果'
                          : '开始今日练习'
                        }
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* 打卡记录卡片 */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-green-600" />
                  打卡记录
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-1">
                    {checkInRecords.map((record) => (
                      <div 
                        key={record.date}
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-xs border-2
                          ${record.date === today ? 'border-blue-500' : 'border-gray-200'}
                          ${record.completed 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-100 text-gray-400'
                          }
                        `}
                        title={`${formatDate(record.date)} ${record.completed ? '已完成' : '未完成'}`}
                      >
                        {new Date(record.date).getDate()}
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center pt-2 border-t">
                    <div className="text-sm text-gray-600">连续打卡</div>
                    <div className="text-2xl font-bold text-green-600">{calculateStreak()}天</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 学习建议卡片 */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-purple-600" />
                学习建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50 rounded-md">
                    <h3 className="font-medium text-purple-800 mb-2">擅长领域</h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>数据结构 - 树</li>
                      <li>计算机网络 - TCP/IP</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-md">
                    <h3 className="font-medium text-amber-800 mb-2">需要加强</h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>算法分析 - 动态规划</li>
                      <li>操作系统 - 内存管理</li>
                    </ul>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-md">
                  <h3 className="font-medium text-blue-800 mb-2">学习习惯</h3>
                  <p className="text-gray-700">
                    根据数据分析，你在晚上8点-10点的学习效率最高。建议在这个时间段安排重点学习内容，每天保持1-2小时的高质量学习。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 