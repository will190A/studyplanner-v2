import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';

export default function Reports() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">学习报告</h1>
            <div className="flex gap-4">
              <Button variant="outline">近7天</Button>
              <Button variant="outline">近30天</Button>
              <Button variant="outline">全部</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>掌握程度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">雷达图待实现</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>练习趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">趋势图待实现</p>
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
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <h3 className="font-medium">动态规划</h3>
                      <p className="text-sm text-gray-500">算法分析</p>
                    </div>
                    <span className="text-red-500 font-medium">正确率: 45%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <h3 className="font-medium">图论</h3>
                      <p className="text-sm text-gray-500">数据结构</p>
                    </div>
                    <span className="text-red-500 font-medium">正确率: 52%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>知识点分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">热力图待实现</p>
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
                  <p className="text-2xl font-bold">156</p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h3 className="font-medium mb-2">平均正确率</h3>
                  <p className="text-2xl font-bold">78%</p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h3 className="font-medium mb-2">总学习时长</h3>
                  <p className="text-2xl font-bold">42h</p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h3 className="font-medium mb-2">连续学习</h3>
                  <p className="text-2xl font-bold">7天</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 