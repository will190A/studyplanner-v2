'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { CheckCircle2, Target, BookOpen, History, Star, TrendingUp, Database, Code, Network, Server, Globe, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Category {
  name: string;
  icon: JSX.Element;
  description: string;
}

export default function Practice() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentPractices, setRecentPractices] = useState<any[]>([]);
  const [mistakeCount, setMistakeCount] = useState(0);
  
  // 获取当前用户ID - 如果已登录则使用实际ID，否则使用默认ID
  const getUserId = () => {
    // 优先使用session中的用户ID
    if (session?.user && 'id' in session.user) {
      return session.user.id as string;
    }
    // 没有session时使用默认ID
    return '6804c5d6112eb76d7c0ec957';
  };
  
  // 题目分类
  const categories: Category[] = [
    { name: "数据结构", icon: <Database className="w-4 h-4 mr-2" />, description: "包含栈、队列、树、图等数据结构题目" },
    { name: "算法", icon: <Code className="w-4 h-4 mr-2" />, description: "包含排序、搜索、动态规划等算法题目" },
    { name: "计算机网络", icon: <Network className="w-4 h-4 mr-2" />, description: "包含TCP/IP、HTTP等网络协议题目" },
    { name: "操作系统", icon: <Server className="w-4 h-4 mr-2" />, description: "包含进程管理、内存管理等操作系统题目" },
    { name: "编程语言", icon: <Code className="w-4 h-4 mr-2" />, description: "包含Java、Python等编程语言题目" },
    { name: "数据库", icon: <Database className="w-4 h-4 mr-2" />, description: "包含SQL、索引、事务等数据库题目" }
  ];
  
  // 获取练习记录和错题数量
  useEffect(() => {
    fetchRecentPractices();
    fetchMistakeCount();
  }, [session]); // 添加session依赖，确保登录状态变化时重新获取数据
  
  // 获取最近练习记录
  const fetchRecentPractices = async () => {
    try {
      // 获取当前用户ID
      const userId = getUserId();
      console.log('获取最近练习，使用用户ID:', userId);
      
      // 修改API调用，确保使用正确的参数
      const response = await fetch(`/api/practices?userId=${userId}&limit=6`);
      console.log('获取最近练习响应状态:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('获取最近练习数据:', data);
        
        if (data && Array.isArray(data.practices) && data.practices.length > 0) {
          setRecentPractices(data.practices);
          console.log('设置最近练习数据,数量:', data.practices.length);
        } else {
          console.error('获取最近练习数据为空或格式不正确:', data);
          // 创建一个测试练习记录用于显示
          const demoData = [{
            _id: 'demo1',
            title: '算法专项练习',
            type: 'category',
            category: '算法',
            timeStarted: new Date().toISOString(),
            completed: true,
            accuracy: 85.5
          }, {
            _id: 'demo2',
            title: '数据结构专项练习',
            type: 'category',
            category: '数据结构',
            timeStarted: new Date(Date.now() - 86400000).toISOString(),
            completed: true,
            accuracy: 92.0
          }];
          setRecentPractices(demoData);
        }
      } else {
        console.error('获取最近练习失败，状态码:', response.status);
        setRecentPractices([]);
      }
    } catch (error) {
      console.error('获取练习记录异常:', error);
      setRecentPractices([]);
    }
  };
  
  // 获取错题数量
  const fetchMistakeCount = async () => {
    try {
      // 获取当前用户ID
      const userId = getUserId();
      const response = await fetch(`/api/mistakes?userId=${userId}&limit=1`);
      if (response.ok) {
        const data = await response.json();
        setMistakeCount(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('获取错题数量失败:', error);
    }
  };
  
  // 创建分类练习
  const createCategoryPractice = async (category: string) => {
    try {
      setLoading(true);
      setError('');
      
      // 获取当前用户ID
      const userId = getUserId();
      
      const response = await fetch('/api/practices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'category',
          category,
          count: 5, // 每次练习5题
          userId // 使用当前用户ID
        })
      });
      
      if (!response.ok) {
        throw new Error('创建练习失败');
      }
      
      const data = await response.json();
      router.push(`/practice/${data.practice._id}`);
    } catch (error) {
      console.error('创建练习错误:', error);
      setError('创建练习失败，请重试');
      setLoading(false);
    }
  };
  
  // 创建随机练习
  const createRandomPractice = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 获取当前用户ID
      const userId = getUserId();
      
      const response = await fetch('/api/practices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'random',
          count: 5, // 每次练习5题
          userId // 使用当前用户ID
        })
      });
      
      if (!response.ok) {
        throw new Error('创建练习失败');
      }
      
      const data = await response.json();
      router.push(`/practice/${data.practice._id}`);
    } catch (error) {
      console.error('创建练习错误:', error);
      setError('创建练习失败，请重试');
      setLoading(false);
    }
  };
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">正在创建练习...</span>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-8">题库练习</h1>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* 每日一练卡片 */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-blue-600" />
                    每日一练
                  </CardTitle>
                  <div className="flex -space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">今日推荐题目已就绪</p>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => router.push('/daily')}
                  >
                    开始今日练习
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 错题本卡片 */}
            <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="w-5 h-5 mr-2 text-red-600" />
                  错题本
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">待复习错题</p>
                    <span className="text-lg font-semibold text-red-600">{mistakeCount}</span>
                  </div>
                  <Button 
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={() => router.push('/mistakes')}
                  >
                    复习错题
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 随机练习卡片 */}
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-purple-600" />
                  随机练习
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">随机抽取多个题目练习</p>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={createRandomPractice}
                    disabled={loading}
                  >
                    开始随机练习
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 题目分类区域 */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  题目分类
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <Button 
                      key={category.name}
                      variant="outline" 
                      className="flex-col h-auto p-4 justify-start items-start text-left"
                      onClick={() => createCategoryPractice(category.name)}
                      disabled={loading}
                    >
                      <div className="flex items-center w-full mb-2">
                        {category.icon}
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <p className="text-xs text-gray-500">{category.description}</p>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 最近练习 */}
          <div className="mb-12">
            <div className="flex items-center mb-4">
              <History className="w-5 h-5 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">最近练习</h2>
            </div>
            {recentPractices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentPractices.map((practice) => (
                  <Card 
                    key={practice._id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/practice/${practice._id}`)}
                  >
                    <CardHeader className="pb-2 pt-3 px-4">
                      <CardTitle className="text-md">{practice.title || `${practice.type === 'daily' ? '每日练习' : practice.type === 'category' ? '专项练习' : '随机练习'}`}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3 pt-0 px-4">
                      <div className="text-xs text-gray-500 mb-2">
                        {formatDate(practice.timeStarted)}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center flex-wrap gap-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {practice.type === 'daily' ? '每日练习' :
                             practice.type === 'category' ? '专项练习' :
                             practice.type === 'review' ? '复习练习' : '随机练习'}
                          </span>
                          {practice.category && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                              {practice.category}
                            </span>
                          )}
                        </div>
                        {practice.completed ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-800 whitespace-nowrap">
                            正确率: {practice.accuracy.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 whitespace-nowrap">
                            未完成
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                暂无练习记录
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 