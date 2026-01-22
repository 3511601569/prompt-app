import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: '请提供有效的图片数据' },
        { status: 400 }
      )
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'API Token 未配置，请在 .env.local 中设置 REPLICATE_API_TOKEN' },
        { status: 500 }
      )
    }

    // 处理图片数据：支持 base64 字符串或 data URL
    let imageData = image
    // 如果是不带 data: 前缀的 base64 字符串，转换为 data URL
    if (!image.startsWith('data:') && !image.startsWith('http')) {
      imageData = `data:image/png;base64,${image}`
    }

    // 调用 Replicate 模型进行图片反推
    const output = await replicate.run(
      'methexis-inc/img2prompt:50adaf2d3ad20a6f911a8a9e3ccf777b263b8596f7047d685e3cbf4c6362b638',
      {
        input: {
          image: imageData,
        },
      }
    )

    // 模型返回的结果通常是字符串
    const prompt = typeof output === 'string' ? output : String(output)

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: '未能生成提示词，请重试' },
        { status: 500 }
      )
    }

    return NextResponse.json({ prompt: prompt.trim() })
  } catch (error) {
    console.error('Describe API Error:', error)

    // 处理 Replicate 特定的错误
    if (error && typeof error === 'object' && 'message' in error) {
      return NextResponse.json(
        { error: `API 错误: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
