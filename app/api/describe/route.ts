import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: '请提供有效的图片数据' },
        { status: 400 }
      )
    }

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Google API Key 未配置，请在 .env.local 中设置 GOOGLE_API_KEY' },
        { status: 500 }
      )
    }

    // 初始化 Gemini 模型
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // 处理图片数据：去掉 base64 头部
    let base64Data = image
    let mimeType = 'image/jpeg' // 默认

    // 如果是 data URL，提取 base64 数据和 MIME 类型
    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/)
      if (match) {
        mimeType = match[1]
        base64Data = match[2]
      }
    } else if (image.startsWith('http')) {
      // 如果是 URL，直接使用（虽然前端应该是 base64）
      return NextResponse.json(
        { error: '请提供 base64 格式的图片数据' },
        { status: 400 }
      )
    }

    // 创建图片数据对象
    const imageData = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    }

    // 设置 prompt
    const prompt = 'Detailed description of this image for AI art generation, include style, lighting, composition, focus on visual elements, no conversational filler.'

    // 调用 Gemini 生成内容
    const result = await model.generateContent([prompt, imageData])
    const response = await result.response
    const description = response.text()

    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { error: '未能生成提示词，请重试' },
        { status: 500 }
      )
    }

    return NextResponse.json({ prompt: description.trim() })
  } catch (error) {
    console.error('Gemini API Error:', error)

    // 处理 Gemini 特定的错误
    if (error && typeof error === 'object' && 'message' in error) {
      const message = error.message as string

      // 处理常见的 Gemini 错误
      if (message.includes('API_KEY_INVALID')) {
        return NextResponse.json(
          { error: 'API Key 无效，请检查 GOOGLE_API_KEY 配置' },
          { status: 500 }
        )
      } else if (message.includes('QUOTA_EXCEEDED')) {
        return NextResponse.json(
          { error: 'API 配额不足，请稍后重试' },
          { status: 429 }
        )
      } else if (message.includes('SAFETY')) {
        return NextResponse.json(
          { error: '图片内容被安全策略拒绝' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: `Gemini API 错误: ${message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
