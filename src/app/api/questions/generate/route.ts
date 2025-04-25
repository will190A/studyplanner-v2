import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { MoonshotAPI } from "@/lib/moonshot"
import mammoth from 'mammoth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const courseName = formData.get("courseName") as string
    const types = JSON.parse(formData.get("types") as string)
    const file = formData.get("file") as File | null
    const contentFromForm = formData.get("content") as string | null
    const count = parseInt(formData.get("count") as string || "5")
    const inputMethod = formData.get("inputMethod") as string

    // 处理内容来源
    let content = ""
    
    // 如果有粘贴的内容
    if (contentFromForm) {
      content = contentFromForm.slice(0, 5000) // 限制内容长度以避免 token 过多
    }
    // 如果有上传的文件
    else if (file) {
      try {
        // 处理不同文件类型
        if (file.type === "text/plain" || file.name.endsWith(".txt")) {
          const buffer = await file.arrayBuffer();
          const text = new TextDecoder().decode(buffer);
          content = text.slice(0, 5000);
        } else if (file.type === "application/json" || file.name.endsWith(".json")) {
          const buffer = await file.arrayBuffer();
          const text = new TextDecoder().decode(buffer);
          try {
            const json = JSON.parse(text);
            content = JSON.stringify(json, null, 2).slice(0, 5000);
          } catch (error) {
            throw new Error("JSON文件格式不正确");
          }
        } else {
          throw new Error("不支持的文件类型，仅支持txt和json文件");
        }

        if (!content.trim()) {
          throw new Error("文件内容为空");
        }

        console.log("成功读取文件内容:", content.slice(0, 100) + "..."); // 添加日志
      } catch (error: any) {
        console.error("处理文件失败:", error);
        return NextResponse.json(
          { error: error.message || "处理文件失败" },
          { status: 400 }
        );
      }
    }

    if (!content && inputMethod !== "courseName") {
      return NextResponse.json(
        { error: "请提供教材内容" },
        { status: 400 }
      );
    }

    // 转换题型ID为中文
    const typeLabels: Record<string, string> = {
      "multiple_choice": "单选题",
      "multiple_answer": "多选题",
      "fill_blank": "填空题",
      "short_answer": "简答题",
      "true_false": "判断题"
    }

    const typeNames = types.map((type: string) => typeLabels[type] || type)

    // 构建提示词
    const prompt = `请根据以下信息生成${count}道${courseName}相关的题目：

${content ? `参考以下内容：
${content}

` : ''}
要求：
1. 生成的题目类型包括：${typeNames.join('、')}
2. 每个题目必须包含题干(content)、答案(answer)和解析(explanation)
3. 选择题必须包含选项(options)数组
4. 生成的JSON必须是有效的且可以被解析为JavaScript对象
5. 题目难度要适中，不要太简单或太难
6. 题目内容要准确，符合学科规范
7. 解析要详细说明为什么正确答案是正确的，以及为什么其他选项是错误的
8. 所有题目必须与${courseName}课程内容相关
9. 如果提供了教材内容，应该基于教材内容出题
10. 对于填空题：
    - 如果有多个空需要填写，答案之间使用空格分隔
    - 在题干中使用下划线"_____"表示填空位置
    - 在解析中要说明每个空的答案及其解释
    - 示例：题目"计算机网络的两个重要特征是_____和_____"，答案"分布式 自治"

请按照以下JSON格式返回题目：
{
  "questions": [
    {
      "type": "类型",
      "content": "题干",
      "options": ["选项A", "选项B", "选项C", "选项D"], // 仅选择题需要
      "answer": "答案", // 填空题多个答案用顿号分隔
      "explanation": "解析"
    }
  ]
}`

    // 调用Moonshot API生成题目
    const moonshot = new MoonshotAPI()
    let responseText = ""
    try {
      responseText = await moonshot.generate(prompt)
      
      // 如果响应包含```json和```标记，提取中间的JSON部分
      const jsonRegex = /```(?:json)?\s*([\s\S]*?)```/;
      const jsonMatch = responseText.match(jsonRegex);
      if (jsonMatch && jsonMatch[1]) {
        responseText = jsonMatch[1].trim();
      }
      
      // 确保responseText是一个完整的JSON
      if (!responseText.startsWith('{')) {
        responseText = responseText.substring(responseText.indexOf('{'));
      }
      
      if (!responseText.endsWith('}')) {
        responseText = responseText.substring(0, responseText.lastIndexOf('}') + 1);
      }
      
      // 解析并验证JSON
      const responseData = JSON.parse(responseText);
      
      // 确保返回数据格式正确
      if (!responseData.questions || !Array.isArray(responseData.questions)) {
        throw new Error("生成的数据格式不正确");
      }
      
      // 处理生成的题目
      const questions = responseData.questions.map((q: any, index: number) => {
        // 确保题型正确
        let type = q.type;
        if (type === '填空题') type = 'fill_blank';
        else if (type === '单选题') type = 'multiple_choice';
        else if (type === '多选题') type = 'multiple_answer';
        else if (type === '判断题') type = 'true_false';
        else if (type === '简答题') type = 'short_answer';
        
        return {
          ...q,
          id: q.id || `generated-${Date.now()}-${index}`, // 确保每个题目有ID
          subject: courseName, // 确保所属科目正确
          type: type || types[index % types.length] // 使用转换后的类型
        };
      });
      
      return NextResponse.json({ questions });
    } catch (error) {
      console.error("生成题目失败:", error);
      return NextResponse.json(
        { error: "生成题目失败，请稍后重试" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("生成题目失败:", error);
    return NextResponse.json(
      { error: "生成题目失败" },
      { status: 500 }
    );
  }
}

// 生成 mock 题目作为后备方案
function generateMockQuestions(courseName: string, types: string[], count: number) {
  const questions = [];
  
  for (let i = 0; i < count; i++) {
    // 循环使用题型
    const typeIndex = i % types.length;
    const type = types[typeIndex];
    
    let question: any = {
      id: `mock-${Date.now()}-${i}`,
      type,
      content: "",
      answer: "",
      explanation: `这是一个自动生成的模拟题目，由于API返回数据解析失败而创建。`,
      subject: courseName
    };
    
    // 根据题型生成不同内容
    switch (type) {
      case "multiple_choice":
        question.content = `在${courseName}中，以下哪一项是正确的描述？`;
        question.options = [
          "这是选项 A 的内容",
          "这是选项 B 的内容",
          "这是选项 C 的内容",
          "这是选项 D 的内容"
        ];
        question.answer = "A";
        break;
        
      case "multiple_answer":
        question.content = `在${courseName}中，以下哪些选项是正确的？（多选）`;
        question.options = [
          "这是选项 A 的内容",
          "这是选项 B 的内容",
          "这是选项 C 的内容",
          "这是选项 D 的内容"
        ];
        question.answer = "A,C";
        break;
        
      case "fill_blank":
        question.content = `在${courseName}中，________ 是一个重要的概念。`;
        question.answer = "某个概念名称";
        break;
        
      case "short_answer":
        question.content = `简述${courseName}中的一个核心原理。`;
        question.answer = "这是一个关于核心原理的简要回答。由于API返回数据解析错误，这是一个示例答案。";
        break;
        
      case "true_false":
        question.content = `在${courseName}中，某个概念是最基础的概念之一。这个说法是正确的吗？`;
        question.answer = "正确";
        break;
    }
    
    questions.push(question);
  }
  
  return questions;
}