'use client'

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, FileUp, Clock, Sparkles, Plus, AlertCircle, BookOpen, Clipboard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

// 生成器表单验证
const generatorFormSchema = z.object({
  inputMethod: z.enum(['courseName', 'paste', 'upload']),
  courseName: z.string().optional(),
  content: z.string().optional(),
  file: z.any().optional(),
  questionTypes: z.array(z.string()).min(1, '请至少选择一种题型'),
  count: z.string().min(1, '请选择生成题目数量'),
  libraryName: z.string().optional(),
  addToExisting: z.boolean().default(false),
  existingLibrary: z.string().optional(),
});

type GeneratorFormValues = z.infer<typeof generatorFormSchema>;

// 问题类型选项
const questionTypeOptions = [
  { id: 'multiple_choice', name: '单选题' },
  { id: 'multiple_answer', name: '多选题' },
  { id: 'fill_blank', name: '填空题' },
  { id: 'short_answer', name: '简答题' },
  { id: 'true_false', name: '判断题' },
];

// 题目数量选项
const countOptions = [
  { value: '3', label: '3题' },
  { value: '5', label: '5题' },
  { value: '10', label: '10题' },
  { value: '15', label: '15题' },
  { value: '20', label: '20题' },
];

// 估算生成时间（秒）
const estimateGenerationTime = (count: number): number => {
  // 基础时间10秒，每道题增加5秒
  return 10 + count * 5;
};

export default function QuestionGenerator() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customLibraries, setCustomLibraries] = useState<{name: string, count: number}[]>([]);
  const [successDialog, setSuccessDialog] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationTime, setGenerationTime] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  // 获取自定义题库列表
  useEffect(() => {
    fetchCustomLibraries();
  }, []);

  const fetchCustomLibraries = async () => {
    try {
      const response = await fetch('/api/questions/library?limit=100');
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.questions && Array.isArray(data.questions)) {
          // 按科目分组题目
          const subjectGroups: Record<string, any[]> = {};
          
          data.questions.forEach((question: any) => {
            if (!subjectGroups[question.subject]) {
              subjectGroups[question.subject] = [];
            }
            subjectGroups[question.subject].push(question);
          });
          
          // 转换为数组格式
          const libraries = Object.entries(subjectGroups).map(([subject, questions]) => ({
            name: subject,
            count: questions.length
          }));
          
          setCustomLibraries(libraries);
        }
      }
    } catch (error) {
      console.error('获取自定义题库失败:', error);
    }
  };

  // 表单处理
  const form = useForm<GeneratorFormValues>({
    resolver: zodResolver(generatorFormSchema),
    defaultValues: {
      inputMethod: 'courseName',
      courseName: '',
      content: '',
      questionTypes: ['multiple_choice'],
      count: '5',
      addToExisting: false,
      existingLibrary: '',
    }
  });

  // 监听输入方式变化
  const inputMethod = form.watch('inputMethod');
  const addToExisting = form.watch('addToExisting');
  
  // 当paste或upload时，自动从内容中提取可能的课程名称
  useEffect(() => {
    if (inputMethod === 'paste') {
      const content = form.getValues('content');
      if (content && !form.getValues('courseName')) {
        // 尝试从内容中提取可能的课程名
        const possibleTitle = extractCourseName(content);
        if (possibleTitle) {
          form.setValue('courseName', possibleTitle);
        }
      }
    }
  }, [form.watch('content')]);

  // 从内容中提取可能的课程名称
  const extractCourseName = (content: string): string => {
    // 查找常见的课程名称格式
    // 例如：第一章 XXX课程，XXX导论，XXX概论，等
    const patterns = [
      /《([^》]{2,20})》/,  // 查找书名号中的内容
      /第[一二三四五六七八九十\d]+章\s*([^\n]{2,20})/,  // 查找章节标题
      /(\w{2,20})(概论|导论|原理|基础|入门)/,  // 查找常见课程后缀
      /(\w{2,20})(学)/  // 查找"XX学"的模式
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // 如果没有找到匹配的模式，尝试提取内容的前几个字符作为标题
    if (content.length > 10) {
      const firstLine = content.split('\n')[0].trim();
      if (firstLine.length > 5 && firstLine.length < 30) {
        return firstLine;
      }
    }
    
    return '';
  };

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('file', file);
      
      // 从文件名中提取可能的课程名
      const fileName = file.name.replace(/\.\w+$/, '');
      if (fileName.length >= 2 && fileName.length <= 20 && !form.getValues('courseName')) {
        form.setValue('courseName', fileName);
      }
    }
  };

  // 开始AI生成题目
  const onSubmit = async (data: GeneratorFormValues) => {
    try {
      setLoading(true);
      setQuestions([]);
      
      // 准备表单数据
      const formData = new FormData();
      
      // 如果用户选择添加到现有题库，并且已选择题库
      let finalLibraryName = data.courseName || '';
      if (data.addToExisting && data.existingLibrary) {
        finalLibraryName = data.existingLibrary;
      } else if (data.libraryName) {
        finalLibraryName = data.libraryName;
      }

      // 添加必要字段到表单
      formData.append('courseName', finalLibraryName);
      formData.append('types', JSON.stringify(data.questionTypes));
      formData.append('count', data.count);
      
      // 根据输入方式添加不同内容
      if (data.inputMethod === 'paste' && data.content) {
        formData.append('content', data.content);
      } else if (data.inputMethod === 'upload' && data.file) {
        formData.append('file', data.file);
      }
      
      // 开始进度指示
      const estimatedTime = estimateGenerationTime(parseInt(data.count));
      setGenerationTime(estimatedTime);
      setGenerationProgress(0);
      
      // 设置进度条更新
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      
      progressInterval.current = setInterval(() => {
        setGenerationProgress(prev => {
          // 逐渐增加到90%，留10%给最终的解析和处理
          if (prev < 90) {
            return prev + (90 - prev) / 10;
          }
          return prev;
        });
      }, 1000);
      
      // 发送请求
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        body: formData
      });
      
      // 设置进度为100%
      setGenerationProgress(100);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '生成题目失败');
      }
      
      const result = await response.json();
      
      // 检查是否有警告信息
      if (result.warning) {
        toast({
          title: "提示",
          description: result.warning,
          variant: "default"
        });
      }
      
      if (result.questions && result.questions.length > 0) {
        setQuestions(result.questions);
        
        // 保存到题库
        const saveResponse = await fetch('/api/questions/library', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questions: result.questions,
          }),
        });
        
        if (saveResponse.ok) {
          setSuccessDialog(true);
        } else {
          throw new Error('保存题目到题库失败');
        }
      } else {
        throw new Error('生成的题目为空');
      }
    } catch (error: any) {
      console.error('生成题目失败:', error);
      toast({
        title: "生成失败",
        description: error.message || "生成题目时发生错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    }
  };

  // 清除文件选择
  const clearFileSelection = () => {
    form.setValue('file', undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 返回题库页面
  const backToLibrary = () => {
    router.push('/practice');
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="w-full">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-8">
                {/* 导入方式选择 */}
                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="inputMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>选择导入方式</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-3 gap-4">
                            <div 
                              className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                field.value === 'courseName' 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-gray-200 hover:border-primary/50'
                              }`}
                              onClick={() => field.onChange('courseName')}
                            >
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                <BookOpen className="h-6 w-6 text-primary" />
                              </div>
                              <span className="text-sm font-medium">输入课程名称</span>
                            </div>
                            <div 
                              className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                field.value === 'paste' 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-gray-200 hover:border-primary/50'
                              }`}
                              onClick={() => field.onChange('paste')}
                            >
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                <Clipboard className="h-6 w-6 text-primary" />
                              </div>
                              <span className="text-sm font-medium">粘贴教材内容</span>
                            </div>
                            <div 
                              className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                field.value === 'upload' 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-gray-200 hover:border-primary/50'
                              }`}
                              onClick={() => field.onChange('upload')}
                            >
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                <FileUp className="h-6 w-6 text-primary" />
                              </div>
                              <span className="text-sm font-medium">上传文件</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 输入区域 */}
                <div className="w-full">
                  {/* 课程名输入 */}
                  <FormField
                    control={form.control}
                    name="courseName"
                    render={({ field }) => (
                      <FormItem className="mt-6">
                        <FormLabel>
                          {inputMethod === 'courseName' ? '课程名称' : '题库名称 (可选)'}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={inputMethod === 'courseName' ? "请输入课程名称，如：数据结构" : "留空将从内容自动提取"}
                            {...field} 
                            required={inputMethod === 'courseName'}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 内容粘贴区域 */}
                  {inputMethod === 'paste' && (
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem className="mt-6">
                          <FormLabel>粘贴教材内容</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="粘贴教材、课件或笔记内容 (最多5000字符)"
                              className="h-32 resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* 文件上传区域 */}
                  {inputMethod === 'upload' && (
                    <div className="mt-6">
                      <FormLabel>上传文件</FormLabel>
                      {!form.getValues('file') ? (
                        <div 
                          className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary cursor-pointer transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="flex flex-col items-center">
                            <FileUp className="h-10 w-10 text-gray-400 mb-2" />
                            <p className="text-sm font-medium text-gray-700 mb-1">点击或拖拽文件到此处上传</p>
                            <p className="text-xs text-gray-500">支持 TXT, DOC, DOCX, JSON 格式</p>
                          </div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".txt,.doc,.docx,.json"
                            onChange={handleFileChange}
                          />
                        </div>
                      ) : (
                        <div className="mt-2 border rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                              <FileUp className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                                {(form.getValues('file') as File).name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {((form.getValues('file') as File).size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearFileSelection}
                          >
                            重新选择
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 题型和数量选择 */}
                <div className="w-full">
                  {/* 选择题型 */}
                  <FormField
                    control={form.control}
                    name="questionTypes"
                    render={() => (
                      <FormItem className="mt-6">
                        <div className="mb-2">
                          <FormLabel>题型选择 (可多选)</FormLabel>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {questionTypeOptions.map((option) => (
                            <FormField
                              key={option.id}
                              control={form.control}
                              name="questionTypes"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={option.id}
                                    className="flex items-center space-x-1"
                                  >
                                    <FormControl>
                                      <Button
                                        type="button"
                                        variant={field.value?.includes(option.id) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                          const current = [...field.value || []];
                                          const index = current.indexOf(option.id);
                                          if (index > -1) {
                                            current.splice(index, 1);
                                          } else {
                                            current.push(option.id);
                                          }
                                          field.onChange(current.length > 0 ? current : [option.id]);
                                        }}
                                      >
                                        {field.value?.includes(option.id) && (
                                          <CheckCircle2 className="mr-1 h-3 w-3" />
                                        )}
                                        {option.name}
                                      </Button>
                                    </FormControl>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 题目数量选择 */}
                  <FormField
                    control={form.control}
                    name="count"
                    render={({ field }) => (
                      <FormItem className="mt-6">
                        <FormLabel>生成题目数量</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-2">
                            {countOptions.map((option) => (
                              <Button
                                key={option.value}
                                type="button"
                                variant={field.value === option.value ? "default" : "outline"}
                                size="sm"
                                onClick={() => field.onChange(option.value)}
                              >
                                {option.label}
                              </Button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 生成按钮 */}
          <div className="flex justify-center">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full md:w-auto px-8 bg-gradient-to-r from-purple-500 to-purple-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                  <span>AI正在生成题目...</span>
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  <span>开始生成题目</span>
                </>
              )}
            </Button>
          </div>
          
          {/* 生成中显示进度条 */}
          {loading && (
            <Card className="p-4 border border-amber-200 bg-amber-50">
              <div className="flex items-center mb-2">
                <Clock className="h-5 w-5 text-amber-600 mr-2" />
                <h3 className="font-medium text-amber-800">
                  AI正在为您生成题目，请耐心等待...
                </h3>
              </div>
              <div className="space-y-2">
                <Progress value={generationProgress} className="h-2" />
                <p className="text-xs text-amber-600 text-center">
                  预计需要 {generationTime} 秒，已完成 {Math.round(generationProgress)}%
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  提示：生成速度取决于题目数量和内容复杂度，AI正在分析内容并创建高质量题目
                </p>
              </div>
            </Card>
          )}
        </form>
      </Form>

      {/* 生成成功弹窗 */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-600">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              题目生成成功
            </DialogTitle>
            <DialogDescription>
              您的题目已成功生成并添加到题库中
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="rounded-lg bg-green-50 p-4 border border-green-100 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">成功添加 {questions.length} 道题目到题库</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>题库名称：{form.getValues('addToExisting') ? form.getValues('existingLibrary') : (form.getValues('libraryName') || form.getValues('courseName'))}</p>
                    <p>题型组合：{form.getValues('questionTypes').map(id => questionTypeOptions.find(opt => opt.id === id)?.name).join('、')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button variant="outline" onClick={() => setSuccessDialog(false)}>
              继续生成题目
            </Button>
            <Button onClick={backToLibrary}>
              返回题库
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 