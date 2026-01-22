'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Loader2,
  Copy,
  Check,
  Tag,
  History,
  Dices,
  Paintbrush,
  FlaskConical,
  Trash2,
  Play,
  ImageUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { showcaseData } from './data/showcase'

// 预设风格标签
const MAGIC_TAGS = ['赛博朋克', '宫崎骏风格', '8k分辨率', '超写实', '极简主义', '皮克斯风格']

// 随机灵感预设提示词
const RANDOM_PROMPTS = [
  'A serene Japanese garden at sunset with cherry blossoms, 8k resolution, cinematic lighting',
  'A futuristic cyberpunk cityscape at night with neon lights and flying vehicles, highly detailed',
  'A whimsical fantasy forest with magical creatures, Studio Ghibli style, vibrant colors',
  'An ultra-realistic portrait of a wise old wizard, photorealistic, dramatic lighting',
  'A minimalist geometric landscape with bold colors and clean lines, modern art style'
]

// 历史记录类型
interface HistoryItem {
  id: string
  input: string
  output: string
  timestamp: number
}

export default function Home() {
  const [inputText, setInputText] = useState('')
  const [optimizedPrompt, setOptimizedPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [model, setModel] = useState<'mj' | 'sd'>('mj')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // 加载历史记录
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedHistory = localStorage.getItem('prompt-history')
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory) as HistoryItem[]
          setHistory(parsed.slice(0, 5)) // 只保留最近5条
        }
      } catch (err) {
        console.error('加载历史记录失败:', err)
      }
    }
  }, [])

  // 保存历史记录到 localStorage
  const saveToHistory = (input: string, output: string) => {
    if (typeof window === 'undefined') return

    try {
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        input,
        output,
        timestamp: Date.now(),
      }

      const existingHistory = localStorage.getItem('prompt-history')
      let historyList: HistoryItem[] = []

      if (existingHistory) {
        try {
          historyList = JSON.parse(existingHistory) as HistoryItem[]
        } catch {
          historyList = []
        }
      }

      // 添加到开头，只保留最近5条
      const updatedHistory = [newItem, ...historyList].slice(0, 5)
      localStorage.setItem('prompt-history', JSON.stringify(updatedHistory))
      setHistory(updatedHistory)
    } catch (err) {
      console.error('保存历史记录失败:', err)
    }
  }

  // 处理标签点击
  const handleTagClick = (tag: string) => {
    setInputText((prev) => {
      if (prev.trim()) {
        return `${prev} ${tag}`
      }
      return tag
    })
  }

  // 随机灵感
  const handleRandomPrompt = () => {
    const randomPrompt = RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)]
    setInputText(randomPrompt)
  }

  // 加载历史记录到输入框
  const handleLoadHistory = (item: HistoryItem) => {
    setInputText(item.input)
    setOptimizedPrompt(item.output)
    setShowHistory(false)
  }

  // 处理画廊卡片点击
  const handleGalleryClick = (prompt: string) => {
    setInputText(prompt)
    setOptimizedPrompt('')
    setError('')
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.success('已加载提示词到输入框')
  }

  // 清空输入和参数
  const handleClear = () => {
    setInputText('')
    setOptimizedPrompt('')
    setNegativePrompt('')
    setAspectRatio('16:9')
    setError('')
  }

  // 将图片转换为 Base64
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // 处理图片上传和反推
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 检查文件大小（4MB = 4 * 1024 * 1024 bytes）
    const maxSize = 4 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('图片太大了，请压缩后上传（最大 4MB）')
      // 清空 input，允许重新选择同一文件
      event.target.value = ''
      return
    }

    setIsUploading(true)
    toast.loading('正在分析图片，AI 思考中...', { id: 'image-upload' })

    try {
      // 转换为 Base64
      const base64Image = await convertImageToBase64(file)

      // 调用反推 API
      const response = await fetch('/api/describe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '反推失败，请稍后重试')
      }

      if (!data.prompt || typeof data.prompt !== 'string') {
        throw new Error('未能获取提示词')
      }

      // 自动填入输入框
      setInputText(data.prompt)
      // 切换到 MJ 模型（反推通常用于 MJ）
      setModel('mj')
      // 清空错误
      setError('')

      toast.success('反推成功！已填入输入框', { id: 'image-upload' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发生未知错误'
      toast.error(errorMessage, { id: 'image-upload' })
      setError(errorMessage)
    } finally {
      setIsUploading(false)
      // 清空 input，允许重新选择同一文件
      event.target.value = ''
    }
  }

  const handleOptimize = async () => {
    if (!inputText.trim()) {
      setError('请输入您的需求')
      return
    }

    setIsLoading(true)
    setError('')
    setOptimizedPrompt('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: inputText,
          model,
          aspectRatio: model === 'mj' ? aspectRatio : undefined,
          negativePrompt: model === 'sd' ? negativePrompt : undefined,
        }),
      })

      const data = (await response.json()) as
        | { error?: string }
        | { model: 'mj'; prompt: string }
        | { model: 'sd'; positivePrompt: string; negativePrompt: string }

      if (!response.ok) {
        throw new Error(('error' in data && data.error) || '生成失败，请稍后重试')
      }

      const finalPrompt =
        'model' in data && data.model === 'sd'
          ? `Positive: ${data.positivePrompt}\nNegative: ${data.negativePrompt}`
          : 'prompt' in data
            ? data.prompt
            : ''

      if (!finalPrompt) {
        throw new Error('未能生成结果，请稍后重试')
      }

      setOptimizedPrompt(finalPrompt)
      // 保存到历史记录
      saveToHistory(inputText, finalPrompt)
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(optimizedPrompt)
      toast.success('已复制到剪贴板！')
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error('复制失败:', err)
      toast.error('复制失败，请重试')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-8 md:mb-12">
          AI 提示词优化器
        </h1>

        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-stretch">
          {/* 左侧：输入框 */}
          <div className="flex-1">
            <div className="flex flex-col gap-3 mb-2">
              <div className="flex items-center justify-between">
                <div className="inline-flex p-1 bg-slate-800/60 border border-slate-700 rounded-lg">
                  <button
                    onClick={() => setModel('mj')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                      model === 'mj'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    <Paintbrush className="w-4 h-4" />
                    Midjourney 🎨
                  </button>
                  <button
                    onClick={() => setModel('sd')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                      model === 'sd'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    <FlaskConical className="w-4 h-4" />
                    Stable Diffusion 🧪
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 rounded-lg transition-all duration-200 cursor-pointer ${
                      isUploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ImageUp className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploading ? '分析中...' : '上传参考图'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handleRandomPrompt}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 rounded-lg transition-all duration-200"
                    title="随机灵感"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>随机灵感</span>
                  </button>
                </div>
              </div>
              <label className="block text-slate-300 text-sm">原始需求</label>
            </div>
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="例如：画一只猫"
                className="w-full h-64 md:h-80 lg:h-96 p-4 pr-10 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              {inputText && (
                <button
                  onClick={handleClear}
                  className="absolute bottom-4 right-4 p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-md transition-all duration-200"
                  title="清空"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* 模型专属区域 */}
            {model === 'mj' && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-slate-400">画面比例 (MJ)</span>
                </div>
                <div className="flex gap-2">
                  {['1:1', '16:9', '9:16', '4:3'].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-3 py-1.5 text-sm rounded-md border transition-all ${
                        aspectRatio === ratio
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                          : 'text-slate-300 bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-700/50'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {model === 'sd' && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">负面提示词 (Negative Prompt)</span>
                </div>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="不想看到什么？例如：ugly, blurry..."
                  className="w-full h-28 p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
            )}
            {/* 预设风格标签 */}
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400">预设风格</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {MAGIC_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="px-3 py-1.5 text-sm text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 rounded-full whitespace-nowrap transition-all duration-200 hover:scale-105"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 中间：按钮 */}
          <div className="flex lg:flex-col justify-center items-center lg:justify-center">
            <button
              onClick={handleOptimize}
              disabled={isLoading}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isLoading ? '生成中...' : '生成/优化'}
            </button>
          </div>

          {/* 右侧：输出框 */}
          <div className="flex-1 relative">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-slate-300 text-sm">优化后的提示词</label>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 rounded-lg transition-all duration-200"
                title="历史记录"
              >
                <History className="w-3.5 h-3.5" />
                <span>历史记录</span>
                {history.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full min-w-[18px] text-center">
                    {history.length}
                  </span>
                )}
              </button>
            </div>
            <div className="relative">
              <textarea
                value={optimizedPrompt}
                readOnly
                placeholder={
                  model === 'mj'
                    ? '优化后的 Midjourney 提示词将显示在这里'
                    : '格式化后的 Stable Diffusion 提示词将显示在这里'
                }
                className="w-full h-64 md:h-80 lg:h-96 p-4 pr-14 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none resize-none font-mono text-sm"
              />
              {optimizedPrompt && (
                <button
                  onClick={handleCopy}
                  className="absolute top-4 right-4 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-1.5 group"
                  title="复制到剪贴板"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-medium">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-xs font-medium">复制</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 历史记录面板 */}
        {showHistory && (
          <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="text-slate-300 font-semibold">最近记录</h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                关闭
              </button>
            </div>
            {history.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">暂无历史记录</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadHistory(item)}
                    className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg cursor-pointer hover:border-slate-600 hover:bg-slate-900/70 transition-all duration-200"
                  >
                    <div className="text-xs text-slate-500 mb-1">
                      {new Date(item.timestamp).toLocaleString('zh-CN')}
                    </div>
                    <div className="text-sm text-slate-300 mb-2 line-clamp-2">
                      {item.input}
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-2">
                      {item.output}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-center">
            {error}
          </div>
        )}

        {/* 灵感画廊 */}
        <section className="mt-20">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">
            ✨ 探索灵感
          </h2>
          <p className="text-slate-400 text-center mb-8 text-sm md:text-base">
            Explore Ideas
          </p>
          <PromptGallery onCardClick={handleGalleryClick} />
        </section>

        {/* 页脚 */}
        <Footer />
      </div>
    </main>
  )
}

// 灵感画廊组件
function PromptGallery({ onCardClick }: { onCardClick: (prompt: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {showcaseData.map((item) => (
        <div
          key={item.id}
          className="group relative bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600 hover:bg-white/10 transition-all duration-300 cursor-pointer"
          onClick={() => onCardClick(item.prompt)}
        >
          {/* 上半部分：有 image 时显示图片，否则渐变色背景兜底 */}
          <div className="h-32 relative overflow-hidden">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color}`}>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
              </div>
            )}
          </div>

          {/* 内容区域 */}
          <div className="p-4">
            <h3 className="text-white font-semibold mb-3 text-lg">{item.title}</h3>

            {/* 标签 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 text-xs bg-slate-800/50 text-slate-300 rounded-full border border-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* 试一试按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCardClick(item.prompt)
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
            >
              <Play className="w-4 h-4" />
              <span>试一试</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// 页脚组件
function Footer() {
  return (
    <footer className="mt-20 pt-8 pb-8 border-t border-slate-800">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-slate-400 text-sm">
          Created with ❤️ by{' '}
          <a
            href="https://github.com/3511601569/prompt-app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors underline"
          >
            溏心蛋
          </a>
        </div>
        <a
          href="/images/reward.jpg"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <span>🥛</span>
          <span>帮我买瓶旺仔🥛</span>
        </a>
      </div>
    </footer>
  )
}
