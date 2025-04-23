'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Clock, BarChart, Target, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Practice {
  _id: string;
  title: string;
  type: 'daily' | 'category' | 'review' | 'random';
  category?: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  completed: boolean;
  timeStarted: string;
  timeCompleted?: string;
  createdAt: string;
}

export default function PracticeHistory() {
  const router = useRouter();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchPractices();
  }, []);
  
  const fetchPractices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/practices?limit=20');
      
      if (!response.ok) {
        throw new Error('Failed to fetch practices');
      }
      
      const data = await response.json();
      setPractices(data.practices || []);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setError('获取练习记录失败，请重试');
      setLoading(false);
    }
  };
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 计算用时（分钟）
  const calculateDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    
    const durationMs = endTime - startTime;
    return Math.round(durationMs / 60000); // 转换为分钟
  };
  
  // 获取练习类型标签
  const getPracticeTypeLabel = (type: string, category?: string) => {
    switch (type) {
      case 'daily': return '每日一练';
      case 'category': return `${category || '分类'}专项`;
      case 'review': return '错题复习';
      case 'random': return '随机练习';
      default: return type;
    }
  };
  
  // 获取练习类型标签颜色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-blue-100 text-blue-800';
      case 'category': return 'bg-purple-100 text-purple-800';
      case 'review': return 'bg-red-100 text-red-800';
      case 'random': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">加载中...</span>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-8">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => router.push('/practice')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">练习历史</h1>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {practices.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">暂无练习记录</h3>
              <p className="mt-2 text-sm text-gray-500">开始您的第一次练习吧！</p>
              <Button 
                className="mt-4"
                onClick={() => router.push('/practice')}
              >
                开始练习
              </Button>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>练习记录</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {practices.map(practice => (
                    <div 
                      key={practice._id}
                      className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-4 bg-white rounded-lg border hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/practice/${practice._id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge className={getTypeColor(practice.type)}>
                            {getPracticeTypeLabel(practice.type, practice.category)}
                          </Badge>
                          {practice.completed ? (
                            <Badge className="bg-green-100 text-green-800">已完成</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800">未完成</Badge>
                          )}
                        </div>
                        
                        <h3 className="font-medium">{practice.title}</h3>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Target className="h-4 w-4 mr-1" />
                            <span>题目：{practice.totalQuestions}道</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>用时：{calculateDuration(practice.timeStarted, practice.timeCompleted)}分钟</span>
                          </div>
                          <div className="flex items-center">
                            <BarChart className="h-4 w-4 mr-1" />
                            <span>正确率：{practice.completed ? `${practice.accuracy.toFixed(1)}%` : '未完成'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 md:mt-0 text-right">
                        <p className="text-sm text-gray-500">
                          {formatDate(practice.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
} 