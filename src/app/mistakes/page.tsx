'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, BookOpen, Tag, BarChart, Search, Check, 
  Filter, ChevronRight, RefreshCw, BookX, Trash2 
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Question {
  _id: string
  title: string
  content: string
  type: 'choice' | 'multiple' | 'judge' | 'fill' | 'code'
  options?: { label: string; text: string }[]
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  subcategory?: string
}

interface Mistake {
  _id: string
  userId: string
  questionId: string
  category: string
  wrongAnswer: string | string[]
  wrongCount: number
  lastWrongDate: string
  notes?: string
  status: 'unresolved' | 'reviewing' | 'resolved'
  createdAt: string
  updatedAt: string
  question: Question
}

export default function MistakesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mistakes, setMistakes] = useState<Mistake[]>([])
  const [filteredMistakes, setFilteredMistakes] = useState<Mistake[]>([])
  const [selectedMistakes, setSelectedMistakes] = useState<string[]>([])
  
  // 过滤条件
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentTab, setCurrentTab] = useState('all')
  
  // 获取错题列表
  useEffect(() => {
    const fetchMistakes = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/mistakes')
        
        if (!response.ok) {
          throw new Error('Failed to fetch mistakes')
        }
        
        const data = await response.json()
        // 过滤掉已删除的题目
        const validMistakes = data.mistakes.filter((mistake: Mistake) => mistake.question)
        setMistakes(validMistakes || [])
        setFilteredMistakes(validMistakes || [])
        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        setError('获取错题列表失败，请重试')
        setLoading(false)
      }
    }
    
    fetchMistakes()
  }, [])
  
  // 过滤错题
  useEffect(() => {
    let filtered = [...mistakes]
    
    // 按标签过滤
    if (currentTab !== 'all') {
      filtered = filtered.filter(mistake => mistake.status === currentTab)
    }
    
    // 按分类过滤
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(mistake => mistake.category === categoryFilter)
    }
    
    // 按状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter(mistake => mistake.status === statusFilter)
    }
    
    // 搜索过滤
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        mistake => 
          mistake.question?.title?.toLowerCase().includes(term) ||
          mistake.question?.content?.toLowerCase().includes(term) ||
          mistake.category.toLowerCase().includes(term)
      )
    }
    
    setFilteredMistakes(filtered)
  }, [mistakes, searchTerm, categoryFilter, statusFilter, currentTab])
  
  // 获取所有分类
  const getCategories = () => {
    const categories = new Set<string>()
    mistakes.forEach(mistake => categories.add(mistake.category))
    return ['all', ...Array.from(categories)]
  }
  
  // 创建练习
  const createPractice = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/practices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'review',
          count: 10 // 默认10题
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create practice')
      }
      
      const data = await response.json()
      
      // 跳转到练习页面
      router.push(`/practice/${data.practice._id}`)
    } catch (error) {
      console.error('Error creating practice:', error)
      setError('创建练习失败，请重试')
      setLoading(false)
    }
  }
  
  // 更新错题状态
  const updateMistakeStatus = async (status: 'unresolved' | 'reviewing' | 'resolved') => {
    if (!selectedMistakes.length) return
    
    try {
      const response = await fetch('/api/mistakes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mistakeIds: selectedMistakes,
          status
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update mistakes')
      }
      
      // 更新本地状态
      setMistakes(prev => 
        prev.map(mistake => 
          selectedMistakes.includes(mistake._id)
            ? { ...mistake, status }
            : mistake
        )
      )
      
      // 清空选择
      setSelectedMistakes([])
    } catch (error) {
      console.error('Error updating mistakes:', error)
      setError('更新错题状态失败，请重试')
    }
  }
  
  // 处理选择错题
  const handleSelectMistake = (mistakeId: string, checked: boolean) => {
    if (checked) {
      setSelectedMistakes(prev => [...prev, mistakeId])
    } else {
      setSelectedMistakes(prev => prev.filter(id => id !== mistakeId))
    }
  }
  
  // 处理全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMistakes(filteredMistakes.map(mistake => mistake._id))
    } else {
      setSelectedMistakes([])
    }
  }
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }
  
  // 获取题目类型标签
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'choice': return '单选题'
      case 'multiple': return '多选题'
      case 'judge': return '判断题'
      case 'fill': return '填空题'
      case 'code': return '编程题'
      default: return type
    }
  }
  
  // 获取难度标签
  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  // 获取状态标签
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'unresolved': return '未解决'
      case 'reviewing': return '复习中'
      case 'resolved': return '已掌握'
      default: return status
    }
  }
  
  // 获取状态标签样式
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'unresolved': return 'bg-red-100 text-red-800'
      case 'reviewing': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  // 查看题目详情
  const viewQuestionDetail = (mistakeId: string) => {
    // 跳转到题目详情页面
    router.push(`/questions/${mistakeId}`)
  }
  
  // 删除错题
  const deleteMistake = async (mistakeId: string) => {
    try {
      const response = await fetch(`/api/mistakes/${mistakeId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete mistake')
      }
      
      // 更新本地状态
      setMistakes(prev => prev.filter(m => m._id !== mistakeId))
      setFilteredMistakes(prev => prev.filter(m => m._id !== mistakeId))
      setSelectedMistakes(prev => prev.filter(id => id !== mistakeId))

      // 显示成功提示
      toast({
        title: "删除成功",
        description: "错题已成功删除",
      })
    } catch (error) {
      console.error('Error deleting mistake:', error)
      setError('删除错题失败，请重试')
    }
  }
  
  // 批量删除错题
  const deleteSelectedMistakes = async () => {
    if (!selectedMistakes.length) return
    
    try {
      const response = await fetch('/api/mistakes/batch', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mistakeIds: selectedMistakes
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete mistakes')
      }
      
      // 更新本地状态
      setMistakes(prev => prev.filter(m => !selectedMistakes.includes(m._id)))
      setFilteredMistakes(prev => prev.filter(m => !selectedMistakes.includes(m._id)))
      setSelectedMistakes([])

      // 显示成功提示
      toast({
        title: "删除成功",
        description: `已成功删除 ${selectedMistakes.length} 道错题`,
      })
    } catch (error) {
      console.error('Error deleting mistakes:', error)
      setError('删除错题失败，请重试')
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
      <Toaster />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">错题本</h1>
              <p className="text-sm text-gray-500">
                共 {mistakes.length} 道错题，其中未解决: {
                  mistakes.filter(m => m.status === 'unresolved').length
                }，
                复习中: {
                  mistakes.filter(m => m.status === 'reviewing').length
                }，
                已掌握: {
                  mistakes.filter(m => m.status === 'resolved').length
                }
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline"
                className="flex items-center gap-1"
                onClick={createPractice}
              >
                <RefreshCw className="h-4 w-4" />
                开始复习
              </Button>
              
              {selectedMistakes.length > 0 && (
                <>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-1"
                    onClick={() => updateMistakeStatus('reviewing')}
                  >
                    <BookOpen className="h-4 w-4" />
                    标记为复习中
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-1 text-green-600"
                    onClick={() => updateMistakeStatus('resolved')}
                  >
                    <Check className="h-4 w-4" />
                    标记为已掌握
                  </Button>

                  <Button 
                    variant="outline" 
                    className="flex items-center gap-1 text-red-600"
                    onClick={deleteSelectedMistakes}
                  >
                    <Trash2 className="h-4 w-4" />
                    删除选中
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="搜索错题..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="w-40">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有分类</SelectItem>
                    {getCategories().filter(c => c !== 'all').map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-40">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有状态</SelectItem>
                    <SelectItem value="unresolved">未解决</SelectItem>
                    <SelectItem value="reviewing">复习中</SelectItem>
                    <SelectItem value="resolved">已掌握</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">
                全部
                <Badge variant="outline" className="ml-2">{mistakes.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="unresolved">
                未解决
                <Badge variant="outline" className="ml-2">
                  {mistakes.filter(m => m.status === 'unresolved').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="reviewing">
                复习中
                <Badge variant="outline" className="ml-2">
                  {mistakes.filter(m => m.status === 'reviewing').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="resolved">
                已掌握
                <Badge variant="outline" className="ml-2">
                  {mistakes.filter(m => m.status === 'resolved').length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={currentTab} className="mt-4">
              {filteredMistakes.length === 0 ? (
                <div className="text-center py-12">
                  <BookX className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">没有找到错题</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    当前筛选条件下没有错题，尝试调整筛选条件或继续做题添加错题
                  </p>
                </div>
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="select-all"
                          checked={filteredMistakes.length > 0 && selectedMistakes.length === filteredMistakes.length}
                          onCheckedChange={handleSelectAll}
                        />
                        <label 
                          htmlFor="select-all"
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          全选
                        </label>
                      </div>
                      <p className="text-sm text-gray-500">
                        共 {filteredMistakes.length} 项结果
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredMistakes.map((mistake) => (
                        <div 
                          key={mistake._id}
                          className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start">
                            <Checkbox 
                              id={`mistake-${mistake._id}`}
                              className="mt-1 mr-3"
                              checked={selectedMistakes.includes(mistake._id)}
                              onCheckedChange={(checked) => 
                                handleSelectMistake(mistake._id, checked as boolean)
                              }
                            />
                            
                            <div className="flex-1">
                              <div className="flex flex-wrap gap-2 mb-2">
                                {mistake.question && (
                                  <>
                                    <Badge className={getDifficultyClass(mistake.question.difficulty)}>
                                      {mistake.question.difficulty}
                                    </Badge>
                                    <Badge className="bg-blue-100 text-blue-800">
                                      {mistake.question.type}
                                    </Badge>
                                  </>
                                )}
                                <Badge className="bg-purple-100 text-purple-800">
                                  {mistake.category}
                                </Badge>
                                {mistake.question && mistake.question.subcategory && (
                                  <Badge className="bg-indigo-100 text-indigo-800">
                                    {mistake.question.subcategory}
                                  </Badge>
                                )}
                                <Badge className={getStatusClass(mistake.status)}>
                                  {getStatusLabel(mistake.status)}
                                </Badge>
                              </div>
                              
                              <h3 className="text-lg font-medium mb-2">
                                {mistake.question ? mistake.question.title : '题目已删除'}
                              </h3>
                              
                              <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                                {mistake.question ? mistake.question.content : '题目内容不可用'}
                              </p>
                              
                              <div className="flex flex-wrap items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center gap-4">
                                  <span>错误次数: {mistake.wrongCount}</span>
                                  <span>最近错误: {formatDate(mistake.lastWrongDate)}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="flex items-center"
                                    onClick={() => viewQuestionDetail(mistake.questionId)}
                                  >
                                    查看详情
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="flex items-center text-red-600"
                                    onClick={() => deleteMistake(mistake._id)}
                                  >
                                    删除
                                    <Trash2 className="ml-1 h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
} 