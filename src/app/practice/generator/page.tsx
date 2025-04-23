'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import QuestionGenerator from '@/components/QuestionGenerator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function GeneratorPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Link href="/practice">
                <Button variant="ghost" className="mr-4">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  返回题库
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-amber-500" />
                AI智能导题
              </h1>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>创建自定义题库</CardTitle>
              <CardDescription>
                使用AI智能导题功能，轻松创建个性化题库。支持多种导入方式和题型，生成的题目将保存到您的自定义题库中。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-2 flex items-center">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs mr-2">1</span>
                      选择导入方式
                    </h3>
                    <p className="text-sm text-gray-600">
                      输入课程名称、粘贴教材内容或上传文件
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-2 flex items-center">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white text-xs mr-2">2</span>
                      设置题目参数
                    </h3>
                    <p className="text-sm text-gray-600">
                      选择题型、数量和难度级别
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-2 flex items-center">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs mr-2">3</span>
                      保存到题库
                    </h3>
                    <p className="text-sm text-gray-600">
                      预览生成的题目并添加到您的自定义题库
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
          
          <QuestionGenerator />
          
          <div className="mt-8 flex justify-center">
            <Link href="/practice">
              <Button variant="outline">
                <ChevronLeft className="h-4 w-4 mr-2" />
                返回题库
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
} 