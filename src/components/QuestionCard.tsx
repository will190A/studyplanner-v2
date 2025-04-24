'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface QuestionOption {
  label: string
  text: string
}

interface QuestionProps {
  id: string
  title: string
  content: string
  type: 'choice' | 'multiple' | 'judge' | 'fill' | 'code' | 'short_answer'
  options?: QuestionOption[]
  onAnswer: (questionId: string, answer: string | string[]) => void
  userAnswer?: string | string[]
  isRevealed?: boolean
  isCorrect?: boolean
  correctAnswer?: string | string[]
  explanation?: string
  disabled?: boolean
  onSelfJudge?: (questionId: string, judgment: boolean) => void
  selfJudged?: boolean
}

export default function QuestionCard({
  id,
  title,
  content,
  type,
  options = [],
  onAnswer,
  userAnswer,
  isRevealed = false,
  isCorrect,
  correctAnswer,
  explanation,
  disabled = false,
  onSelfJudge,
  selfJudged
}: QuestionProps) {
  const [answer, setAnswer] = useState<string | string[]>(userAnswer || (type === 'multiple' ? [] : ''))
  
  const handleSingleOptionChange = (value: string) => {
    setAnswer(value)
    onAnswer(id, value)
  }
  
  const handleMultipleOptionChange = (value: string, checked: boolean) => {
    let newAnswer: string[]
    
    if (Array.isArray(answer)) {
      if (checked) {
        newAnswer = [...answer, value]
      } else {
        newAnswer = answer.filter(item => item !== value)
      }
    } else {
      newAnswer = checked ? [value] : []
    }
    
    setAnswer(newAnswer)
    onAnswer(id, newAnswer)
  }
  
  const handleTextAnswer = (value: string) => {
    setAnswer(value)
    onAnswer(id, value)
  }

  const handleSelfJudge = (judgment: boolean) => {
    if (onSelfJudge) {
      onSelfJudge(id, judgment)
    }
  }
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg font-semibold select-none">
          <div>
            {type === 'choice' && <span className="badge bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded-full mr-2">单选题</span>}
            {type === 'multiple' && <span className="badge bg-purple-100 text-purple-800 text-xs py-1 px-2 rounded-full mr-2">多选题</span>}
            {type === 'judge' && <span className="badge bg-green-100 text-green-800 text-xs py-1 px-2 rounded-full mr-2">判断题</span>}
            {type === 'fill' && <span className="badge bg-orange-100 text-orange-800 text-xs py-1 px-2 rounded-full mr-2">填空题</span>}
            {type === 'code' && <span className="badge bg-gray-100 text-gray-800 text-xs py-1 px-2 rounded-full mr-2">编程题</span>}
            {type === 'short_answer' && <span className="badge bg-gray-100 text-gray-800 text-xs py-1 px-2 rounded-full mr-2">简答题</span>}
            {title}
          </div>
          {isRevealed && type !== 'short_answer' && (
            isCorrect ? (
              <span className="flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-1" />
                答对了
              </span>
            ) : (
              <span className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-1" />
                答错了
              </span>
            )
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-gray-700 whitespace-pre-line select-none">{content}</div>
          
          {/* 根据题目类型显示不同的答题界面 */}
          {type === 'choice' && options && options.length > 0 && (
            <RadioGroup 
              value={answer as string} 
              onValueChange={handleSingleOptionChange}
              disabled={disabled}
            >
              <div className="space-y-2">
                {options.map((option) => (
                  <div key={option.label} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option.label} 
                      id={`${id}-${option.label}`}
                      disabled={disabled}
                    />
                    <Label 
                      htmlFor={`${id}-${option.label}`}
                      className={`
                        ${isRevealed && correctAnswer === option.label 
                          ? 'text-green-600 font-medium' 
                          : isRevealed && userAnswer === option.label && isCorrect === false
                            ? 'text-red-600 font-medium'
                            : ''}
                        select-none
                      `}
                    >
                      {option.label}. {option.text}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
          
          {type === 'multiple' && options && options.length > 0 && (
            <div className="space-y-2">
              {options.map((option) => (
                <div key={option.label} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`${id}-${option.label}`}
                    checked={Array.isArray(answer) && answer.includes(option.label)}
                    onCheckedChange={(checked) => 
                      handleMultipleOptionChange(option.label, checked as boolean)
                    }
                    disabled={disabled}
                  />
                  <Label 
                    htmlFor={`${id}-${option.label}`}
                    className={`
                      ${isRevealed && Array.isArray(correctAnswer) && correctAnswer.includes(option.label)
                        ? 'text-green-600 font-medium'
                        : isRevealed && Array.isArray(userAnswer) && userAnswer.includes(option.label) && 
                          Array.isArray(correctAnswer) && !correctAnswer.includes(option.label)
                          ? 'text-red-600 font-medium'
                          : ''}
                      select-none
                    `}
                  >
                    {option.label}. {option.text}
                  </Label>
                </div>
              ))}
            </div>
          )}
          
          {type === 'judge' && (
            <RadioGroup 
              value={answer as string} 
              onValueChange={handleSingleOptionChange}
              disabled={disabled}
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id={`${id}-true`} disabled={disabled} />
                  <Label 
                    htmlFor={`${id}-true`}
                    className={`
                      ${isRevealed && correctAnswer === 'true'
                        ? 'text-green-600 font-medium'
                        : isRevealed && userAnswer === 'true' && userAnswer !== correctAnswer
                          ? 'text-red-600 font-medium'
                          : ''}
                      select-none
                    `}
                  >
                    正确
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id={`${id}-false`} disabled={disabled} />
                  <Label 
                    htmlFor={`${id}-false`}
                    className={`
                      ${isRevealed && correctAnswer === 'false'
                        ? 'text-green-600 font-medium'
                        : isRevealed && userAnswer === 'false' && userAnswer !== correctAnswer
                          ? 'text-red-600 font-medium'
                          : ''}
                      select-none
                    `}
                  >
                    错误
                  </Label>
                </div>
              </div>
            </RadioGroup>
          )}
          
          {(type === 'fill' || type === 'code' || type === 'short_answer') && (
            <Textarea
              value={answer as string}
              onChange={(e) => handleTextAnswer(e.target.value)}
              placeholder={
                type === 'fill' ? "请输入答案" : 
                type === 'code' ? "请编写代码" : 
                "请输入简答题答案"
              }
              className="min-h-[100px]"
              disabled={disabled}
            />
          )}
          
          {/* 显示解析 */}
          {isRevealed && explanation && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <h4 className="font-semibold text-blue-900 select-none">答案解析：</h4>
              <div className="text-blue-800 mt-1 whitespace-pre-line select-none">{explanation}</div>
            </div>
          )}

          {/* 简答题自我判断 */}
          {type === 'short_answer' && isRevealed && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h4 className="font-semibold text-gray-900 select-none mb-2">自我判断：</h4>
              <div className="flex space-x-4">
                <Button
                  variant={selfJudged === true ? "default" : "outline"}
                  className={`${selfJudged === true ? "bg-green-500 hover:bg-green-600" : ""}`}
                  onClick={() => handleSelfJudge(true)}
                >
                  答对了
                </Button>
                <Button
                  variant={selfJudged === false ? "default" : "outline"}
                  className={`${selfJudged === false ? "bg-red-500 hover:bg-red-600" : ""}`}
                  onClick={() => handleSelfJudge(false)}
                >
                  答错了
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      {!isRevealed && (
        <CardFooter className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => onAnswer(id, answer)}
            disabled={
              disabled || 
              (answer === '') || 
              (Array.isArray(answer) && answer.length === 0)
            }
          >
            确认答案
          </Button>
        </CardFooter>
      )}
    </Card>
  )
} 