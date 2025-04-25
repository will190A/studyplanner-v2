'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'
import { Loader2 } from 'lucide-react'

interface Reports {
  mastery: {
    category: string;
    accuracy: number;
  }[];
  trend: {
    date: string;
    count: number;
    accuracy: number;
    time: number;
  }[];
  weakPoints: {
    category: string;
    accuracy: number;
  }[];
  statistics: {
    totalPractices: number;
    averageAccuracy: number;
    totalTime: number;
    streak: number;
  };
}

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reports, setReports] = useState<Reports | null>(null)
  const [period, setPeriod] = useState('7')

  useEffect(() => {
    fetchReports()
  }, [period])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reports?period=${period}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }
      
      const data = await response.json()
      setReports(data.reports)
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">学习报告</h1>
            <div className="flex gap-4">
              <Button 
                variant={period === '7' ? 'default' : 'outline'}
                onClick={() => setPeriod('7')}
              >
                近7天
              </Button>
              <Button 
                variant={period === '30' ? 'default' : 'outline'}
                onClick={() => setPeriod('30')}
              >
                近30天
              </Button>
              <Button 
                variant={period === 'all' ? 'default' : 'outline'}
                onClick={() => setPeriod('all')}
              >
                全部
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>掌握程度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports?.mastery.map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <span className="text-gray-600">{item.category}</span>
                      <div className="flex items-center">
                        <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                          <div 
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${item.accuracy}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {item.accuracy.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>练习趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports?.trend.map((item) => (
                    <div key={item.date} className="flex items-center justify-between">
                      <span className="text-gray-600">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                          {item.count} 题
                        </span>
                        <span className="text-sm font-medium">
                          {item.accuracy.toFixed(1)}%
                        </span>
                        <span className="text-sm text-gray-500">
                          {Math.round(item.time / 60)} 分钟
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>薄弱点排名</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports?.weakPoints.map((item) => (
                    <div key={item.category} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div>
                        <h3 className="font-medium">{item.category}</h3>
                        <p className="text-sm text-gray-500">需要加强</p>
                      </div>
                      <span className="text-red-500 font-medium">
                        正确率: {item.accuracy.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>知识点分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports?.mastery.map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <span className="text-gray-600">{item.category}</span>
                      <div className="flex items-center">
                        <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                          <div 
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${item.accuracy}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {item.accuracy.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>学习统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h3 className="font-medium mb-2">总练习数</h3>
                  <p className="text-2xl font-bold">{reports?.statistics.totalPractices}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h3 className="font-medium mb-2">平均正确率</h3>
                  <p className="text-2xl font-bold">
                    {reports?.statistics.averageAccuracy.toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h3 className="font-medium mb-2">总学习时长</h3>
                  <p className="text-2xl font-bold">
                    {Math.round(reports?.statistics.totalTime || 0 / 60)}h
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h3 className="font-medium mb-2">连续学习</h3>
                  <p className="text-2xl font-bold">{reports?.statistics.streak}天</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 