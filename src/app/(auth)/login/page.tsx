"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

const formSchema = z.object({
  email: z.string().email({
    message: "请输入有效的邮箱地址",
  }),
  password: z.string().min(1, {
    message: "请输入密码",
  }),
})

type FormValues = z.infer<typeof formSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()
  
  // 获取回调URL
  const callbackUrl = searchParams?.get("callbackUrl") || "/home"
  
  useEffect(() => {
    if (searchParams?.get("registered") === "true") {
      toast({
        title: "注册成功",
        description: "请使用您的邮箱和密码登录",
        duration: 5000,
      })
    }
  }, [searchParams, toast])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: FormValues) {
    setIsLoading(true)
    setError("")

    try {
      console.log(`[LoginPage] 尝试登录，登录后将重定向到: ${callbackUrl}`)
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        console.error(`[LoginPage] 登录失败: ${result.error}`)
        setError("邮箱或密码错误")
      } else {
        console.log(`[LoginPage] 登录成功，重定向到: ${callbackUrl}`)
        
        // 尝试获取localStorage中保存的重定向URL
        let redirectPath = callbackUrl
        if (typeof window !== 'undefined') {
          const savedRedirect = localStorage.getItem('redirectAfterLogin')
          if (savedRedirect) {
            redirectPath = savedRedirect
            localStorage.removeItem('redirectAfterLogin') // 使用后移除
            console.log(`[LoginPage] 使用localStorage中保存的重定向URL: ${redirectPath}`)
          }
        }
        
        router.push(decodeURIComponent(redirectPath))
        router.refresh()
      }
    } catch (error) {
      console.error(`[LoginPage] 登录异常:`, error)
      setError("登录时出现错误，请稍后再试")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-[450px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">登录</CardTitle>
          <CardDescription>
            输入您的邮箱和密码登录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                    <div className="text-sm text-right">
                      <Link href="/forgot-password" className="text-primary hover:underline">
                        忘记密码?
                      </Link>
                    </div>
                  </FormItem>
                )}
              />
              {error && (
                <div className="text-sm font-medium text-destructive">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "登录中..." : "登录"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-center">
            没有账号？{" "}
            <Link href="/register" className="text-primary underline-offset-4 hover:underline">
              注册
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 