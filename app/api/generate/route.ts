import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

const MJ_SYSTEM_PROMPT =
  '你是一个 Midjourney 提示词专家。请将用户的简单描述扩充为结构化的英文提示词，包含主体描述、环境光影、艺术风格、镜头参数等。只输出英文提示词本体，不要包含任何解释、编号、引号，也不要包含 --ar/--v 等参数。'

const SD_SYSTEM_PROMPT =
  '你是一个 Stable Diffusion 提示词专家。请将用户的简单描述扩写为高质量的英文 Positive Prompt，包含主体、细节、材质、光影、构图、镜头/摄影参数、风格等。只输出 Positive Prompt，不要包含 Negative Prompt，不要包含任何解释、编号、引号。'

type GenerateRequestBody = {
  prompt: string
  model: 'mj' | 'sd'
  aspectRatio?: string
  negativePrompt?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<GenerateRequestBody>
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    const model = body.model

    if (!prompt) {
      return NextResponse.json({ error: '请输入有效的提示词' }, { status: 400 })
    }
    if (model !== 'mj' && model !== 'sd') {
      return NextResponse.json({ error: '无效的模型参数' }, { status: 400 })
    }
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'API Key 未配置，请在 .env.local 中设置 DEEPSEEK_API_KEY' },
        { status: 500 }
      )
    }

    const systemPrompt = model === 'mj' ? MJ_SYSTEM_PROMPT : SD_SYSTEM_PROMPT

    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content?.trim() ?? ''
    if (!content) {
      return NextResponse.json({ error: '未能生成结果' }, { status: 500 })
    }

    if (model === 'mj') {
      const aspectRatio =
        typeof body.aspectRatio === 'string' && body.aspectRatio.trim()
          ? body.aspectRatio.trim()
          : '16:9'
      const finalPrompt = `${content} --ar ${aspectRatio} --v 6.0`
      return NextResponse.json({ model: 'mj', prompt: finalPrompt })
    }

    const negativePrompt =
      typeof body.negativePrompt === 'string' ? body.negativePrompt.trim() : ''
    return NextResponse.json({
      model: 'sd',
      positivePrompt: content,
      negativePrompt,
    })
  } catch (error) {
    console.error('Generate API Error:', error)

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `API 错误: ${error.message}` },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 })
  }
}

