import { NextResponse } from 'next/server';
import { HttpsProxyAgent } from 'https-proxy-agent';

// 配置代理（如果需要）
const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

const MOONSHOT_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const proxyAgent = new HttpsProxyAgent(process.env.HTTPS_PROXY || '');

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
      return NextResponse.json(
        { error: 'Moonshot API key未配置' },
        { status: 500 }
      );
    }

    // 计算日期范围内的天数
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // 构建提示词
    const prompt = `你是一个学习计划生成器。请根据以下信息生成一个学习计划，并以JSON数组格式返回。

输入信息：
- 科目：${subjects.join('、')}
- 开始日期：${startDate}
- 结束日期：${endDate}
- 每日学习时长：${dailyHours}小时

要求：
1. 每天的任务总时长必须严格等于${dailyHours}小时
2. 每个任务必须包含以下字段：
   - id: 唯一标识符（格式：task-1, task-2等）
   - date: 日期（格式：YYYY-MM-DD）
   - subject: 科目名称
   - description: 任务描述
   - duration: 任务时长（小时，精确到小数点后两位）
   - completed: 是否完成（默认为false）

请直接返回一个JSON数组，不要包含任何其他文字。示例格式：
[
  {
    "id": "task-1",
    "date": "${startDate}",
    "subject": "${subjects[0]}",
    "description": "具体的学习任务描述",
    "duration": 1.5,
    "completed": false
  }
]`;

    console.log('Sending request to Moonshot API...');
    const response = await fetch(MOONSHOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MOONSHOT_API_KEY}`,
      },
      agent: proxyAgent,
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: '你是一个学习计划生成器。请严格按照要求返回JSON格式的数据，不要包含任何其他文字。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        stream: false,
      }),
    });

    console.log('Moonshot API response status:', response.status);
    const data = await response.json();
    console.log('Moonshot API response:', data);

    if (!response.ok) {
      console.error('Moonshot API error:', data);
      return NextResponse.json(
        { error: '生成计划失败' },
        { status: 500 }
      );
    }

    // 解析AI返回的内容
    const content = data.choices[0].message.content;
    console.log('Raw content from API:', content);
    
    // 尝试提取JSON部分
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in response');
      return NextResponse.json(
        { error: 'API返回格式不正确' },
        { status: 500 }
      );
    }

    let tasks;
    try {
      tasks = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return NextResponse.json(
        { error: '解析计划失败' },
        { status: 500 }
      );
    }

    // 验证任务格式
    if (!Array.isArray(tasks)) {
      return NextResponse.json(
        { error: '计划格式不正确' },
        { status: 500 }
      );
    }

    // 验证每个任务是否包含必要字段
    for (const task of tasks) {
      if (!task.id || !task.date || !task.subject || !task.description || typeof task.duration !== 'number' || typeof task.completed !== 'boolean') {
        return NextResponse.json(
          { error: '任务格式不正确' },
          { status: 500 }
        );
      }
    }

    // 按日期分组任务
    const tasksByDate: { [date: string]: any[] } = {};
    tasks.forEach(task => {
      if (!tasksByDate[task.date]) {
        tasksByDate[task.date] = [];
      }
      tasksByDate[task.date].push(task);
    });

    // 验证每天的任务总时长
    for (const [date, dateTasks] of Object.entries(tasksByDate)) {
      const totalHours = dateTasks.reduce((sum, task) => sum + task.duration, 0);
      if (Math.abs(totalHours - dailyHours) > 0.01) { // 允许0.01小时的误差
        console.error(`Date ${date} has incorrect total hours: ${totalHours}, expected: ${dailyHours}`);
        // 调整任务时长
        const adjustmentFactor = dailyHours / totalHours;
        dateTasks.forEach(task => {
          task.duration = Number((task.duration * adjustmentFactor).toFixed(2));
        });
      }
    }

    // 重新计算总时长
    const finalTasks = Object.values(tasksByDate).flat();
    const finalTotalHours = finalTasks.reduce((sum, task) => sum + task.duration, 0);
    console.log('Final total hours:', finalTotalHours);

    return NextResponse.json({ tasks: finalTasks });
  } catch (error) {
    console.error('Error in generate-plan:', error);
    return NextResponse.json(
      { error: '生成计划时发生错误' },
      { status: 500 }
    );
  }
} 