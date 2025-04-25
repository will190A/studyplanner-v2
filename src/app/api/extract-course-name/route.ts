import { NextResponse } from 'next/server';
import { MoonshotAPI } from "@/lib/moonshot";

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    
    if (!content) {
      return NextResponse.json(
        { error: "请提供内容" },
        { status: 400 }
      );
    }

    // 构建提示词
    const prompt = `请分析以下教学内容，提取出这段内容最可能属于的课程名称。要求：
1. 返回一个简短的课程名称（2-10个字符）
2. 不要包含章节号、标点符号等
3. 优先提取常见课程名称，如：数据结构、计算机网络、操作系统等
4. 如果内容不明确，返回空字符串
5. 只返回课程名称，不要其他任何解释或标点

内容：
${content.slice(0, 1000)}`;

    // 调用AI接口提取课程名称
    const moonshot = new MoonshotAPI();
    const courseName = await moonshot.generate(prompt);
    
    // 清理结果
    const cleanedName = courseName
      .trim()
      .replace(/^[第一二三四五六七八九十]+[章节]/, '') // 移除章节号
      .replace(/^[0-9.]+/, '') // 移除数字编号
      .replace(/[:：].*$/, '') // 移除冒号及其后内容
      .replace(/[《》]/g, '') // 移除书名号
      .trim();

    // 验证提取的课程名称
    if (cleanedName.length >= 2 && cleanedName.length <= 10) {
      return NextResponse.json({ courseName: cleanedName });
    } else {
      return NextResponse.json({ courseName: "" });
    }

  } catch (error) {
    console.error("提取课程名称失败:", error);
    return NextResponse.json(
      { error: "提取课程名称失败" },
      { status: 500 }
    );
  }
} 