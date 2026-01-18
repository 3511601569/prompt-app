import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

const SYSTEM_PROMPT = '你是一个 Midjourney 提示词专家。请将用户的简单描述扩充为结构化的英文提示词，包含主体描述、环境光影、艺术风格、镜头参数等。直接输出提示词，不要包含其他解释。'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: '请输入有效的提示词' },
        { status: 400 }
      )
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'API Key 未配置，请在 .env.local 中设置 DEEPSEEK_API_KEY' },
        { status: 500 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    })

    const optimizedPrompt = completion.choices[0]?.message?.content || ''

    if (!optimizedPrompt) {
      return NextResponse.json(
        { error: '未能生成优化后的提示词' },
        { status: 500 }
      )
    }

    return NextResponse.json({ optimizedPrompt })
  } catch (error) {
    console.error('API Error:', error)
    
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `API 错误: ${error.message}` },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
