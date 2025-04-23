import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
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
                    <span className="font-semibold">3/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">每日一练</span>
                    <span className="font-semibold">已完成</span>
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
                    <span className="font-semibold">12.5 小时</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">完成率</span>
                    <span className="font-semibold">85%</span>
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
                    <span className="font-semibold">7 天</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">总成就点数</span>
                    <span className="font-semibold">350</span>
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
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">数据结构</span>
                    <span className="text-sm text-gray-500">2小时前</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">算法分析</span>
                    <span className="text-sm text-gray-500">昨天</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>待完成任务</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">完成数据结构作业</span>
                    <span className="text-sm text-gray-500">今天 18:00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">复习算法笔记</span>
                    <span className="text-sm text-gray-500">明天 10:00</span>
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