'use client'

import { useState, useEffect } from 'react'
import { Loader2, Copy, Check, Tag, History, Dices } from 'lucide-react'

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
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)

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

  const handleOptimize = async () => {
    if (!inputText.trim()) {
      setError('请输入您的需求')
      return
    }

    setIsLoading(true)
    setError('')
    setOptimizedPrompt('')

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: inputText }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '优化失败，请稍后重试')
      }

      setOptimizedPrompt(data.optimizedPrompt)
      // 保存到历史记录
      saveToHistory(inputText, data.optimizedPrompt)
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(optimizedPrompt)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error('复制失败:', err)
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
            <div className="flex justify-between items-center mb-2">
              <label className="block text-slate-300 text-sm">原始需求</label>
              <button
                onClick={handleRandomPrompt}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 rounded-lg transition-all duration-200"
                title="随机灵感"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>随机灵感</span>
              </button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="例如：画一只猫"
              className="w-full h-64 md:h-80 lg:h-96 p-4 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
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
                placeholder="优化后的 Midjourney 提示词将显示在这里"
                className="w-full h-64 md:h-80 lg:h-96 p-4 pr-12 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none resize-none"
              />
              {optimizedPrompt && (
                <button
                  onClick={handleCopy}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors duration-200 rounded-md hover:bg-slate-700/50"
                  title={copied ? '已复制！' : '复制到剪贴板'}
                >
                  {copied ? (
                    <div className="flex items-center gap-1 text-green-400">
                      <Check className="w-4 h-4" />
                      <span className="text-xs">已复制</span>
                    </div>
                  ) : (
                    <Copy className="w-4 h-4" />
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
      </div>
    </main>
  )
}
