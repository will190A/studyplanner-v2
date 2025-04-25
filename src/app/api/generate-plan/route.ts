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

// Moonshot API 配置
const MOONSHOT_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

// 测试模式：如果没有环境变量，使用以下硬编码值(请在实际使用时替换为真实的密钥)
const TEST_API_KEY = ''; // 请填入测试 API 密钥，仅用于开发测试

export async function POST(req: Request) {
  try {
    const { subjects, startDate, endDate, dailyHours } = await req.json();
    
    console.log('收到请求:', { subjects, startDate, endDate, dailyHours });

    if (!subjects || !startDate || !endDate || !dailyHours) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 检查环境变量
    console.log('检查 MOONSHOT_API_KEY 环境变量...');
    console.log('API 密钥是否存在:', !!process.env.MOONSHOT_API_KEY);
    // 不打印实际密钥，但打印密钥长度作为参考
    if (process.env.MOONSHOT_API_KEY) {
      console.log('API 密钥长度:', process.env.MOONSHOT_API_KEY.length);
    }

    let apiKey = process.env.MOONSHOT_API_KEY || TEST_API_KEY;
    
    if (!apiKey) {
      console.log('无法获取 Moonshot API 密钥，请检查 .env 文件或设置测试密钥');
      return NextResponse.json({ 
        error: 'API密钥未配置，请检查环境变量或设置测试密钥' 
      }, { status: 500 });
    }

    // 从查询参数中获取测试密钥(仅开发环境使用)
    if (process.env.NODE_ENV === 'development') {
      const url = new URL(req.url);
      const testKey = url.searchParams.get('apiKey');
      if (testKey && testKey.length > 0) {
        console.log('使用查询参数中的测试 API 密钥');
        apiKey = testKey;
      }
    }

    console.log('开始使用 Moonshot AI 生成计划...');
    
    try {
      // 直接使用 Moonshot AI 生成计划
      console.log('调用 generateMoonshotPlan 函数...');
      const aiTasks = await generateMoonshotPlan(subjects, startDate, endDate, dailyHours, apiKey);
      
      // 检查是否成功获取任务
      if (aiTasks && aiTasks.length > 0) {
        console.log(`成功从 Moonshot AI 获取到 ${aiTasks.length} 个学习任务`);
        return NextResponse.json({ tasks: aiTasks });
      } else {
        console.log('未获取到有效的学习任务');
        return NextResponse.json({ 
          error: 'AI 未能生成有效计划，请稍后再试' 
        }, { status: 500 });
      }
    } catch (error) {
      console.error('生成计划错误:', error);
      return NextResponse.json(
        { error: '生成计划失败: ' + (error instanceof Error ? error.message : String(error)) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('请求处理错误:', error);
    return NextResponse.json(
      { error: '处理请求时发生错误: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// 使用 Moonshot API 生成计划
async function generateMoonshotPlan(subjects: string[], startDate: string, endDate: string, dailyHours: number, apiKey: string): Promise<Task[]> {
  // 构建提示词
  const prompt = `生成学习计划：科目 ${subjects.join('、')}，从 ${startDate} 到 ${endDate}，每天 ${dailyHours} 小时。

请严格按照以下JSON格式返回计划，不要有任何前后的说明文字：
[
  {
    "id": "task-1",
    "date": "2023-05-15",  // 使用YYYY-MM-DD格式
    "subject": "数学",      // 必须是用户提供的科目之一
    "description": "线性代数基础概念学习",  // 具体的学习内容描述
    "duration": 1.5,       // 小时数，精确到小数点后一位
    "completed": false     // 初始都是false
  },
  {
    "id": "task-2",
    "date": "2023-05-15",
    "subject": "英语",
    "description": "词汇记忆与阅读理解练习",
    "duration": 1.0,
    "completed": false
  }
]

要求：
1. 每日总学习时间应接近但不超过${dailyHours}小时
2. 科目应均衡分布在计划中
3. 学习任务要具体且合理，针对每个科目设计相应的学习内容
4. 每个任务的id必须唯一
5. 创建足够的任务覆盖从${startDate}到${endDate}的所有日期`;

  console.log('正在发送请求到 Moonshot API...');
  console.log('请求参数:', {
    model: 'moonshot-v1-32k',
    temperature: 0.7,
    max_tokens: 4000,
    prompt_length: prompt.length,
    subjects_count: subjects.length
  });
  
  try {
    // 调用 Moonshot API
    const requestBody = {
      model: 'moonshot-v1-32k',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的学习计划生成器。你需要创建详细、合理的学习计划，并以JSON格式返回。不要包含任何额外的解释文字，只返回有效的JSON数组。每个任务必须包含id、date、subject、description、duration和completed字段。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      stream: false,
      max_tokens: 4000,
    };
    
    // 完整打印请求内容（不包含API密钥）
    console.log('================ 向 Moonshot AI 发送的完整请求 ================');
    console.log(JSON.stringify(requestBody, null, 2));
    console.log('===============================================================');
    
    const response = await fetch(MOONSHOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      ...(proxyAgent ? { agent: proxyAgent } : {}),
      body: JSON.stringify(requestBody),
    });

    console.log('Moonshot API 响应状态:', response.status);
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error('API 请求失败，响应内容:', responseText);
      throw new Error(`API请求失败: ${response.status}, 响应: ${responseText.substring(0, 200)}`);
    }
    
    const data = await response.json();
    console.log('API 响应结构:', Object.keys(data));
    
    // 完整打印 API 返回的数据
    console.log('================ Moonshot AI 返回的完整响应 ================');
    console.log(JSON.stringify(data, null, 2));
    console.log('==============================================================');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('API 返回数据结构不正确:', JSON.stringify(data).substring(0, 200));
      throw new Error('API返回格式不正确');
    }

    // 尝试解析返回的JSON内容
    const content = data.choices[0].message.content.trim();
    console.log('API返回内容前300字符:', content.substring(0, 300));
    console.log('API返回内容末尾300字符:', content.length > 300 ? content.substring(content.length - 300) : '');
    
    try {
      // 提取JSON部分
      const jsonMatch = content.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (jsonMatch) {
        console.log('从返回内容中提取到JSON部分');
      } else {
        console.log('未能从返回内容中提取JSON部分，尝试直接解析');
      }
      const jsonContent = jsonMatch ? jsonMatch[0] : content;
      
      const tasks = JSON.parse(jsonContent);
      console.log('JSON解析成功，结果类型:', Array.isArray(tasks) ? 'Array' : typeof tasks);
      
      // 验证返回的数据格式
      if (!Array.isArray(tasks)) {
        throw new Error('AI返回的计划不是数组格式');
      }
      
      console.log('返回的任务数量:', tasks.length);
      if (tasks.length > 0) {
        console.log('第一个任务示例:', JSON.stringify(tasks[0]));
      }
      
      // 验证每个任务是否包含所需字段
      const validTasks = tasks.filter(task => 
        task.id && task.date && task.subject && 
        task.description && typeof task.duration === 'number' && 
        (typeof task.completed === 'boolean' || task.completed === false)
      );
      
      console.log('有效任务数量:', validTasks.length);
      
      if (validTasks.length === 0) {
        throw new Error('AI返回的计划中没有有效任务');
      }
      
      console.log(`成功解析 ${validTasks.length} 个有效学习任务`);
      return validTasks;
    } catch (error) {
      console.error('解析AI返回内容失败:', error);
      throw new Error('无法解析AI返回的计划内容');
    }
  } catch (error) {
    console.error('API调用或解析过程出错:', error);
    throw error;
  }
} 