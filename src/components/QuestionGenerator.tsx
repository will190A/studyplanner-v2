'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Lightbulb, Upload, FileText } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Question {
  id: string
  type: string
  content: string
  options?: string[]
  answer: string
  explanation: string
  subject: string
}

const questionTypes = [
  { id: "multiple_choice", label: "单选题" },
  { id: "multiple_answer", label: "多选题" },
  { id: "fill_blank", label: "填空题" },
  { id: "short_answer", label: "简答题" },
  { id: "true_false", label: "判断题" },
]

export default function QuestionGenerator() {
  const [courseName, setCourseName] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [content, setContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([])
  const [questionCount, setQuestionCount] = useState("5")
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleTypeChange = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    )
  }

  const getGenerationSource = (activeTab: string) => {
    if (activeTab === "courseName") {
      return { type: "courseName", data: courseName }
    } else if (activeTab === "content") {
      return { type: "content", data: content }
    } else {
      return { type: "file", data: file }
    }
  }

  const handleGenerate = async (activeTab: string) => {
    const source = getGenerationSource(activeTab)
    
    if ((source.type === "courseName" && !courseName) || 
        (source.type === "content" && !content) || 
        (source.type === "file" && !file)) {
      toast({
        title: "错误",
        description: `请${source.type === "courseName" ? "输入课程名称" : source.type === "content" ? "输入课本或PPT内容" : "上传文件"}`,
        variant: "destructive",
      })
      return
    }

    if (selectedTypes.length === 0) {
      toast({
        title: "错误",
        description: "请至少选择一种题型",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const formData = new FormData()
      
      if (source.type === "courseName") {
        formData.append("courseName", courseName)
      } else if (source.type === "content") {
        formData.append("content", content)
        // 如果是内容但没有指定课程名，则使用一个默认值
        if (!courseName) {
          formData.append("courseName", "未命名课程")
        } else {
          formData.append("courseName", courseName)
        }
      } else if (source.type === "file" && file) {
        formData.append("file", file)
        // 如果是文件但没有指定课程名，则使用文件名作为课程名
        if (!courseName) {
          const fileName = file.name.split('.')[0]
          formData.append("courseName", fileName)
        } else {
          formData.append("courseName", courseName)
        }
      }
      
      formData.append("types", JSON.stringify(selectedTypes))
      formData.append("count", questionCount)

      const response = await fetch("/api/questions/generate", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("生成题目失败")
      }

      const data = await response.json()
      setGeneratedQuestions(data.questions)
      
      toast({
        title: "成功",
        description: `成功生成${data.questions.length}道题目`,
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "生成题目时出现错误",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddToLibrary = async () => {
    try {
      const response = await fetch("/api/questions/library", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions: generatedQuestions,
          courseName: courseName || (file ? file.name.split('.')[0] : "未命名课程"),
        }),
      })

      if (!response.ok) {
        throw new Error("添加到题库失败")
      }

      toast({
        title: "成功",
        description: "题目已添加到您的自定义题库",
      })
      
      // 清空生成的题目
      setGeneratedQuestions([])
      setCourseName("")
      setSelectedTypes([])
      setFile(null)
      setContent("")
    } catch (error) {
      toast({
        title: "错误",
        description: "添加到题库时出现错误",
        variant: "destructive",
      })
    }
  }

  const renderTypeLabel = (type: string) => {
    switch(type) {
      case "multiple_choice": return "单选题";
      case "multiple_answer": return "多选题";
      case "fill_blank": return "填空题";
      case "short_answer": return "简答题";
      case "true_false": return "判断题";
      default: return type;
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>智能导题</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="courseName">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="courseName" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span>课程名称</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>内容粘贴</span>
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>文件上传</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="space-y-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="courseName">课程名称</Label>
              <Input
                id="courseName"
                placeholder="输入课程名称，如：操作系统、数据结构"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />
            </div>
            
            <TabsContent value="courseName">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  输入课程名称，AI将根据课程自动生成相关题目。
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="content">
              <div className="space-y-2">
                <Label htmlFor="content">粘贴课本或PPT内容</Label>
                <Textarea
                  id="content"
                  placeholder="将教材内容、PPT文本或其他学习资料粘贴到这里..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="file">
              <div className="space-y-2">
                <Label>上传教材或题库文件</Label>
                <Input
                  type="file"
                  accept=".pdf,.txt,.json,.xlsx,.xls,.docx,.doc"
                  onChange={handleFileChange}
                />
                <p className="text-sm text-gray-500">
                  支持PDF、Word、TXT、Excel、JSON格式
                </p>
              </div>
            </TabsContent>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>题目数量</Label>
                <Select 
                  value={questionCount} 
                  onValueChange={setQuestionCount}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择题目数量" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3道题</SelectItem>
                    <SelectItem value="5">5道题</SelectItem>
                    <SelectItem value="10">10道题</SelectItem>
                    <SelectItem value="15">15道题</SelectItem>
                    <SelectItem value="20">20道题</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>题目类型</Label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {questionTypes.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.id}
                        checked={selectedTypes.includes(type.id)}
                        onCheckedChange={() => handleTypeChange(type.id)}
                      />
                      <Label htmlFor={type.id} className="text-sm">{type.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => handleGenerate(
              document.querySelector('[data-state="active"][role="tab"]')?.getAttribute('value') || 'courseName'
            )}
            disabled={isGenerating}
            className="w-full mb-4"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              "生成题目"
            )}
          </Button>
          
          {generatedQuestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">生成的题目</h3>
                <p className="text-sm text-gray-500">共 {generatedQuestions.length} 道题</p>
              </div>
              
              <div className="max-h-[500px] overflow-y-auto pr-2">
                {generatedQuestions.map((question, index) => (
                  <Card key={question.id || index} className="overflow-hidden mb-3">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <p className="font-medium">题目 {index + 1}（{renderTypeLabel(question.type)}）</p>
                        <p>{question.content}</p>
                        {question.options && (
                          <div className="ml-4 space-y-1">
                            {question.options.map((option, i) => (
                              <p key={i} className="text-sm">{String.fromCharCode(65 + i)}. {option}</p>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 p-2 bg-gray-50 rounded-md">
                          <p className="text-sm font-medium text-gray-700">
                            答案：{question.answer}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            解析：{question.explanation}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Button onClick={handleAddToLibrary} className="w-full">
                添加到自定义题库
              </Button>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
} 