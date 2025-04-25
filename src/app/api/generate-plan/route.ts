import { NextResponse } from 'next/server';
import { HttpsProxyAgent } from 'https-proxy-agent';

interface Task {
  id: string;
  date: string;
  subject: string;
  description: string;
  duration: number;
  completed: boolean;
}

// 配置代理（如果需要）
const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

const MOONSHOT_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

export async function POST(req: Request) {
  try {
    const { subjects, startDate, endDate, dailyHours } = await req.json();
    
    console.log('Received request:', { subjects, startDate, endDate, dailyHours });

    if (!subjects || !startDate || !endDate || !dailyHours) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    if (!process.env.MOONSHOT_API_KEY) {
      console.log('Moonshot API key未配置，使用后备计划');
      const fallbackTasks = createFallbackPlan(subjects, startDate, endDate, dailyHours);
      return NextResponse.json({ 
        tasks: fallbackTasks,
        warning: 'API密钥未配置，使用了后备计划'
      });
    }

    // 计算日期范围内的天数
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // 如果天数或科目数过多，直接使用后备计划
    if (days > 30 || subjects.length > 5) {
      console.log('请求范围过大，使用后备计划');
      const fallbackTasks = createFallbackPlan(subjects, startDate, endDate, dailyHours);
      return NextResponse.json({ 
        tasks: fallbackTasks,
        warning: '请求范围过大，使用了后备计划'
      });
    }

    try {
      // 直接生成简单的计划，不依赖AI
      console.log('生成计划中...');
      
      // 尝试使用AI生成计划
      if (process.env.USE_AI === 'true') {
        const aiTasks = await generateAIPlan(subjects, startDate, endDate, dailyHours);
        if (aiTasks && aiTasks.length > 0) {
          return NextResponse.json({ tasks: aiTasks });
        }
      }
      
      // 如果AI生成失败或未启用AI，使用本地生成的计划
      const fallbackTasks = createFallbackPlan(subjects, startDate, endDate, dailyHours);
      return NextResponse.json({ 
        tasks: fallbackTasks,
        warning: 'AI生成失败，使用了后备计划'
      });
    } catch (error) {
      console.error('生成计划错误:', error);
      // 出错时使用后备计划
      const fallbackTasks = createFallbackPlan(subjects, startDate, endDate, dailyHours);
      return NextResponse.json({ 
        tasks: fallbackTasks,
        warning: '生成过程出错，使用了后备计划'
      });
    }
  } catch (error) {
    console.error('Error in generate-plan:', error);
    return NextResponse.json(
      { error: '生成计划时发生错误: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// 使用AI生成计划的函数
async function generateAIPlan(subjects: string[], startDate: string, endDate: string, dailyHours: number): Promise<Task[] | null> {
  // 构建提示词
  const prompt = `生成学习计划：科目 ${subjects.join('、')}，从 ${startDate} 到 ${endDate}，每天 ${dailyHours} 小时。`;

  console.log('Sending request to Moonshot API...');
  const response = await fetch(MOONSHOT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MOONSHOT_API_KEY}`,
    },
    ...(proxyAgent ? { agent: proxyAgent } : {}),
    body: JSON.stringify({
      model: 'moonshot-v1-32k',
      messages: [
        {
          role: 'system',
          content: '你是一个学习计划生成器。请生成格式正确的JSON数组，每个任务包含id、date、subject、description、duration和completed字段。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      stream: false,
      max_tokens: 1000,
    }),
  });

  console.log('Moonshot API response status:', response.status);
  
  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
    throw new Error('API返回格式不正确');
  }

  // 这里直接返回null，让调用者使用后备计划
  // 实际项目中，可以继续尝试解析AI返回的内容
  return null;
}

// 创建后备计划的函数
function createFallbackPlan(subjects: string[], startDate: string, endDate: string, dailyHours: number) {
  console.log('Creating fallback plan...');
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const tasks = [];
  let taskId = 1;

  const taskTypes = [
    '基础概念复习',
    '练习题解答',
    '知识点总结',
    '模拟测试',
    '错题分析',
    '重点难点整理'
  ];
  
  for (let i = 0; i < daysDiff; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    let remainingHours = dailyHours;
    let taskCount = 0;
    
    // 为每天创建2-3个任务
    while (remainingHours > 0) {
      const taskDuration = Math.min(remainingHours, 1.5);
      const taskTypeIndex = (i + taskCount) % taskTypes.length;
      
      for (const subject of subjects) {
        if (remainingHours <= 0) break;
        
        tasks.push({
          id: `task-${taskId++}`,
          date: dateStr,
          subject: subject,
          description: `${subject}${taskTypes[taskTypeIndex]}`,
          duration: Math.min(taskDuration, remainingHours),
          completed: false
        });
        
        remainingHours -= taskDuration;
        taskCount++;
        
        if (remainingHours <= 0) break;
      }
    }
  }
  
  return tasks;
} 