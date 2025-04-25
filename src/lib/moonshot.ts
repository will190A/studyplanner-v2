/**
 * Moonshot API 客户端
 * 用于调用 Moonshot API 生成题目
 */
export class MoonshotAPI {
  private apiKey: string
  private apiEndpoint: string

  constructor() {
    this.apiKey = process.env.MOONSHOT_API_KEY || ""
    this.apiEndpoint = process.env.MOONSHOT_API_ENDPOINT || "https://api.moonshot.cn/v1"
    if (!this.apiKey) {
      console.warn("MOONSHOT_API_KEY 环境变量未设置，将使用 mock 数据")
    }
  }

  /**
   * 生成题目
   * @param prompt 提示词
   * @returns 生成的内容
   */
  async generate(prompt: string): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error("Missing Moonshot API key")
      }

      const response = await fetch(`${this.apiEndpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "moonshot-v1-8k",
          messages: [
            {
              role: "system",
              content: "你是一个专业的教育工作者，擅长根据教材内容出题。你需要仔细阅读教材内容，确保生成的题目与内容相关，难度适中，答案准确。"
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error("Moonshot API error:", error)
      throw error // 不再使用 mockResponse，而是抛出错误
    }
  }

  /**
   * 生成 mock 数据
   * @param prompt 提示词
   * @returns mock 数据
   */
  private mockResponse(prompt: string): string {
    // 解析提示词以确定需要生成的题目类型和数量
    const courseNameMatch = prompt.match(/课程名称：(.+?)(\n|$)/)
    const courseName = courseNameMatch ? courseNameMatch[1].trim() : "计算机科学"
    
    const typesMatch = prompt.match(/题型要求：(.+?)(\n|$)/)
    const typesText = typesMatch ? typesMatch[1].trim() : "单选题、填空题、简答题"
    
    const countMatch = prompt.match(/题目数量：(\d+)道/)
    const numQuestions = countMatch ? parseInt(countMatch[1]) : 5
    
    // 解析内容和题型
    const hasContent = prompt.includes("教材内容：")
    const typesList = ["multiple_choice", "multiple_answer", "fill_blank", "short_answer", "true_false"]
    
    // 创建 mock 题目
    const questions = []
    
    for (let i = 0; i < numQuestions; i++) {
      // 循环使用题型
      const typeIndex = i % typesList.length
      const type = typesList[typeIndex]
      
      let question: any = {
        id: `mock-${Date.now()}-${i}`,
        type,
        content: "",
        answer: "",
        explanation: "这是一个自动生成的模拟解析，实际解析将由 AI 根据内容生成。",
        subject: courseName
      }
      
      // 根据题型生成不同内容
      switch (type) {
        case "multiple_choice":
          question.content = `在${courseName}中，以下哪一项是正确的描述？`
          question.options = [
            "选项 A 的内容",
            "选项 B 的内容",
            "选项 C 的内容",
            "选项 D 的内容"
          ]
          question.answer = "A"
          break;
          
        case "multiple_answer":
          question.content = `在${courseName}中，以下哪些选项是正确的？（多选）`
          question.options = [
            "选项 A 的内容",
            "选项 B 的内容",
            "选项 C 的内容",
            "选项 D 的内容"
          ]
          question.answer = "A,C"
          break;
          
        case "fill_blank":
          question.content = `在${courseName}中，________ 是一个重要的概念。`
          question.answer = "某个概念名称"
          break;
          
        case "short_answer":
          question.content = `简述${courseName}中的一个核心原理。`
          question.answer = "这是一个关于核心原理的简要回答，实际答案将包含更多专业内容。"
          break;
          
        case "true_false":
          question.content = `在${courseName}中，某个概念是最基础的概念之一。这个说法是正确的吗？`
          question.answer = "正确"
          break;
      }
      
      questions.push(question)
    }
    
    return JSON.stringify({ questions })
  }
} 