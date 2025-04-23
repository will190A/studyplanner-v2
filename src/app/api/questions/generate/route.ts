import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { MoonshotAPI } from "@/lib/moonshot"

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

    // 处理内容来源
    let content = ""
    
    // 如果有粘贴的内容
    if (contentFromForm) {
      content = contentFromForm.slice(0, 5000) // 限制内容长度以避免 token 过多
    }
    // 如果有上传的文件
    else if (file) {
      // 处理不同文件类型
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const text = await file.text()
        content = text.slice(0, 5000)
      } else if (file.type === "application/json" || file.name.endsWith(".json")) {
        try {
          const text = await file.text()
          const json = JSON.parse(text)
          content = "JSON文件内容: " + JSON.stringify(json, null, 2).slice(0, 5000)
        } catch (error) {
          console.error("解析 JSON 文件失败:", error)
        }
      } else if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
        file.name.endsWith(".docx") ||
        file.type === "application/msword" ||
        file.name.endsWith(".doc")
      ) {
        // 由于处理Word文件需要特殊库，这里简化处理
        content = "上传了Word文档，但当前仅能提取文本内容。请考虑复制文档内容并使用粘贴方式。"
      } else {
        content = "上传了不支持直接解析的文件类型。建议复制文件内容并使用粘贴方式。"
      }
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
${content ? `教材内容：${content}\n` : ""}
课程名称：${courseName}
题型要求：${typeNames.join("、")}
题目数量：${count}道

请生成包含以下信息的JSON格式题目：
{
  "questions": [
    {
      "id": "唯一ID",
      "type": "${types[0]}", // 题型应为 multiple_choice, multiple_answer, fill_blank, short_answer, true_false 之一
      "content": "题目内容",
      "options": ["选项A", "选项B", "选项C", "选项D"], // 仅选择题需要
      "answer": "正确答案", // 多选题答案格式为 "A,C,D"
      "explanation": "题目解析",
      "subject": "${courseName}"
    }
  ]
}

请确保你的回复是一个有效的JSON对象，并且只包含JSON内容，不要添加任何其他文本或说明。

题型说明：
- multiple_choice: 单选题，必须包含options字段，答案为单个选项如"A"
- multiple_answer: 多选题，必须包含options字段，答案格式为"A,C,D"等
- fill_blank: 填空题，答案应为填空内容
- short_answer: 简答题，答案应为简要回答
- true_false: 判断题，答案应为"正确"或"错误"/"对"或"错"/"T"或"F"

确保每个题目的类型字段必须是下列值之一: ${types.join(", ")}。
每个题目必须包含题干(content)、答案(answer)和解析(explanation)。
选择题必须包含选项(options)数组。
生成的JSON必须是有效的且可以被解析为JavaScript对象。
尽量根据提供的内容生成难度适中的题目。`

    // 调用Moonshot API生成题目
    const moonshot = new MoonshotAPI()
    let responseText = ""
    try {
      responseText = await moonshot.generate(prompt)
      
      // 尝试修复常见的JSON格式问题
      responseText = responseText.trim()
      
      // 如果响应包含```json和```标记，提取中间的JSON部分
      const jsonRegex = /```(?:json)?\s*([\s\S]*?)```/
      const jsonMatch = responseText.match(jsonRegex)
      if (jsonMatch && jsonMatch[1]) {
        responseText = jsonMatch[1].trim()
      }
      
      // 确保responseText是一个完整的JSON
      if (!responseText.startsWith('{')) {
        responseText = responseText.substring(responseText.indexOf('{'))
      }
      
      if (!responseText.endsWith('}')) {
        responseText = responseText.substring(0, responseText.lastIndexOf('}') + 1)
      }
      
      // 解析并验证JSON
      const responseData = JSON.parse(responseText)
      
      // 确保返回数据格式正确
      if (!responseData.questions || !Array.isArray(responseData.questions)) {
        throw new Error("生成的数据格式不正确")
      }
      
      // 处理生成的题目
      const questions = responseData.questions.map((q: any, index: number) => {
        return {
          ...q,
          id: q.id || `generated-${Date.now()}-${index}`, // 确保每个题目有ID
          subject: courseName, // 确保所属科目正确
          type: q.type || types[index % types.length] // 确保题型正确
        }
      })
      
      return NextResponse.json({ questions })
    } catch (error) {
      console.error("解析生成的题目JSON失败:", error, "原始文本:", responseText)
      
      // 在解析失败时使用 mock 数据作为后备方案
      const mockQuestions = generateMockQuestions(courseName, types, count)
      return NextResponse.json({ 
        questions: mockQuestions,
        warning: "API返回数据解析失败，已生成模拟题目数据"
      })
    }
  } catch (error) {
    console.error("生成题目失败:", error)
    return NextResponse.json(
      { error: "生成题目失败" },
      { status: 500 }
    )
  }
}

// 生成 mock 题目作为后备方案
function generateMockQuestions(courseName: string, types: string[], count: number) {
  const questions = []
  
  for (let i = 0; i < count; i++) {
    // 循环使用题型
    const typeIndex = i % types.length
    const type = types[typeIndex]
    
    let question: any = {
      id: `mock-${Date.now()}-${i}`,
      type,
      content: "",
      answer: "",
      explanation: `这是一个自动生成的模拟题目，由于API返回数据解析失败而创建。`,
      subject: courseName
    }
    
    // 根据题型生成不同内容
    switch (type) {
      case "multiple_choice":
        question.content = `在${courseName}中，以下哪一项是正确的描述？`
        question.options = [
          "这是选项 A 的内容",
          "这是选项 B 的内容",
          "这是选项 C 的内容",
          "这是选项 D 的内容"
        ]
        question.answer = "A"
        break;
        
      case "multiple_answer":
        question.content = `在${courseName}中，以下哪些选项是正确的？（多选）`
        question.options = [
          "这是选项 A 的内容",
          "这是选项 B 的内容",
          "这是选项 C 的内容",
          "这是选项 D 的内容"
        ]
        question.answer = "A,C"
        break;
        
      case "fill_blank":
        question.content = `在${courseName}中，________ 是一个重要的概念。`
        question.answer = "某个概念名称"
        break;
        
      case "short_answer":
        question.content = `简述${courseName}中的一个核心原理。`
        question.answer = "这是一个关于核心原理的简要回答。由于API返回数据解析错误，这是一个示例答案。"
        break;
        
      case "true_false":
        question.content = `在${courseName}中，某个概念是最基础的概念之一。这个说法是正确的吗？`
        question.answer = "正确"
        break;
    }
    
    questions.push(question)
  }
  
  return questions
} 