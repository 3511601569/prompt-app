'use client'

import { useState } from 'react'
import { Loader2, Copy, Check } from 'lucide-react'

export default function Home() {
  const [inputText, setInputText] = useState('')
  const [optimizedPrompt, setOptimizedPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

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
            <label className="block text-slate-300 text-sm mb-2">原始需求</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="例如：画一只猫"
              className="w-full h-64 md:h-80 lg:h-96 p-4 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
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
