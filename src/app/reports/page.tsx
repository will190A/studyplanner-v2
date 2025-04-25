'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'
import { Loader2 } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement,
  Filler,
  BarElement
} from 'chart.js'
import { Line, Radar, Doughnut, Bar } from 'react-chartjs-2'

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement,
  Filler,
  BarElement
)

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

  // 准备雷达图数据
  const radarData = {
    labels: reports?.mastery.map(item => item.category) || [],
    datasets: [
      {
        label: '掌握程度',
        data: reports?.mastery.map(item => item.accuracy) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
      }
    ]
  }

  // 准备趋势图数据
  const trendData = {
    labels: reports?.trend.map(item => new Date(item.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: '练习数量',
        data: reports?.trend.map(item => item.count) || [],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      },
      {
        label: '正确率',
        data: reports?.trend.map(item => item.accuracy) || [],
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4
      }
    ]
  }

  // 准备知识点分布图数据
  const distributionData = {
    labels: reports?.mastery.map(item => item.category) || [],
    datasets: [
      {
        data: reports?.mastery.map(item => item.accuracy) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }
    ]
  }

  // 准备薄弱点排名图数据
  const weakPointsData = {
    labels: reports?.weakPoints.map(item => item.category) || [],
    datasets: [
      {
        label: '正确率',
        data: reports?.weakPoints.map(item => item.accuracy) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }
    ]
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
                variant={period === 'year' ? 'default' : 'outline'}
                onClick={() => setPeriod('year')}
              >
                近一年
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>掌握程度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Radar 
                    data={radarData}
                    options={{
                      scales: {
                        r: {
                          angleLines: {
                            display: true
                          },
                          suggestedMin: 0,
                          suggestedMax: 100
                        }
                      },
                      plugins: {
                        legend: {
                          position: 'top' as const
                        }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>练习趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Line 
                    data={trendData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top' as const
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
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
                <div className="h-80">
                  <Bar 
                    data={weakPointsData}
                    options={{
                      indexAxis: 'y' as const,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `正确率: ${context.raw}%`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          beginAtZero: true,
                          max: 100,
                          title: {
                            display: true,
                            text: '正确率 (%)'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>知识点分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <Doughnut 
                    data={distributionData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'right' as const
                        }
                      }
                    }}
                  />
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