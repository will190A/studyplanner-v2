import { NextResponse } from 'next/server';
import { MoonshotAPI } from "@/lib/moonshot";

export async function POST(request: Request) {
  try {
    let content: string;
    try {
      const body = await request.json();
      content = body.content;
    } catch (e) {
      return NextResponse.json({ error: '无效的JSON格式' }, { status: 400 });
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: '内容不能为空且必须是字符串' }, { status: 400 });
    }

    // 使用 MoonshotAPI 提取课程名称
    const moonshot = new MoonshotAPI();
    const prompt = `请从以下文本中提取出最可能的课程名称：

${content}

规则：
1. 返回的课程名称应该在2-20个字符之间
2. 优先提取正式的课程名称，如"数据结构"、"计算机网络"等
3. 如果是章节内容，提取主要学科名称
4. 去除无关的修饰词，如"课件"、"讲义"、"第X章"等
5. 只返回课程名称，不要包含任何其他文字
6. 如果无法提取出合适的课程名称，返回空字符串

请直接返回提取出的课程名称，不要包含任何其他解释或说明。`;

    const courseName = await moonshot.generate(prompt);
    
    return NextResponse.json({ courseName: courseName.trim() });

  } catch (error: any) {
    console.error('提取课程名称时出错:', error);
    return NextResponse.json({ 
      error: '提取课程名称失败',
      message: error.message || '未知错误'
    }, { status: 500 });
  }
} 