'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Loader2, 
  Clock, 
  Calendar, 
  Trophy, 
  BookOpen, 
  BarChart3, 
  Zap,
  TrendingUp,
  Check,
  BookOpenCheck,
  ArrowRight,
  ChevronRight
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  BarElement
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  BarElement
);

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

  // 计算完成率的环形图数据
  const completionData = {
    labels: ['已完成', '未完成'],
    datasets: [
      {
        data: statistics ? [
          statistics.todayTasks.completedTasks,
          statistics.todayTasks.totalTasks - statistics.todayTasks.completedTasks
        ] : [0, 0],
        backgroundColor: ['#8b5cf6', '#e5e7eb'],
        borderColor: ['#8b5cf6', '#e5e7eb'],
        borderWidth: 1,
        cutout: '70%'
      },
    ],
  };

  // 格式化时间
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <span className="text-lg text-gray-600">加载数据中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Navbar />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="text-red-500 text-lg mb-4">{error}</div>
              <Button onClick={fetchStatistics}>重试</Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      <main className="pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 页面标题和欢迎语 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">学习总览</h1>
            <p className="text-gray-600">欢迎回来！今天是继续学习的好日子 📚</p>
          </div>
          
          {/* 顶部数据卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* 今日任务卡片 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-purple-100 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-60"></div>
              
              <CardHeader className="pb-2 border-b border-gray-100">
                <CardTitle className="flex items-center text-xl">
                  <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                  今日任务
                </CardTitle>
                <CardDescription>跟踪你今天的学习进度</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="w-24 h-24 mx-auto">
                    <Doughnut 
                      data={completionData} 
                      options={{
                        plugins: {
                          legend: {
                            display: false
                          },
                          tooltip: {
                            enabled: true
                          }
                        },
                        animation: {
                          animateScale: true
                        }
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">
                      {statistics?.todayTasks.completedTasks}/{statistics?.todayTasks.totalTasks}
                    </p>
                    <p className="text-sm text-gray-500">任务完成率</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <span className="text-gray-600 flex items-center">
                      <BookOpenCheck className="h-4 w-4 mr-2 text-green-500" />
                      每日一练
                    </span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      statistics?.todayTasks.dailyPractice 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {statistics?.todayTasks.dailyPractice ? '已完成' : '未开始'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button 
                    onClick={() => router.push('/daily')}
                    variant="outline" 
                    className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    立即练习
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 学习进度卡片 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-blue-100 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-60"></div>
              
              <CardHeader className="pb-2 border-b border-gray-100">
                <CardTitle className="flex items-center text-xl">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  学习进度
                </CardTitle>
                <CardDescription>本周的学习表现</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <Clock className="h-6 w-6 mb-2 mx-auto text-blue-600" />
                    <p className="text-2xl font-bold text-blue-600">
                      {formatTime(statistics?.weekProgress.time || 0)}
                    </p>
                    <p className="text-xs text-gray-500">本周学习时长</p>
                  </div>
                  
                  <div className="bg-indigo-50 rounded-lg p-4 text-center">
                    <TrendingUp className="h-6 w-6 mb-2 mx-auto text-indigo-600" />
                    <p className="text-2xl font-bold text-indigo-600">
                      {(statistics?.weekProgress.completionRate || 0).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">任务完成率</p>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Zap className="h-4 w-4 mr-1 text-yellow-500" />
                    学习效率提示
                  </div>
                  <p className="text-xs text-gray-600">
                    根据你的学习数据，建议每天坚持短时间高频率的学习，效果优于长时间低效率学习。
                  </p>
                </div>
                
                <div className="mt-4">
                  <Button 
                    onClick={() => router.push('/reports')}
                    variant="outline" 
                    className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    查看详细报告
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 成就进度卡片 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-amber-100 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-60"></div>
              
              <CardHeader className="pb-2 border-b border-gray-100">
                <CardTitle className="flex items-center text-xl">
                  <Trophy className="h-5 w-5 mr-2 text-amber-600" />
                  学习成就
                </CardTitle>
                <CardDescription>你的学习里程碑</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 text-center">
                    <div className="relative">
                      <Trophy className="h-8 w-8 mb-1 mx-auto text-amber-500" />
                      <span className="absolute top-0 right-1/3 w-3 h-3 rounded-full bg-amber-200 animate-pulse"></span>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">{statistics?.streak}</p>
                    <p className="text-xs text-gray-500">连续学习天数</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 text-center">
                    <BookOpen className="h-6 w-6 mb-2 mx-auto text-emerald-600" />
                    <p className="text-2xl font-bold text-emerald-600">{statistics?.totalPractices}</p>
                    <p className="text-xs text-gray-500">完成的练习</p>
                  </div>
                </div>
                
                <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg mb-4">
                  <div className="text-sm font-medium text-amber-700 mb-1">
                    当前平均正确率
                  </div>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full" 
                        style={{ width: `${statistics?.averageAccuracy || 0}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm font-medium text-amber-700">
                      {(statistics?.averageAccuracy || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button 
                    onClick={() => router.push('/practice')} 
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  >
                    开始练习
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 底部卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 最近练习卡片 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-2 border-b border-gray-100">
                <CardTitle className="flex items-center text-xl">
                  <BarChart3 className="h-5 w-5 mr-2 text-indigo-600" />
                  最近练习
                </CardTitle>
                <CardDescription>你最近的学习记录</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {statistics?.recentPractices && statistics.recentPractices.length > 0 ? (
                    statistics.recentPractices.map((practice) => (
                      <div 
                        key={practice.id}
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                        onClick={() => router.push(`/practice/${practice.id}`)}
                      >
                        <div className="flex items-center">
                          <div className={`w-2 h-10 rounded-full mr-3 ${
                            practice.completed ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></div>
                          <div>
                            <p className="font-medium text-gray-800">{practice.title}</p>
                            <div className="flex items-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full mr-2 ${
                                practice.type === 'daily' 
                                  ? 'bg-blue-100 text-blue-700'
                                  : practice.type === 'category'
                                  ? 'bg-purple-100 text-purple-700'
                                  : practice.type === 'review'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {practice.type === 'daily' ? '每日练习' : 
                                 practice.type === 'category' ? '专项练习' :
                                 practice.type === 'review' ? '错题复习' : '随机练习'}
                              </span>
                              {practice.category && (
                                <span className="text-xs text-gray-500">
                                  {practice.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">
                            {new Date(practice.timeStarted).toLocaleDateString()}
                          </p>
                          {practice.completed ? (
                            <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                              practice.accuracy >= 80 
                                ? 'bg-green-100 text-green-800' 
                                : practice.accuracy >= 60
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {practice.accuracy.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              进行中
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <BookOpen className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      <p>暂无练习记录</p>
                      <Button 
                        variant="outline"
                        className="mt-3"
                        onClick={() => router.push('/practice')}
                      >
                        开始第一次练习
                      </Button>
                    </div>
                  )}
                </div>
                
                {statistics?.recentPractices && statistics.recentPractices.length > 0 && (
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4 text-indigo-600 hover:bg-indigo-50"
                    onClick={() => router.push('/practice/history')}
                  >
                    查看所有练习记录
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* 学习建议卡片 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-2 border-b border-gray-100">
                <CardTitle className="flex items-center text-xl">
                  <Zap className="h-5 w-5 mr-2 text-amber-500" />
                  学习建议
                </CardTitle>
                <CardDescription>为你定制的学习提示</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl shadow-sm">
                    <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      高效学习时间
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      根据数据分析，你在晚上8点-10点的学习效率最高。建议在这个时间段安排重点学习内容，每天保持1-2小时的高质量学习。
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl shadow-sm">
                    <h3 className="font-medium text-purple-800 mb-2 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      学习目标建议
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      当前平均正确率为 <span className="font-medium">{(statistics?.averageAccuracy || 0).toFixed(1)}%</span>，
                      建议通过错题复习和专项练习来提高薄弱环节的掌握程度。每周至少完成3次专项练习，重点关注错题较多的领域。
                    </p>
                    <Button
                      variant="ghost"
                      size="sm" 
                      className="mt-3 text-purple-600 hover:bg-purple-100"
                      onClick={() => router.push('/mistakes')}
                    >
                      查看错题本
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-xl shadow-sm">
                    <h3 className="font-medium text-amber-800 mb-2 flex items-center">
                      <Trophy className="h-4 w-4 mr-2" />
                      成就挑战
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      你已经连续学习了 <span className="font-medium">{statistics?.streak} 天</span>！
                      再坚持7天可以解锁"学习达人"成就。保持每日练习，不要中断你的学习连续记录！
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